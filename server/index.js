"use strict";

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const { WebSocketServer } = require("ws");
const { createDatabase } = require("./database.js");
const { RoomManager } = require("./multiplayer.js");
const { sanitizeName } = require("../shared/simulation.js");
const { createSession, authenticateRequest, authenticateWebSocket, setCookie, getClientIp } = require("./auth.js");
const { validateMessage } = require("./validation.js");
const { checkWsRateLimit, isRateLimited } = require("./rate-limit.js");

const ROOT = path.resolve(__dirname, "..");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "https://echo.vercel.app")
  .split(",").map((s) => s.trim());
console.log("[CORS] Allowed origins:", ALLOWED_ORIGINS);

const PUBLIC_FILES = new Set([
  "/index.html",
  "/styles.css",
  "/game.js",
  "/service-worker.js"
]);
const PUBLIC_DIRECTORIES = Object.freeze([
  "/core/",
  "/combat/",
  "/ui/",
  "/shared/",
  "/src/",
  "/assets/",
  "/audio/"
]);
const REQUIRED_BROWSER_ASSETS = Object.freeze([
  "index.html",
  "styles.css",
  "game.js",
  "service-worker.js",
  "assets/mobile-ui.css",
  "assets/mobile-ux.js",
  "assets/manifest.json",
  "assets/icons/icon-192.svg",
  "assets/icons/icon-512.svg",
  "core/events.js",
  "core/random.js",
  "core/runtime.js",
  "core/qa-panel.js",
  "shared/simulation.js"
]);
const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".woff2", "font/woff2"],
  [".woff", "font/woff"]
]);

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}

function readJson(request, limit = 16384) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Requisição excedeu limite."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new Error("JSON inválido.")); }
    });
    request.on("error", reject);
  });
}

function isPublicAsset(pathname) {
  if (PUBLIC_FILES.has(pathname)) return true;
  if (!PUBLIC_DIRECTORIES.some((prefix) => pathname.startsWith(prefix))) return false;
  return MIME_TYPES.has(path.extname(pathname).toLowerCase());
}

function resolvePublicAsset(pathname) {
  const relativePath = pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relativePath);
  if (filePath === ROOT || !filePath.startsWith(`${ROOT}${path.sep}`)) return null;
  return filePath;
}

function setCorsHeaders(response, origin) {
  if (!origin) return;
  const allowed = ALLOWED_ORIGINS.includes(origin) || (!IS_PRODUCTION && origin.startsWith("http://localhost"));
  if (!IS_PRODUCTION || allowed) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Max-Age", "86400");
  } else {
    console.error("[CORS] Blocked origin:", origin, "Allowed:", ALLOWED_ORIGINS);
  }
}

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}

function validateOrigin(request) {
  const origin = request.headers?.origin;
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin) || (!IS_PRODUCTION && origin.startsWith("http://localhost"));
}

function serveStatic(request, response, url) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  if (!isPublicAsset(pathname)) {
    sendJson(response, 404, { error: "Arquivo não encontrado." });
    return;
  }
  const filePath = resolvePublicAsset(pathname);
  if (!filePath) {
    sendJson(response, 403, { error: "Caminho inválido." });
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { error: "Arquivo não encontrado." });
      return;
    }
    const contentType = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    const cacheControl = pathname === "/service-worker.js" ? "no-cache, no-store, must-revalidate" : pathname === "/index.html" ? "no-cache" : "public, max-age=31536000, immutable";
    const headers = {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff"
    };
    if (pathname === "/service-worker.js") headers["Service-Worker-Allowed"] = "/";
    response.writeHead(200, headers);
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(filePath).pipe(response);
  });
}

