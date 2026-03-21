"use strict";

const admin = require("firebase-admin");

let appInstance = null;

function readServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
  }

  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64.");
}

function getAdminApp() {
  if (appInstance) {
    return appInstance;
  }

  const serviceAccount = readServiceAccount();
  appInstance = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

  return appInstance;
}

function getDb() {
  return getAdminApp().firestore();
}

function getAuth() {
  return getAdminApp().auth();
}

async function verifyAdminRequest(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    throw new Error("Missing admin authorization token.");
  }

  const decoded = await getAuth().verifyIdToken(token);
  const expectedEmail = String(process.env.VISION_ADMIN_EMAIL || "visionedudomain@gmail.com").trim().toLowerCase();
  const userEmail = String(decoded.email || "").trim().toLowerCase();

  if (!userEmail || userEmail !== expectedEmail) {
    throw new Error("Admin access denied.");
  }

  return decoded;
}

module.exports = {
  admin,
  getDb,
  getAuth,
  verifyAdminRequest
};
