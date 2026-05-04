"use strict";

const { getAuth, getDb } = require("./_lib/firebase");
const { json, noContent, readJsonBody } = require("./_lib/http");
const { clean, getAttemptForStudent } = require("./_lib/test-data");

async function verifyStudentRequest(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    throw new Error("Missing student authorization token.");
  }
  return getAuth().verifyIdToken(token);
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const decoded = await verifyStudentRequest(event);
    const db = getDb();
    const studentSnapshot = await db.collection("students").doc(clean(decoded.uid)).get();
    if (!studentSnapshot.exists || clean((studentSnapshot.data() || {}).status) !== "approved") {
      return json(403, { error: "Your test access is not active yet." });
    }

    const body = await readJsonBody(event);
    const requestedTestId = clean(body.testId);
    if (!requestedTestId) {
      return json(400, { error: "Retest request could not be matched to the active test." });
    }

    const activeTestSnapshot = await db.collection("tests").doc(requestedTestId).get();
    if (!activeTestSnapshot.exists || !Boolean((activeTestSnapshot.data() || {}).isActive)) {
      return json(404, { error: "No active test is available right now." });
    }

    const attempt = await getAttemptForStudent(db, studentSnapshot.id, requestedTestId);
    if (!attempt) {
      return json(404, { error: "No submitted test attempt was found for this student." });
    }

    const attemptStatus = clean(attempt.data.status);
    if (attemptStatus === "started") {
      return json(409, { error: "Finish and submit the current test before requesting a retest." });
    }
    if (clean(attempt.data.rewriteRequestStatus) === "pending") {
      return json(409, { error: "You have already requested to retake this test." });
    }
    if (clean(attempt.data.rewriteRequestStatus) === "approved") {
      return json(409, { error: "Your retest has already been approved. Log in again and start the test." });
    }

    const requestedAt = new Date().toISOString();
    await attempt.ref.set({
      rewriteRequestStatus: "pending",
      rewriteRequestedAt: requestedAt,
      rewriteRequestedAtMs: Date.now(),
      rewriteReviewedAt: "",
      rewriteReviewedAtMs: 0,
      rewriteReviewedBy: "",
      updatedAt: requestedAt
    }, { merge: true });

    return json(200, {
      ok: true,
      status: "pending",
      requestedAt
    });
  } catch (error) {
    return json(500, { error: error && error.message ? error.message : "Unable to submit rewrite request." });
  }
};
