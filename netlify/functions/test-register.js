"use strict";

const { getDb } = require("./_lib/firebase");
const { createPasswordRecord, normalizeLoginName } = require("./_lib/test-auth");
const { json, noContent, readJsonBody } = require("./_lib/http");
const { REGISTRATIONS_COLLECTION, clean, normalizeLanguage, getRegistrationByLoginName, getStudentByLoginName } = require("./_lib/test-data");

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(event);
    const displayName = clean(body.displayName);
    const loginName = clean(body.loginName);
    const password = clean(body.password);
    const mobile = clean(body.mobile);
    const language = normalizeLanguage(body.language);
    const batchName = clean(body.batchName);
    const examName = clean(body.examName);

    if (!displayName || !loginName || !password || !mobile) {
      return json(400, { error: "Name, login name, password, and mobile number are required." });
    }

    if (password.length < 6) {
      return json(400, { error: "Password must be at least 6 characters." });
    }

    const loginNameNormalized = normalizeLoginName(loginName);
    if (!loginNameNormalized) {
      return json(400, { error: "Login name is invalid." });
    }

    const db = getDb();
    const [existingStudent, existingRegistration] = await Promise.all([
      getStudentByLoginName(db, loginNameNormalized),
      getRegistrationByLoginName(db, loginNameNormalized)
    ]);

    if (existingStudent) {
      return json(409, { error: "This login name is already approved for a student." });
    }

    if (existingRegistration && clean(existingRegistration.data.status) !== "rejected") {
      return json(409, { error: "This login name is already registered for test approval." });
    }

    const passwordRecord = createPasswordRecord(password);
    const now = new Date().toISOString();

    const saved = await db.collection(REGISTRATIONS_COLLECTION).add({
      displayName,
      loginName,
      loginNameNormalized,
      mobile,
      language,
      batchName,
      examName,
      status: "pending",
      passwordHash: passwordRecord.passwordHash,
      passwordSalt: passwordRecord.passwordSalt,
      createdAt: now,
      updatedAt: now
    });

    return json(200, {
      ok: true,
      registrationId: saved.id,
      message: "Online test registration submitted successfully."
    });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to register right now." });
  }
};
