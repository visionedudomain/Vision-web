"use strict";

const { getDb } = require("./_lib/firebase");
const { verifyStudentSession } = require("./_lib/test-auth");
const { json, noContent } = require("./_lib/http");

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = verifyStudentSession(token);
    const studentSnapshot = await getDb().collection("students").doc(session.studentId).get();
    if (!studentSnapshot.exists) {
      return json(401, { error: "Student session is no longer valid." });
    }
    const student = studentSnapshot.data() || {};
    return json(200, {
      ok: true,
      student: {
        id: studentSnapshot.id,
        displayName: student.displayName,
        loginName: student.loginName,
        language: student.language,
        status: student.status
      }
    });
  } catch (error) {
    return json(401, { error: error && error.message ? error.message : "Student session is invalid." });
  }
};
