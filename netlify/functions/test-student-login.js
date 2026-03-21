"use strict";

const { getDb } = require("./_lib/firebase");
const { normalizeLoginName, verifyPassword, createStudentSession } = require("./_lib/test-auth");
const { json, noContent, readJsonBody } = require("./_lib/http");
const { getStudentByLoginName, clean } = require("./_lib/test-data");

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(event);
    const loginNameNormalized = normalizeLoginName(body.loginName);
    const password = clean(body.password);
    if (!loginNameNormalized || !password) {
      return json(400, { error: "Login name and password are required." });
    }

    const studentDoc = await getStudentByLoginName(getDb(), loginNameNormalized);
    if (!studentDoc) {
      return json(401, { error: "Invalid login name or password." });
    }

    const student = studentDoc.data || {};
    if (clean(student.status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const passwordValid = verifyPassword(password, student.passwordSalt, student.passwordHash);
    if (!passwordValid) {
      return json(401, { error: "Invalid login name or password." });
    }

    const sessionToken = createStudentSession({
      studentId: studentDoc.id,
      loginName: student.loginName,
      displayName: student.displayName,
      language: student.language
    });

    return json(200, {
      ok: true,
      sessionToken,
      student: {
        id: studentDoc.id,
        displayName: student.displayName,
        loginName: student.loginName,
        language: student.language
      }
    });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to log in right now." });
  }
};
