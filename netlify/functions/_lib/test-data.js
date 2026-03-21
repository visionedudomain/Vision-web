"use strict";

const REGISTRATIONS_COLLECTION = "test_registrations";
const STUDENTS_COLLECTION = "students";
const TESTS_COLLECTION = "tests";
const ATTEMPTS_COLLECTION = "attempts";

function clean(value) {
  return String(value || "").trim();
}

function normalizeLanguage(value) {
  return clean(value).toLowerCase() === "ta" || clean(value).toLowerCase() === "tamil" ? "ta" : "en";
}

function toPublicQuestion(question) {
  return {
    id: clean(question.id),
    prompt: clean(question.prompt),
    options: (Array.isArray(question.options) ? question.options : []).map(function (option) {
      return {
        id: clean(option.id),
        text: clean(option.text)
      };
    }).filter(function (option) {
      return option.id && option.text;
    })
  };
}

async function getStudentByLoginName(db, loginNameNormalized) {
  const snapshot = await db.collection(STUDENTS_COLLECTION).where("loginNameNormalized", "==", loginNameNormalized).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() || {}
  };
}

async function getRegistrationByLoginName(db, loginNameNormalized) {
  const snapshot = await db.collection(REGISTRATIONS_COLLECTION).where("loginNameNormalized", "==", loginNameNormalized).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() || {}
  };
}

async function getActiveTest(db) {
  const snapshot = await db.collection(TESTS_COLLECTION).where("isActive", "==", true).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  const data = doc.data() || {};
  return {
    id: doc.id,
    data: data
  };
}

function getAttemptDocumentId(studentId, testId) {
  return clean(studentId) + "__" + clean(testId);
}

async function getAttemptForStudent(db, studentId, testId) {
  const docId = getAttemptDocumentId(studentId, testId);
  if (!docId || docId === "__") {
    return null;
  }
  const doc = await db.collection(ATTEMPTS_COLLECTION).doc(docId).get();
  if (!doc.exists) {
    return null;
  }
  return {
    id: doc.id,
    ref: doc.ref,
    data: doc.data() || {}
  };
}

function buildPublicTest(testDoc) {
  const data = testDoc.data || {};
  return {
    id: testDoc.id,
    title: clean(data.title),
    language: normalizeLanguage(data.language),
    opensAt: clean(data.opensAt),
    closesAt: clean(data.closesAt),
    durationMinutes: Number(data.durationMinutes || 0),
    questionCount: Number(data.questionCount || (Array.isArray(data.questions) ? data.questions.length : 0)),
    questions: (Array.isArray(data.questions) ? data.questions : []).map(toPublicQuestion).filter(function (question) {
      return question.prompt && question.options.length >= 2;
    })
  };
}

function toIsoTimestamp(date) {
  return new Date(date).toISOString();
}

function clampExpiry(now, closesAtIso, durationMinutes) {
  const closeTime = new Date(closesAtIso).getTime();
  const timedEnd = now.getTime() + (Number(durationMinutes || 0) * 60 * 1000);
  return toIsoTimestamp(Math.min(closeTime, timedEnd));
}

module.exports = {
  REGISTRATIONS_COLLECTION,
  STUDENTS_COLLECTION,
  TESTS_COLLECTION,
  ATTEMPTS_COLLECTION,
  clean,
  normalizeLanguage,
  buildPublicTest,
  getStudentByLoginName,
  getRegistrationByLoginName,
  getActiveTest,
  getAttemptDocumentId,
  getAttemptForStudent,
  clampExpiry
};
