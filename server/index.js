"use strict";

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const { WebSocketServer } = require("ws");
const { createDatabase } = require("./database.js");
const { RoomManager } = require("./multiplayer.js");
const { sanitizeName } = require("../shared/simulation.js");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_PATHS = new Set([
  "/index.html",
  "/styles.css",
  "/game.js",
  "/shared/simulation.js"
]);
const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"]
]);

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function readJson(request, limit = 16_384) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("A requisição excedeu o limite permitido."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(request, response, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  if (!PUBLIC_PATHS.has(pathname)) {
    sendJson(response, 404, { error: "Arquivo não encontrado." });
    return;
  }
  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    sendJson(response, 403, { error: "Caminho inválido." });
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { error: "Arquivo não encontrado." });
      return;
    }
    const contentType = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Cache-Control": "no-cache"
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(filePath).pipe(response);
  });
}

function createEchoServer(options = {}) {
  const database = createDatabase({ path: options.databasePath || process.env.ECHO_DB_PATH });
  const roomManager = new RoomManager(database, { autoStart: true });
  const httpServer = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { ok: true, rooms: roomManager.listRooms().length });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/rooms") {
        sendJson(response, 200, { rooms: roomManager.listRooms() });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/rooms") {
        const body = await readJson(request);
        const room = roomManager.createRoom();
        sendJson(response, 201, { room: room.summary(), playerName: sanitizeName(body.name) });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/profile") {
        sendJson(response, 200, database.getProfile(url.searchParams.get("name")));
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/runs") {
        const body = await readJson(request);
        const result = database.saveRun(body);
        sendJson(response, 201, result);
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/upgrades") {
        const name = url.searchParams.get("name");
        const profile = database.getProfile(name);
        sendJson(response, 200, {
          resonance: profile.resonance,
          upgrades: profile.upgrades,
          costs: profile.upgradeCosts
        });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/upgrades") {
        const body = await readJson(request);
        const result = database.purchaseUpgrade(body.name, body.upgradeType);
        sendJson(response, 200, result);
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/shop") {
        const name = url.searchParams.get("name");
        sendJson(response, 200, database.getSkillShop(name));
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/shop/purchase") {
        const body = await readJson(request);
        const result = database.purchaseMutation(body.name, body.mutationId);
        sendJson(response, 200, result);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/shop/upgrade") {
        const body = await readJson(request);
        const result = database.upgradeMutation(body.name, body.mutationId);
        sendJson(response, 200, result);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/shop/loadout") {
        const body = await readJson(request);
        const result = database.saveLoadout(body.name, body.slots);
        sendJson(response, 200, { loadout: result });
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        sendJson(response, 404, { error: "Endpoint não encontrado." });
        return;
      }
      serveStatic(request, response, url);
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Não foi possível concluir a operação." });
    }
  });

  const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: 16_384 });
  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "/", "http://localhost");
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request);
    });
  });

  webSocketServer.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => { socket.isAlive = true; });
    socket.on("message", (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString("utf8"));
        roomManager.handleMessage(socket, message);
      } catch (error) {
        if (socket.readyState === 1) socket.send(JSON.stringify({ type: "error", message: error.message || "Mensagem inválida." }));
      }
    });
    socket.on("close", () => roomManager.disconnect(socket));
    socket.on("error", () => roomManager.disconnect(socket));
  });

  const heartbeat = setInterval(() => {
    for (const socket of webSocketServer.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30_000);

  return {
    database,
    httpServer,
    roomManager,
    webSocketServer,
    async start(port = Number(options.port ?? process.env.PORT ?? 4174), host = options.host || process.env.HOST || "0.0.0.0") {
      await new Promise((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(port, host, resolve);
      });
      return httpServer.address();
    },
    async close() {
      clearInterval(heartbeat);
      roomManager.stop();
      for (const socket of webSocketServer.clients) socket.terminate();
      await new Promise((resolve) => webSocketServer.close(resolve));
      if (httpServer.listening) await new Promise((resolve) => httpServer.close(resolve));
      database.close();
    }
  };
}

function localNetworkAddresses(port) {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(`http://${entry.address}:${port}`);
    }
  }
  return addresses;
}

if (require.main === module) {
  const app = createEchoServer();
  app.start().then((address) => {
    const port = typeof address === "object" && address ? address.port : 4174;
    console.log(`ECHO disponível em http://localhost:${port}`);
    for (const networkAddress of localNetworkAddresses(port)) console.log(`Rede local: ${networkAddress}`);
    console.log(`Banco local: ${app.database.path}`);
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

  async function shutdown() {
    await app.close();
    process.exit(0);
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

module.exports = { createEchoServer };
