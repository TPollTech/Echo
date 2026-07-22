"use strict";

const crypto = require("node:crypto");
const { setSession, getSession } = require("./redis.js");

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_TTL = 86400 * 7;

function signToken(payload) {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
  return Buffer.from(data).toString("base64url") + "." + hmac;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  try {
    const [dataB64, sig] = token.split(".");
    const data = Buffer.from(dataB64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function generateGuestId() {
  return "guest_" + crypto.randomBytes(8).toString("hex");
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=").trim();
  }
  return cookies;
}

function setCookie(response, name, value, maxAge = SESSION_TTL) {
  const cookie = `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
  const existing = response.getHeader("Set-Cookie");
  if (existing) {
    response.setHeader("Set-Cookie", Array.isArray(existing) ? [...existing, cookie] : [existing, cookie]);
  } else {
    response.setHeader("Set-Cookie", cookie);
  }
}

async function createSession(displayName) {
  const guestId = generateGuestId();
  const token = signToken({ id: guestId, name: displayName, guest: true, created: Date.now() });
  await setSession(token, { id: guestId, name: displayName, guest: true });
  return { token, guestId, displayName };
}

async function authenticateRequest(request) {
  const cookies = parseCookies(request.headers?.cookie);
  const token = cookies.echo_session;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await getSession(token);
  if (!session) return null;

  return { ...session, token };
}

async function authenticateWebSocket(request) {
  const cookies = parseCookies(request.headers?.cookie);
  const token = cookies.echo_session;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await getSession(token);
  if (!session) return null;

  return { ...session, token };
}

function getClientIp(request) {
  return request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim()
    || request.headers?.["x-real-ip"]
    || request.socket?.remoteAddress
    || "unknown";
}

module.exports = {
  createSession,
  authenticateRequest,
  authenticateWebSocket,
  parseCookies,
  setCookie,
  signToken,
  verifyToken,
  generateGuestId,
  getClientIp
};