function createEchoServer(options = {}) {
  const database = createDatabase({ databaseUrl: options.databaseUrl || process.env.DATABASE_URL });
  const roomManager = new RoomManager(database, { autoStart: true });

  const httpServer = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const clientIp = getClientIp(request);

    setSecurityHeaders(response);
    const origin = request.headers?.origin;
    setCorsHeaders(response, origin);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { ok: true, rooms: roomManager.listRooms().length, uptime: process.uptime() });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/auth/guest") {
        if (await isRateLimited("login", clientIp)) {
          sendJson(response, 429, { error: "Muitas tentativas. Aguarde." });
          return;
        }
        const body = await readJson(request);
        const name = sanitizeName(body.name || "Jogador");
        const session = await createSession(name);
        setCookie(response, "echo_session", session.token);
        sendJson(response, 200, { ok: true, guestId: session.guestId, name: session.displayName });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/auth/me") {
        const session = await authenticateRequest(request);
        if (!session) { sendJson(response, 401, { error: "Não autenticado." }); return; }
        sendJson(response, 200, { id: session.id, name: session.name, guest: session.guest });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/rooms") {
        sendJson(response, 200, { rooms: roomManager.listRooms().length ? roomManager.listRooms() : [] });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/rooms") {
        if (await isRateLimited("create_room", clientIp)) {
          sendJson(response, 429, { error: "Muitas salas criadas. Aguarde." });
          return;
        }
        const session = await authenticateRequest(request);
        const body = await readJson(request);
        const room = roomManager.createRoom();
        sendJson(response, 201, { room: room.summary(), playerName: sanitizeName(body.name || session?.name || "Jogador") });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/profile") {
        if (await isRateLimited("api_profile", clientIp)) {
          sendJson(response, 429, { error: "Muitas requisições." });
          return;
        }
        const session = await authenticateRequest(request);
        const name = url.searchParams.get("name") || session?.name;
        sendJson(response, 200, await database.getProfile(name));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/runs") {
        const body = await readJson(request);
        const result = await database.saveRun(body);
        sendJson(response, 201, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/preferences") {
        const body = await readJson(request);
        const result = await database.savePreferences(body.name, body.preferences);
        sendJson(response, 200, { preferences: result });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/upgrades") {
        const session = await authenticateRequest(request);
        const name = url.searchParams.get("name") || session?.name;
        const profile = await database.getProfile(name);
        sendJson(response, 200, { resonance: profile.resonance, upgrades: profile.upgrades, costs: profile.upgradeCosts });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/upgrades") {
        const body = await readJson(request);
        const result = await database.purchaseUpgrade(body.name, body.upgradeType);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/shop") {
        const session = await authenticateRequest(request);
        const name = url.searchParams.get("name") || session?.name;
        sendJson(response, 200, await database.getSkillShop(name));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/shop/purchase") {
        const body = await readJson(request);
        const result = await database.purchaseMutation(body.name, body.mutationId);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/shop/upgrade") {
        const body = await readJson(request);
        const result = await database.upgradeMutation(body.name, body.mutationId);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/shop/loadout") {
        const body = await readJson(request);
        const result = await database.saveLoadout(body.name, body.slots);
        sendJson(response, 200, { loadout: result });
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        sendJson(response, 404, { error: "Endpoint não encontrado." });
        return;
      }

      serveStatic(request, response, url);
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Erro interno." });
    }
  });

  const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: 16384 });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "/", "http://localhost");
    if (url.pathname !== "/server/ws") {
      socket.destroy();
      return;
    }

    if (!validateOrigin(request)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request);
    });
  });

  webSocketServer.on("connection", async (socket, request) => {
    const clientIp = getClientIp(request);
    socket.isAlive = true;
    socket.echoCreatedAt = Date.now();
    socket.echoIp = clientIp;
    socket.echoLastMessage = 0;
    socket.echoMessageCount = 0;

    const session = await authenticateWebSocket(request);
    socket.echoSession = session;

    socket.on("pong", () => { socket.isAlive = true; });

    socket.on("message", async (rawMessage) => {
      try {
        const now = Date.now();
        if (now - socket.echoLastMessage < 16) {
          socket.echoMessageCount++;
          if (socket.echoMessageCount > 50) {
            if (socket.readyState === 1) socket.send(JSON.stringify({ type: "error", message: "Limite de mensagens excedido." }));
            return;
          }
        } else {
          socket.echoMessageCount = 0;
        }
        socket.echoLastMessage = now;

        const message = JSON.parse(rawMessage.toString("utf8"));
        const validation = validateMessage(message);
        if (validation.error) {
          if (socket.readyState === 1) socket.send(JSON.stringify({ type: "error", message: validation.error }));
          return;
        }

        if (message.type !== "ping") {
          const rateCheck = await checkWsRateLimit(clientIp, socket.echoSession?.id);
          if (rateCheck.limited) {
            if (socket.readyState === 1) socket.send(JSON.stringify({ type: "error", message: rateCheck.reason }));
            return;
          }
        }

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
      if (socket.isAlive === false) { socket.terminate(); continue; }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);

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
      await database.close();
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
    console.log(`ECHO server disponível em http://localhost:${port}`);
    console.log(`WebSocket: ws://localhost:${port}/server/ws`);
    for (const networkAddress of localNetworkAddresses(port)) console.log(`Rede local: ${networkAddress}`);
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
