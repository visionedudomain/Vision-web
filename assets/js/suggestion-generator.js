(function () {
  "use strict";

  // Comprehensive suggestion database
  var SUGGESTION_DATABASE = {
    high_performance: {
      codes: ["maintain_mock_tests", "review_missed_questions"]
    },
    good_performance: {
      codes: ["practice_topic_sets", "review_missed_questions"]
    },
    average_performance: {
      codes: ["practice_small_sets", "focus_weak_subjects"]
    },
    low_performance: {
      codes: ["revise_core_concepts", "practice_small_sets"]
    },
    time_management_issues: {
      codes: ["improve_time_management", "attempt_all_questions"]
    },
    accuracy_issues: {
      codes: ["focus_accuracy_before_speed"]
    },
    mixed_difficulty: {
      codes: ["practice_hard_questions", "bridge_to_medium"]
    }
  };

  function analyzePerformance(correctCount, totalQuestions, answeredCount, unansweredCount) {
    var percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    var attemptedAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    var answerRate = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return {
      percentage: percentage,
      attemptedAccuracy: attemptedAccuracy,
      answerRate: answerRate
    };
  }

  function removeDuplicates(arr) {
    var seen = {};
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      if (!seen[arr[i]]) {
        seen[arr[i]] = true;
        result.push(arr[i]);
      }
    }
    return result;
  }

  function generateSuggestions(correctCount, totalQuestions, answeredCount, unansweredCount) {
    var analysis = analyzePerformance(correctCount, totalQuestions, answeredCount, unansweredCount);
    var suggestions = [];

    console.log("🔍 SUGGESTION ENGINE ANALYSIS:", {
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      answeredCount: answeredCount,
      unansweredCount: unansweredCount,
      percentage: analysis.percentage,
      attemptedAccuracy: analysis.attemptedAccuracy,
      answerRate: analysis.answerRate
    });

    // Performance-based suggestions (ALWAYS add at least one)
    if (analysis.percentage >= 75) {
      suggestions = suggestions.concat(SUGGESTION_DATABASE.high_performance.codes);
    } else if (analysis.percentage >= 60) {
      suggestions = suggestions.concat(SUGGESTION_DATABASE.good_performance.codes);
    } else if (analysis.percentage >= 45) {
      suggestions = suggestions.concat(SUGGESTION_DATABASE.average_performance.codes);
    } else {
      suggestions = suggestions.concat(SUGGESTION_DATABASE.low_performance.codes);
    }

    // Time management issues
    if (totalQuestions > 0 && unansweredCount > totalQuestions * 0.15) {
      var hasTimeManagement = false;
      for (var i = 0; i < suggestions.length; i++) {
        if (suggestions[i] === "improve_time_management") {
          hasTimeManagement = true;
          break;
        }
      }
      if (!hasTimeManagement) {
        suggestions.push("improve_time_management");
        suggestions.push("attempt_all_questions");
      }
    }

    // Accuracy vs speed issues
    if (answeredCount >= totalQuestions - 1 && analysis.attemptedAccuracy < 60) {
      var hasAccuracy = false;
      for (var j = 0; j < suggestions.length; j++) {
        if (suggestions[j] === "focus_accuracy_before_speed") {
          hasAccuracy = true;
          break;
        }
      }
      if (!hasAccuracy) {
        suggestions.push("focus_accuracy_before_speed");
      }
    }

    // Remove duplicates and limit to 5
    var uniqueSuggestions = removeDuplicates(suggestions).slice(0, 5);

    console.log("✅ GENERATED SUGGESTIONS:", uniqueSuggestions);

    return uniqueSuggestions;
  }

  function getPerformanceStatus(percentage) {
    if (percentage >= 75) return "strong_performance";
    if (percentage >= 60) return "good_progress";
    if (percentage >= 45) return "steady_progress";
    return "needs_improvement";
  }

  function buildSummaryWithSuggestions(correctCount, totalQuestions, answeredCount, submittedAt) {
    var unansweredCount = Math.max(totalQuestions - answeredCount, 0);
    var percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    var attemptedAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    var suggestionCodes = generateSuggestions(correctCount, totalQuestions, answeredCount, unansweredCount);

    var summary = {
      score: correctCount,
      correctCount: correctCount,
      answeredCount: answeredCount,
      totalQuestions: totalQuestions,
      submittedAt: submittedAt || new Date().toISOString(),
      percentage: percentage,
      attemptedAccuracy: attemptedAccuracy,
      unansweredCount: unansweredCount,
      performanceStatusCode: getPerformanceStatus(percentage),
      suggestionCodes: suggestionCodes
    };

    console.log("📊 SUMMARY WITH SUGGESTIONS:", summary);
    return summary;
  }

  // Export for use
  window.SuggestionGenerator = {
    generateSuggestions: generateSuggestions,
    buildSummaryWithSuggestions: buildSummaryWithSuggestions,
    getPerformanceStatus: getPerformanceStatus,
    analyzePerformance: analyzePerformance
  };

  console.log("✨ Suggestion Generator Loaded Successfully");
})();
