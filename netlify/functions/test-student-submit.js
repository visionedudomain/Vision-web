"use strict";

const { getAuth, getDb } = require("./_lib/firebase");
const { verifyStudentSession } = require("./_lib/test-auth");
const { json, noContent, readJsonBody } = require("./_lib/http");
const { clean, getActiveTest, getAttemptForStudent } = require("./_lib/test-data");
const { buildSummary, scoreAnswers } = require("./_lib/test-attempts");

async function resolveStudentSession(token) {
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
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = await resolveStudentSession(token);
    const body = await readJsonBody(event);
    const db = getDb();

    const studentSnapshot = await db.collection("students").doc(session.studentId).get();
    if (!studentSnapshot.exists || clean((studentSnapshot.data() || {}).status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const activeTestDoc = await getActiveTest(db, (studentSnapshot.data() || {}).language);
    if (!activeTestDoc) {
      return json(404, { error: "No active test is available right now." });
    }

    const attempt = await getAttemptForStudent(db, session.studentId, activeTestDoc.id);
    if (!attempt) {
      return json(404, { error: "No active attempt was found for this student." });
    }

    if (clean(attempt.data.status) !== "started") {
      return json(200, {
        ok: true,
        summary: buildSummary(attempt.data, { submittedAt: attempt.data.submittedAt || "" })
      });
    }

    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const testQuestions = Array.isArray(activeTestDoc.data.questions) ? activeTestDoc.data.questions : [];
    const result = scoreAnswers(testQuestions, answers);
    const submittedAt = new Date().toISOString();
    const expiresAtTime = new Date(attempt.data.expiresAt || "").getTime();
    const timedOut = expiresAtTime && expiresAtTime <= Date.now();
    const summary = buildSummary(result, { submittedAt: submittedAt }, testQuestions);

    await attempt.ref.set({
      answers,
      score: summary.score,
      correctCount: summary.correctCount,
      answeredCount: summary.answeredCount,
      totalQuestions: summary.totalQuestions,
      percentage: summary.percentage,
      attemptedAccuracy: summary.attemptedAccuracy,
      unansweredCount: summary.unansweredCount,
      performanceStatusCode: summary.performanceStatusCode,
      suggestionCodes: summary.suggestionCodes,
      submittedAt: summary.submittedAt,
      submittedAtMs: new Date(summary.submittedAt).getTime(),
      status: body.autoSubmit || timedOut ? "auto_submitted" : "submitted",
      updatedAt: summary.submittedAt
    }, { merge: true });

    return json(200, {
      ok: true,
      summary: summary
    });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to submit the test." });
  }
};
