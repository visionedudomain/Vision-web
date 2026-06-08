"use strict";

const REGISTRATIONS_COLLECTION = "test_registrations";
const STUDENTS_COLLECTION = "students";
const TESTS_COLLECTION = "tests";
const ATTEMPTS_COLLECTION = "attempts";
const REWRITE_REQUESTS_COLLECTION = "rewrite_requests";

function clean(value) {
  return String(value || "").trim();
}

function normalizeTamilText(value) {
  let text = String(value || "").normalize("NFC");
  let previous = "";
  let attempts = 0;

  text = text.replace(/\u25CC(?=[\u0BBE-\u0BCD\u0BD7])/g, "");
  while (text !== previous && attempts < 4) {
    previous = text;
    text = text
      .replace(/(^|[^\u0B80-\u0BFF]|[\u0BBE-\u0BCD\u0BD7])([\u0BC6-\u0BC8])([\u0B95-\u0BB9]\u0BCD[\u0B95-\u0BB9])([\u0BBE\u0BD7]?)/g, "$1$3$2$4")
      .replace(/(^|[^\u0B80-\u0BFF]|[\u0BBE-\u0BCD\u0BD7])([\u0BC6-\u0BC8])([\u0B95-\u0BB9])([\u0BBE\u0BD7]?)/g, "$1$3$2$4")
      .normalize("NFC");
    attempts += 1;
  }
  return text;
}

function cleanQuestionText(value) {
  return normalizeTamilText(clean(value));
}

function normalizeLanguage(value) {
  return clean(value).toLowerCase() === "ta" || clean(value).toLowerCase() === "tamil" ? "ta" : "en";
}

function toPublicQuestion(question) {
  return {
    id: clean(question.id),
    prompt: cleanQuestionText(question.prompt),
    options: (Array.isArray(question.options) ? question.options : []).map(function (option) {
      return {
        id: clean(option.id),
        text: cleanQuestionText(option.text)
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

async function getStudentByMobile(db, mobile) {
  const snapshot = await db.collection(STUDENTS_COLLECTION).where("mobile", "==", clean(mobile)).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() || {}
  };
}

async function getRegistrationByMobile(db, mobile) {
  const snapshot = await db.collection(REGISTRATIONS_COLLECTION).where("mobile", "==", clean(mobile)).limit(1).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    data: doc.data() || {}
  };
}

async function getActiveTest(db, language) {
  const targetLanguage = normalizeLanguage(language);
  const snapshot = await db.collection(TESTS_COLLECTION).where("isActive", "==", true).get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs.find(function (entry) {
    return normalizeLanguage((entry.data() || {}).language) === targetLanguage;
  });
  if (!doc) {
    return null;
  }
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

async function getRewriteRequestForStudent(db, studentId, testId) {
  const docId = getAttemptDocumentId(studentId, testId);
  if (!docId || docId === "__") {
    return null;
  }
  const doc = await db.collection(REWRITE_REQUESTS_COLLECTION).doc(docId).get();
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
  REWRITE_REQUESTS_COLLECTION,
  clean,
  normalizeTamilText,
  cleanQuestionText,
  normalizeLanguage,
  buildPublicTest,
  getStudentByLoginName,
  getStudentByMobile,
  getRegistrationByLoginName,
  getRegistrationByMobile,
  getActiveTest,
  getAttemptDocumentId,
  getAttemptForStudent,
  getRewriteRequestForStudent,
  clampExpiry
};
