"use strict";

const { getAuth, getDb } = require("./_lib/firebase");
const { verifyStudentSession } = require("./_lib/test-auth");
const { json, noContent } = require("./_lib/http");
const { buildPublicTest, clean, getActiveTest, getAttemptDocumentId, getAttemptForStudent, clampExpiry } = require("./_lib/test-data");
const { finalizeAttempt } = require("./_lib/test-attempts");

async function resolveStudentSession(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    throw new Error("Missing student authorization token.");
  }

  try {
    return verifyStudentSession(token);
  } catch (sessionError) {
    const decoded = await getAuth().verifyIdToken(token);
    return {
      studentId: clean(decoded && decoded.uid)
    };
  }
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const session = await resolveStudentSession(event);
    const db = getDb();

    const studentSnapshot = await db.collection("students").doc(session.studentId).get();
    if (!studentSnapshot.exists || clean((studentSnapshot.data() || {}).status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const student = studentSnapshot.data() || {};
    const activeTestDoc = await getActiveTest(db, student.language);
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
      const existingStatus = clean(existingAttempt.data.status).toLowerCase();
      const rewriteStatus = clean(existingAttempt.data.rewriteRequestStatus).toLowerCase();

      if (existingStatus === "started") {
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

      if (rewriteStatus === "approved") {
        const restartedAt = now.toISOString();
        const restartedExpiresAt = clampExpiry(now, publicTest.closesAt, publicTest.durationMinutes);
        await existingAttempt.ref.set({
          studentId: studentSnapshot.id,
          studentDisplayName: clean((studentSnapshot.data() || {}).displayName),
          studentLoginName: clean((studentSnapshot.data() || {}).loginName),
          testId: activeTestDoc.id,
          testTitle: publicTest.title,
          language: publicTest.language,
          startedAt: restartedAt,
          startedAtMs: now.getTime(),
          expiresAt: restartedExpiresAt,
          expiresAtMs: new Date(restartedExpiresAt).getTime(),
          submittedAt: "",
          submittedAtMs: 0,
          status: "started",
          answers: {},
          score: 0,
          correctCount: 0,
          answeredCount: 0,
          totalQuestions: publicTest.questionCount,
          percentage: 0,
          attemptedAccuracy: 0,
          unansweredCount: publicTest.questionCount,
          performanceStatusCode: "",
          suggestionCodes: [],
          rewriteRequestStatus: "",
          rewriteRequestedAt: "",
          rewriteRequestedAtMs: 0,
          rewriteReviewedAt: "",
          rewriteReviewedAtMs: 0,
          rewriteReviewedBy: "",
          updatedAt: restartedAt
        }, { merge: false });

        return json(200, {
          ok: true,
          test: publicTest,
          attempt: {
            id: existingAttempt.id,
            startedAt: restartedAt,
            expiresAt: restartedExpiresAt,
            answers: {}
          }
        });
      }

      return json(409, { error: "Your test has already been submitted." });
    }

    const expiresAt = clampExpiry(now, publicTest.closesAt, publicTest.durationMinutes);
    const attemptId = getAttemptDocumentId(studentSnapshot.id, activeTestDoc.id);
    const attemptRef = db.collection("attempts").doc(attemptId);
    const startedAt = now.toISOString();
    const expiresAtMs = new Date(expiresAt).getTime();
    await attemptRef.set({
      studentId: studentSnapshot.id,
      studentDisplayName: clean((studentSnapshot.data() || {}).displayName),
      studentLoginName: clean((studentSnapshot.data() || {}).loginName),
      testId: activeTestDoc.id,
      testTitle: publicTest.title,
      language: publicTest.language,
      startedAt,
      startedAtMs: now.getTime(),
      expiresAt,
      expiresAtMs,
      submittedAt: "",
      submittedAtMs: 0,
      status: "started",
      answers: {},
      score: 0,
      correctCount: 0,
      answeredCount: 0,
      totalQuestions: publicTest.questionCount,
      updatedAt: startedAt
    });

    return json(200, {
      ok: true,
      test: publicTest,
      attempt: {
        id: attemptId,
        startedAt,
        expiresAt,
        answers: {}
      }
    });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to start the test." });
  }
};
