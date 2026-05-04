"use strict";

const { getDb, verifyAdminRequest } = require("./_lib/firebase");
const { json, noContent, readJsonBody } = require("./_lib/http");

function clean(value) {
  return String(value || "").trim();
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const adminUser = await verifyAdminRequest(event);
    const body = await readJsonBody(event);
    const action = clean(body.action).toLowerCase();
    const requestId = clean(body.requestId);

    if (!requestId) {
      return json(400, { error: "Rewrite request not found." });
    }

    if (action !== "approve" && action !== "reject") {
      return json(400, { error: "Unsupported rewrite action." });
    }

    const attemptRef = getDb().collection("attempts").doc(requestId);
    const attemptSnapshot = await attemptRef.get();
    if (!attemptSnapshot.exists) {
      return json(404, { error: "Rewrite request not found." });
    }

    const attempt = attemptSnapshot.data() || {};
    if (clean(attempt.rewriteRequestStatus).toLowerCase() !== "pending") {
      return json(409, {
        error: action === "approve"
          ? "Only pending retest requests can be approved."
          : "Only pending retest requests can be rejected."
      });
    }

    const now = new Date().toISOString();
    await attemptRef.set({
      rewriteRequestStatus: action === "approve" ? "approved" : "rejected",
      rewriteReviewedAt: now,
      rewriteReviewedAtMs: Date.now(),
      rewriteReviewedBy: clean(adminUser && adminUser.email) || "visionedudomain@gmail.com",
      updatedAt: now
    }, { merge: true });

    return json(200, {
      ok: true,
      requestId,
      status: action === "approve" ? "approved" : "rejected",
      reviewedAt: now
    });
  } catch (error) {
    return json(Number(error && error.statusCode) || 500, {
      error: error && error.message ? error.message : "Unable to process rewrite request."
    });
  }
};
