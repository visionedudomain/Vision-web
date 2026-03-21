"use strict";

const { getDb } = require("./_lib/firebase");
const { verifyStudentSession } = require("./_lib/test-auth");
const { json, noContent } = require("./_lib/http");
const { buildPublicTest, clean, getActiveTest, getAttemptDocumentId, getAttemptForStudent, clampExpiry } = require("./_lib/test-data");
const { finalizeAttempt } = require("./_lib/test-attempts");

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = verifyStudentSession(token);
    const db = getDb();

    const studentSnapshot = await db.collection("students").doc(session.studentId).get();
    if (!studentSnapshot.exists || clean((studentSnapshot.data() || {}).status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const activeTestDoc = await getActiveTest(db);
    if (!activeTestDoc) {
      return json(404, { error: "No active test is available right now." });
    }

    const publicTest = buildPublicTest(activeTestDoc);
    const now = new Date();
    if (now.getTime() < new Date(publicTest.opensAt).getTime()) {
      return json(400, { error: "The test is not open yet." });
    }
    if (now.getTime() > new Date(publicTest.closesAt).getTime()) {
      return json(400, { error: "The test window is already closed." });
    }

    const existingAttempt = await getAttemptForStudent(db, studentSnapshot.id, activeTestDoc.id);
    if (existingAttempt) {
      if (clean(existingAttempt.data.status) === "started") {
        const expiresAtTime = new Date(existingAttempt.data.expiresAt || "").getTime();
        if (expiresAtTime && expiresAtTime <= now.getTime()) {
          const summary = await finalizeAttempt(existingAttempt.ref, existingAttempt.data, activeTestDoc.data, {
            status: "auto_submitted"
          });
          return json(409, {
            error: "Your test time is over. Refresh the page to view the result.",
            summary
          });
        }
      }
      return json(200, {
        ok: true,
        test: publicTest,
        attempt: {
          id: existingAttempt.id,
          startedAt: existingAttempt.data.startedAt,
          expiresAt: existingAttempt.data.expiresAt,
          answers: existingAttempt.data.answers || {}
        }
      });
    }

    const expiresAt = clampExpiry(now, publicTest.closesAt, publicTest.durationMinutes);
    const attemptId = getAttemptDocumentId(studentSnapshot.id, activeTestDoc.id);
    const attemptRef = db.collection("attempts").doc(attemptId);
    await attemptRef.set({
      studentId: studentSnapshot.id,
      studentDisplayName: clean((studentSnapshot.data() || {}).displayName),
      studentLoginName: clean((studentSnapshot.data() || {}).loginName),
      testId: activeTestDoc.id,
      testTitle: publicTest.title,
      language: publicTest.language,
      startedAt: now.toISOString(),
      expiresAt,
      submittedAt: "",
      status: "started",
      answers: {},
      score: 0,
      correctCount: 0,
      answeredCount: 0,
      totalQuestions: publicTest.questionCount
    });

    return json(200, {
      ok: true,
      test: publicTest,
      attempt: {
        id: attemptId,
        startedAt: now.toISOString(),
        expiresAt,
        answers: {}
      }
    });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to start the test." });
  }
};
