"use strict";

const { getAuth, getDb } = require("./_lib/firebase");
const { verifyStudentSession } = require("./_lib/test-auth");
const { json, noContent } = require("./_lib/http");
const { buildPublicTest, clean, getActiveTest, getAttemptForStudent, getRewriteRequestForStudent } = require("./_lib/test-data");
const { buildSummary, finalizeAttempt } = require("./_lib/test-attempts");

function isRewriteRequestRelevant(attempt, rewriteRequest) {
  const attemptData = attempt && attempt.data ? attempt.data : {};
  const requestData = rewriteRequest && rewriteRequest.data ? rewriteRequest.data : {};
  return Number(requestData.requestedAtMs || 0) >= Number(attemptData.startedAtMs || 0);
}

function getEffectiveRewriteStatus(attempt, rewriteRequest) {
  const attemptStatus = clean(attempt && attempt.data && attempt.data.rewriteRequestStatus).toLowerCase();
  if (attemptStatus) {
    return attemptStatus;
  }
  if (!isRewriteRequestRelevant(attempt, rewriteRequest)) {
    return "";
  }
  return clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.status).toLowerCase();
}

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

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const session = await resolveStudentSession(event);
    const db = getDb();
    const studentSnapshot = await db.collection("students").doc(session.studentId).get();
    if (!studentSnapshot.exists) {
      return json(401, { error: "Student session is no longer valid." });
    }

    const student = studentSnapshot.data() || {};
    if (clean(student.status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const studentLanguage = student.language;
    const studentPayload = {
      id: studentSnapshot.id,
      displayName: student.displayName,
      loginName: student.loginName,
      language: studentLanguage
    };
    const activeTestDoc = await getActiveTest(db, studentLanguage);
    if (!activeTestDoc) {
      return json(200, {
        ok: true,
        state: "no_test",
        student: studentPayload,
        message: "No active online test is available right now."
      });
    }

    const publicTest = buildPublicTest(activeTestDoc);
    const now = Date.now();
    const opensAt = new Date(publicTest.opensAt).getTime();
    const closesAt = new Date(publicTest.closesAt).getTime();
    const existingAttempt = await getAttemptForStudent(db, studentSnapshot.id, activeTestDoc.id);
    const rewriteRequest = existingAttempt ? await getRewriteRequestForStudent(db, studentSnapshot.id, activeTestDoc.id) : null;
    const rewriteApproved = existingAttempt
      && getEffectiveRewriteStatus(existingAttempt, rewriteRequest) === "approved"
      && clean(existingAttempt.data.status).toLowerCase() !== "started";

    if (rewriteApproved) {
      if (now < opensAt) {
        return json(200, {
          ok: true,
          state: "before_window",
          student: studentPayload,
          test: publicTest,
          message: "The published test is not open yet."
        });
      }

      if (now > closesAt) {
        return json(200, {
          ok: true,
          state: "window_closed",
          student: studentPayload,
          test: publicTest,
          message: "The published test window is closed."
        });
      }

      return json(200, {
        ok: true,
        state: "ready",
        student: studentPayload,
        test: publicTest,
        message: "Your retest is ready to start."
      });
    }

    if (existingAttempt && clean(existingAttempt.data.status) !== "started") {
      const summary = buildSummary({
        score: Number(existingAttempt.data.score || 0),
        correctCount: Number(existingAttempt.data.correctCount || 0),
        answeredCount: Number(existingAttempt.data.answeredCount || 0),
        totalQuestions: Number(existingAttempt.data.totalQuestions || publicTest.questionCount || 0),
        submittedAt: existingAttempt.data.submittedAt || "",
        percentage: Number(existingAttempt.data.percentage || 0),
        attemptedAccuracy: Number(existingAttempt.data.attemptedAccuracy || 0),
        unansweredCount: Number(existingAttempt.data.unansweredCount || 0),
        performanceStatusCode: existingAttempt.data.performanceStatusCode || "",
        suggestionCodes: Array.isArray(existingAttempt.data.suggestionCodes) ? existingAttempt.data.suggestionCodes : []
      }, { submittedAt: existingAttempt.data.submittedAt || "" }, publicTest.questions);
      summary.rewriteRequestStatus = clean(existingAttempt.data.rewriteRequestStatus) || clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.status);
      summary.rewriteRequestedAt = clean(existingAttempt.data.rewriteRequestedAt) || clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.requestedAt);
      summary.rewriteReviewedAt = clean(existingAttempt.data.rewriteReviewedAt) || clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.reviewedAt);
      return json(200, {
        ok: true,
        state: "submitted",
        student: studentPayload,
        test: publicTest,
        summary,
        message: "Your test has already been submitted."
      });
    }

    if (existingAttempt && clean(existingAttempt.data.status) === "started") {
      const expiresAtTime = new Date(existingAttempt.data.expiresAt || "").getTime();
      if (expiresAtTime && expiresAtTime <= now) {
        const summary = await finalizeAttempt(existingAttempt.ref, existingAttempt.data, activeTestDoc.data, {
          status: "auto_submitted"
        });
        summary.rewriteRequestStatus = clean(existingAttempt.data.rewriteRequestStatus) || clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.status);
        summary.rewriteRequestedAt = clean(existingAttempt.data.rewriteRequestedAt) || clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.requestedAt);
        summary.rewriteReviewedAt = clean(existingAttempt.data.rewriteReviewedAt) || clean(rewriteRequest && rewriteRequest.data && rewriteRequest.data.reviewedAt);
        return json(200, {
          ok: true,
          state: "submitted",
          student: studentPayload,
          test: publicTest,
          summary: summary,
          message: "Your test has already been submitted."
        });
      }
      return json(200, {
        ok: true,
        state: "in_progress",
        student: studentPayload,
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
        student: studentPayload,
        test: publicTest,
        message: "The published test is not open yet."
      });
    }

    if (now > closesAt) {
      return json(200, {
        ok: true,
        state: "window_closed",
        student: studentPayload,
        test: publicTest,
        message: "The published test window is closed."
      });
    }

    return json(200, {
      ok: true,
      state: "ready",
      student: studentPayload,
      test: publicTest,
      message: "Your test is ready to start."
    });
  } catch (error) {
    const message = error && error.message ? error.message : "Unable to load the active test.";
    const normalizedMessage = String(message || "").toLowerCase();
    const isAuthError = normalizedMessage.includes("student session")
      || normalizedMessage.includes("authorization token")
      || normalizedMessage.includes("id token");
    return json(isAuthError ? 401 : 500, { error: message });
  }
};
