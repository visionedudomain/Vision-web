"use strict";

const { clean } = require("./test-data");

function scoreAnswers(testQuestions, answers) {
  const safeAnswers = answers && typeof answers === "object" ? answers : {};
  let correctCount = 0;
  let answeredCount = 0;

  (Array.isArray(testQuestions) ? testQuestions : []).forEach(function (question) {
    const chosen = clean(safeAnswers[question.id]);
    if (chosen) {
      answeredCount += 1;
    }
    if (chosen && chosen === clean(question.correctOptionId)) {
      correctCount += 1;
    }
  });

  return {
    score: correctCount,
    correctCount,
    answeredCount,
    totalQuestions: Array.isArray(testQuestions) ? testQuestions.length : 0
  };
}

async function finalizeAttempt(attemptRef, attemptData, testData, options) {
  const settings = options && typeof options === "object" ? options : {};
  const answers = attemptData && attemptData.answers && typeof attemptData.answers === "object" ? attemptData.answers : {};
  const result = scoreAnswers(testData && testData.questions, answers);
  const submittedAt = settings.submittedAt || new Date().toISOString();
  const status = clean(settings.status) || "auto_submitted";

  await attemptRef.set({
    answers,
    score: result.score,
    correctCount: result.correctCount,
    answeredCount: result.answeredCount,
    totalQuestions: result.totalQuestions,
    submittedAt,
    status
  }, { merge: true });

  return {
    score: result.score,
    correctCount: result.correctCount,
    answeredCount: result.answeredCount,
    totalQuestions: result.totalQuestions,
    submittedAt
  };
}

module.exports = {
  scoreAnswers,
  finalizeAttempt
};
