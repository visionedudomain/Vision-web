"use strict";

const { getDb, verifyAdminRequest } = require("./_lib/firebase");
const { createPasswordRecord, normalizeLoginName } = require("./_lib/test-auth");
const { json, noContent, readJsonBody } = require("./_lib/http");
const { REGISTRATIONS_COLLECTION, STUDENTS_COLLECTION, clean, normalizeLanguage, getRegistrationByLoginName, getStudentByLoginName } = require("./_lib/test-data");

async function approveSingle(db, payload) {
  const registrationId = clean(payload.registrationId);
  const loginName = clean(payload.loginName);
  const lookupLogin = normalizeLoginName(loginName);

  let registrationSnapshot = null;
  if (registrationId) {
    registrationSnapshot = await db.collection(REGISTRATIONS_COLLECTION).doc(registrationId).get();
  } else if (lookupLogin) {
    const found = await getRegistrationByLoginName(db, lookupLogin);
    registrationSnapshot = found ? await db.collection(REGISTRATIONS_COLLECTION).doc(found.id).get() : null;
  }

  if (!registrationSnapshot || !registrationSnapshot.exists) {
    throw new Error("Registration record not found.");
  }

  const registration = registrationSnapshot.data() || {};
  const loginNameNormalized = normalizeLoginName(payload.loginName || registration.loginName);
  const passwordHash = clean(registration.passwordHash);
  const passwordSalt = clean(registration.passwordSalt);
  if (!loginNameNormalized || !passwordHash || !passwordSalt) {
    throw new Error("Registration is missing login credentials.");
  }

  const [existingStudent, existingRegistration] = await Promise.all([
    getStudentByLoginName(db, loginNameNormalized),
    getRegistrationByLoginName(db, loginNameNormalized)
  ]);

  if (existingStudent && existingStudent.id !== registrationSnapshot.id) {
    throw new Error("This login name is already used by another approved student.");
  }

  if (existingRegistration && existingRegistration.id !== registrationSnapshot.id) {
    throw new Error("This login name is already used by another registration.");
  }

  const studentRef = db.collection(STUDENTS_COLLECTION).doc(registrationSnapshot.id);
  const now = new Date().toISOString();
  const resolvedLoginName = clean(payload.loginName || registration.loginName);
  await studentRef.set({
    registrationId: registrationSnapshot.id,
    displayName: clean(payload.displayName || registration.displayName),
    loginName: resolvedLoginName,
    loginNameNormalized,
    mobile: clean(payload.mobile || registration.mobile),
    language: normalizeLanguage(payload.language || registration.language),
    batchName: clean(payload.batchName || registration.batchName),
    examName: clean(payload.examName || registration.examName),
    status: clean(payload.status || "approved") === "inactive" ? "inactive" : "approved",
    passwordHash,
    passwordSalt,
    approvedAt: registration.approvedAt || now,
    passwordUpdatedAt: registration.passwordUpdatedAt || registration.updatedAt || registration.createdAt || now,
    updatedAt: now
  }, { merge: true });

  await registrationSnapshot.ref.set({
    loginName: resolvedLoginName,
    loginNameNormalized,
    language: normalizeLanguage(payload.language || registration.language),
    batchName: clean(payload.batchName || registration.batchName),
    examName: clean(payload.examName || registration.examName),
    status: "approved",
    approvedAt: now,
    updatedAt: now
  }, { merge: true });
}

async function bulkApprove(db, rows) {
  const list = Array.isArray(rows) ? rows : [];
  let processed = 0;

  for (const row of list) {
    const loginName = clean(row.loginName);
    const status = clean(row.status || "approved").toLowerCase();
    if (!loginName || (status !== "approved" && status !== "inactive")) {
      continue;
    }
    await approveSingle(db, {
      loginName,
      language: row.language,
      batchName: row.batchName,
      examName: row.examName,
      status
    });
    processed += 1;
  }

  return processed;
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    await verifyAdminRequest(event);
    const db = getDb();
    const body = await readJsonBody(event);
    const action = clean(body.action);

    if (action === "approve") {
      await approveSingle(db, body);
      return json(200, { ok: true, message: "Student approved successfully." });
    }

    if (action === "bulkApprove") {
      const count = await bulkApprove(db, body.rows);
      return json(200, { ok: true, count, message: "Bulk student approval completed." });
    }

    if (action === "resetPassword") {
      const studentId = clean(body.studentId);
      const password = clean(body.password);
      if (!studentId || !password || password.length < 6) {
        return json(400, { error: "Student id and a password of at least 6 characters are required." });
      }
      const record = createPasswordRecord(password);
      await db.collection(STUDENTS_COLLECTION).doc(studentId).set({
        passwordHash: record.passwordHash,
        passwordSalt: record.passwordSalt,
        passwordUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return json(200, { ok: true, message: "Student password reset successfully." });
    }

    return json(400, { error: "Unsupported student action." });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to process student request." });
  }
};
