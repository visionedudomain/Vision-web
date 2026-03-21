"use strict";

const crypto = require("crypto");

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function base64urlEncode(value) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSessionSecret() {
  const secret = String(process.env.TEST_SESSION_SECRET || "").trim();
  if (!secret) {
    throw new Error("Missing TEST_SESSION_SECRET.");
  }
  return secret;
}

function normalizeLoginName(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password || ""), String(salt || ""), 120000, 64, "sha512").toString("hex");
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt)
  };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  if (!passwordSalt || !passwordHash) {
    return false;
  }
  const incoming = hashPassword(password, passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(incoming, "hex"), Buffer.from(String(passwordHash), "hex"));
}

function createStudentSession(payload) {
  const body = Object.assign({}, payload, {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  });
  const encodedPayload = base64urlEncode(JSON.stringify(body));
  const signature = crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
  return encodedPayload + "." + signature;
}

function verifyStudentSession(token) {
  const text = String(token || "").trim();
  const parts = text.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid student session.");
  }

  const encodedPayload = parts[0];
  const incomingSignature = parts[1];
  const expectedSignature = crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(incomingSignature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid student session.");
  }

  const payload = JSON.parse(base64urlDecode(encodedPayload));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Student session expired.");
  }
  return payload;
}

module.exports = {
  normalizeLoginName,
  createPasswordRecord,
  verifyPassword,
  createStudentSession,
  verifyStudentSession
};
