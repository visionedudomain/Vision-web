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

function roundOne(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function buildFeedback(result, questions) {
  const safe = result && typeof result === "object" ? result : {};
  const totalQuestions = Number(safe.totalQuestions || 0);
  const correctCount = Number(safe.correctCount || 0);
  const answeredCount = Number(safe.answeredCount || 0);
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
  const percentage = totalQuestions ? roundOne((correctCount / totalQuestions) * 100) : 0;
  const attemptedAccuracy = answeredCount ? roundOne((correctCount / answeredCount) * 100) : 0;
  const suggestionCodes = [];

  function addSuggestion(code) {
    if (code && suggestionCodes.indexOf(code) === -1 && suggestionCodes.length < 5) {
      suggestionCodes.push(code);
    }
  }

  // Improved suggestion logic - more targeted and comprehensive
  if (percentage >= 80) {
    addSuggestion("maintain_mock_tests");
    addSuggestion("review_missed_questions");
  } else if (percentage >= 65) {
    addSuggestion("practice_topic_sets");
    addSuggestion("review_missed_questions");
  } else if (percentage >= 50) {
    addSuggestion("practice_small_sets");
    addSuggestion("focus_weak_subjects");
  } else {
    addSuggestion("revise_core_concepts");
    addSuggestion("practice_small_sets");
  }

  if (unansweredCount > Math.max(totalQuestions * 0.1, 1)) {
    addSuggestion("improve_time_management");
    addSuggestion("attempt_all_questions");
  }

  if (answeredCount >= Math.max(totalQuestions - 1, 1) && attemptedAccuracy < 60) {
    addSuggestion("focus_accuracy_before_speed");
  }

  // Check difficulty performance if questions data is available
  if (Array.isArray(questions) && questions.length > 0) {
    const answers = safe.answers && typeof safe.answers === "object" ? safe.answers : {};
    
    // Analyze hard questions performance
    const hardQuestions = questions.filter(q => clean(q.difficulty_level || "").toLowerCase() === "hard");
    if (hardQuestions.length > 0) {
      let hardCorrect = 0;
      let hardAnswered = 0;
      hardQuestions.forEach(q => {
        const chosen = clean(answers[q.id]);
        if (chosen) {
          hardAnswered += 1;
          if (chosen === clean(q.correctOptionId)) {
            hardCorrect += 1;
          }
        }
      });
      if (hardAnswered > 0 && hardCorrect / hardAnswered < 0.4) {
        addSuggestion("practice_hard_questions");
      }
    }

    // Analyze easy questions performance
    const easyQuestions = questions.filter(q => clean(q.difficulty_level || "").toLowerCase() === "easy");
    if (easyQuestions.length > 0) {
      let easyCorrect = 0;
      let easyAnswered = 0;
      easyQuestions.forEach(q => {
        const chosen = clean(answers[q.id]);
        if (chosen) {
          easyAnswered += 1;
          if (chosen === clean(q.correctOptionId)) {
            easyCorrect += 1;
          }
        }
      });
      if (easyAnswered > 0 && easyCorrect / easyAnswered > 0.8 && percentage < 60) {
        addSuggestion("bridge_to_medium");
      }
    }
  }

  let performanceStatusCode = "needs_improvement";
  if (percentage >= 80) {
    performanceStatusCode = "strong_performance";
  } else if (percentage >= 60) {
    performanceStatusCode = "good_progress";
  } else if (percentage >= 45) {
    performanceStatusCode = "steady_progress";
  }

  return {
    percentage,
    attemptedAccuracy,
    unansweredCount,
    performanceStatusCode,
    suggestionCodes
  };
}

function buildSummary(result, options, questions) {
  const safe = result && typeof result === "object" ? result : {};
  const settings = options && typeof options === "object" ? options : {};
  const feedback = buildFeedback(safe, questions);
  return {
    score: Number(safe.score || 0),
    correctCount: Number(safe.correctCount || 0),
    answeredCount: Number(safe.answeredCount || 0),
    totalQuestions: Number(safe.totalQuestions || 0),
    submittedAt: settings.submittedAt || safe.submittedAt || "",
    percentage: feedback.percentage,
    attemptedAccuracy: feedback.attemptedAccuracy,
    unansweredCount: feedback.unansweredCount,
    performanceStatusCode: feedback.performanceStatusCode,
    suggestionCodes: feedback.suggestionCodes
  };
}

async function finalizeAttempt(attemptRef, attemptData, testData, options) {
  const settings = options && typeof options === "object" ? options : {};
  const answers = attemptData && attemptData.answers && typeof attemptData.answers === "object" ? attemptData.answers : {};
  const result = scoreAnswers(testData && testData.questions, answers);
  const submittedAt = settings.submittedAt || new Date().toISOString();
  const status = clean(settings.status) || "auto_submitted";
  const summary = buildSummary(result, { submittedAt: submittedAt }, testData && testData.questions);

  await attemptRef.set({
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
    status
  }, { merge: true });

  return summary;
}

module.exports = {
  scoreAnswers,
  buildSummary,
  finalizeAttempt
};
