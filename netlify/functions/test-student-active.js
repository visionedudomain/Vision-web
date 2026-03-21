"use strict";

const { getDb } = require("./_lib/firebase");
const { verifyStudentSession } = require("./_lib/test-auth");
const { json, noContent } = require("./_lib/http");
const { buildPublicTest, clean, getActiveTest, getAttemptForStudent } = require("./_lib/test-data");
const { finalizeAttempt } = require("./_lib/test-attempts");

function readStudentToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  return verifyStudentSession(token);
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const session = readStudentToken(event);
    const db = getDb();
    const studentSnapshot = await db.collection("students").doc(session.studentId).get();
    if (!studentSnapshot.exists) {
      return json(401, { error: "Student session is no longer valid." });
    }

    const student = studentSnapshot.data() || {};
    if (clean(student.status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const activeTestDoc = await getActiveTest(db);
    if (!activeTestDoc) {
      return json(200, {
        ok: true,
        state: "no_test",
        student: {
          id: studentSnapshot.id,
          displayName: student.displayName,
          loginName: student.loginName
        },
        message: "No active online test is available right now."
      });
    }

    const publicTest = buildPublicTest(activeTestDoc);
    const now = Date.now();
    const opensAt = new Date(publicTest.opensAt).getTime();
    const closesAt = new Date(publicTest.closesAt).getTime();
    const existingAttempt = await getAttemptForStudent(db, studentSnapshot.id, activeTestDoc.id);

    if (existingAttempt && clean(existingAttempt.data.status) !== "started") {
      return json(200, {
        ok: true,
        state: "submitted",
        student: {
          id: studentSnapshot.id,
          displayName: student.displayName,
          loginName: student.loginName
        },
        test: publicTest,
        summary: {
          score: Number(existingAttempt.data.score || 0),
          correctCount: Number(existingAttempt.data.correctCount || 0),
          answeredCount: Number(existingAttempt.data.answeredCount || 0),
          totalQuestions: Number(existingAttempt.data.totalQuestions || publicTest.questionCount || 0),
          submittedAt: existingAttempt.data.submittedAt || ""
        },
        message: "Your test has already been submitted."
      });
    }

    if (existingAttempt && clean(existingAttempt.data.status) === "started") {
      const expiresAtTime = new Date(existingAttempt.data.expiresAt || "").getTime();
      if (expiresAtTime && expiresAtTime <= now) {
        const summary = await finalizeAttempt(existingAttempt.ref, existingAttempt.data, activeTestDoc.data, {
          status: "auto_submitted"
        });
        return json(200, {
          ok: true,
          state: "submitted",
          student: {
            id: studentSnapshot.id,
            displayName: student.displayName,
            loginName: student.loginName
          },
          test: publicTest,
          summary: summary,
          message: "Your test has already been submitted."
        });
      }
      return json(200, {
        ok: true,
        state: "in_progress",
        student: {
          id: studentSnapshot.id,
          displayName: student.displayName,
          loginName: student.loginName
        },
        test: publicTest,
        attempt: {
          id: existingAttempt.id,
          startedAt: existingAttempt.data.startedAt,
          expiresAt: existingAttempt.data.expiresAt,
          answers: existingAttempt.data.answers || {}
        },
        message: "Your test is in progress."
      });
    }

    if (now < opensAt) {
      return json(200, {
        ok: true,
        state: "before_window",
        student: { id: studentSnapshot.id, displayName: student.displayName, loginName: student.loginName },
        test: publicTest,
        message: "The published test is not open yet."
      });
    }

    if (now > closesAt) {
      return json(200, {
        ok: true,
        state: "window_closed",
        student: { id: studentSnapshot.id, displayName: student.displayName, loginName: student.loginName },
        test: publicTest,
        message: "The published test window is closed."
      });
    }

    return json(200, {
      ok: true,
      state: "ready",
      student: { id: studentSnapshot.id, displayName: student.displayName, loginName: student.loginName },
      test: publicTest,
      message: "Your test is ready to start."
    });
  } catch (error) {
    return json(401, { error: error && error.message ? error.message : "Student session is invalid." });
  }
};
