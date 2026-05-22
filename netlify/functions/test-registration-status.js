"use strict";

const { getDb } = require("./_lib/firebase");
const { json, noContent, readJsonBody } = require("./_lib/http");
const {
  clean,
  normalizeLanguage,
  getStudentByLoginName,
  getStudentByMobile,
  getRegistrationByLoginName,
  getRegistrationByMobile
} = require("./_lib/test-data");
const { normalizeLoginName } = require("./_lib/test-auth");

function normalizeStatus(value, fallback) {
  const safe = clean(value).toLowerCase();
  return safe || clean(fallback).toLowerCase();
}

function getNormalizedRecordLogin(record) {
  return normalizeLoginName(clean(record && record.data && (record.data.loginNameNormalized || record.data.loginName)));
}

function recordMatches(record, loginNameNormalized, mobile) {
  if (!record) {
    return false;
  }
  const data = record.data || {};
  if (loginNameNormalized && getNormalizedRecordLogin(record) !== loginNameNormalized) {
    return false;
  }
  if (mobile && clean(data.mobile) !== clean(mobile)) {
    return false;
  }
  return true;
}

function buildStatusPayload(record, source) {
  const data = record && record.data ? record.data : {};
  const isStudent = source === "student";
  return {
    ok: true,
    found: true,
    source: source,
    status: normalizeStatus(data.status, isStudent ? "approved" : "pending"),
    displayName: clean(data.displayName),
    loginName: clean(data.loginName),
    mobile: clean(data.mobile),
    language: normalizeLanguage(data.language),
    batchName: clean(data.batchName),
    approvedAt: clean(data.approvedAt),
    updatedAt: clean(data.updatedAt)
  };
}

function getStatusLookupMessage(result) {
  const status = normalizeStatus(result && result.status, "pending");
  if (status === "approved") {
    return "Your registration is approved. You can now log in to the online test portal.";
  }
  if (status === "inactive") {
    return "Your student access is inactive right now. Please contact Vision Academy.";
  }
  if (status === "rejected") {
    return "Your registration is currently rejected. Please contact Vision Academy.";
  }
  return "Your registration is pending admin approval after payment verification.";
}

function getConflictMessage(kind, source, status) {
  const safeKind = clean(kind).toLowerCase();
  const safeSource = clean(source).toLowerCase();
  const safeStatus = normalizeStatus(status, safeSource === "student" ? "approved" : "pending");

  if (safeKind === "mobile") {
    if (safeSource === "student") {
      return safeStatus === "inactive"
        ? "This mobile number is already linked to an inactive student account."
        : "This mobile number is already linked to an approved student account.";
    }
    return safeStatus === "approved"
      ? "This mobile number is already linked to an approved registration."
      : "This mobile number is already registered for test approval.";
  }

  if (safeSource === "student") {
    return safeStatus === "inactive"
      ? "This login name is already linked to an inactive student account."
      : "This login name is already approved for a student.";
  }

  return safeStatus === "approved"
    ? "This login name is already linked to an approved registration."
    : "This login name is already registered for test approval.";
}

function buildConflictPayload(kind, source, status) {
  if (!source) {
    return null;
  }
  return {
    kind: clean(kind).toLowerCase(),
    source: clean(source).toLowerCase(),
    status: normalizeStatus(status, source === "student" ? "approved" : "pending"),
    message: getConflictMessage(kind, source, status)
  };
}

async function resolveLookup(db, loginNameNormalized, mobile) {
  const [studentByLogin, studentByMobile, registrationByLogin, registrationByMobile] = await Promise.all([
    loginNameNormalized ? getStudentByLoginName(db, loginNameNormalized) : null,
    mobile ? getStudentByMobile(db, mobile) : null,
    loginNameNormalized ? getRegistrationByLoginName(db, loginNameNormalized) : null,
    mobile ? getRegistrationByMobile(db, mobile) : null
  ]);

  const studentMatch = [studentByLogin, studentByMobile].find(function (record) {
    return recordMatches(record, loginNameNormalized, mobile);
  });
  if (studentMatch) {
    return buildStatusPayload(studentMatch, "student");
  }

  const registrationMatch = [registrationByLogin, registrationByMobile].find(function (record) {
    return recordMatches(record, loginNameNormalized, mobile);
  });
  if (registrationMatch) {
    return buildStatusPayload(registrationMatch, "registration");
  }

  return {
    ok: true,
    found: false,
    status: "",
    message: "No registration status was found for this login name and mobile number yet."
  };
}

async function resolveValidation(db, loginNameNormalized, mobile) {
  const [studentByLogin, studentByMobile, registrationByLogin, registrationByMobile] = await Promise.all([
    loginNameNormalized ? getStudentByLoginName(db, loginNameNormalized) : null,
    mobile ? getStudentByMobile(db, mobile) : null,
    loginNameNormalized ? getRegistrationByLoginName(db, loginNameNormalized) : null,
    mobile ? getRegistrationByMobile(db, mobile) : null
  ]);

  const registrationLoginStatus = normalizeStatus(registrationByLogin && registrationByLogin.data && registrationByLogin.data.status, "pending");
  const registrationMobileStatus = normalizeStatus(registrationByMobile && registrationByMobile.data && registrationByMobile.data.status, "pending");

  const loginConflict = studentByLogin
    ? buildConflictPayload("login", "student", studentByLogin.data && studentByLogin.data.status)
    : (registrationByLogin && registrationLoginStatus !== "rejected"
      ? buildConflictPayload("login", "registration", registrationLoginStatus)
      : null);

  const mobileConflict = studentByMobile
    ? buildConflictPayload("mobile", "student", studentByMobile.data && studentByMobile.data.status)
    : (registrationByMobile && registrationMobileStatus !== "rejected"
      ? buildConflictPayload("mobile", "registration", registrationMobileStatus)
      : null);

  const messages = [loginConflict && loginConflict.message, mobileConflict && mobileConflict.message].filter(Boolean);

  return {
    ok: true,
    isAvailable: !loginConflict && !mobileConflict,
    loginNameAvailable: !loginConflict,
    mobileAvailable: !mobileConflict,
    loginConflict: loginConflict,
    mobileConflict: mobileConflict,
    message: messages.join(" ")
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return noContent();
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(event);
    const action = clean(body.action).toLowerCase() || "lookup";
    const loginNameNormalized = normalizeLoginName(body.loginName);
    const mobile = clean(body.mobile);

    if (!loginNameNormalized && !mobile) {
      return json(400, { error: "Login name or mobile number is required." });
    }

    const db = getDb();

    if (action === "validate") {
      return json(200, await resolveValidation(db, loginNameNormalized, mobile));
    }

    if (action === "lookup") {
      const result = await resolveLookup(db, loginNameNormalized, mobile);
      if (result.found) {
        result.message = getStatusLookupMessage(result);
      }
      return json(200, result);
    }

    return json(400, { error: "Unsupported registration status action." });
  } catch (error) {
    return json(500, {
      error: error && error.message ? error.message : "Unable to check registration status right now."
    });
  }
};
