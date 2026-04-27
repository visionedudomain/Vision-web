(function () {
  "use strict";

  /**
   * STANDALONE SUGGESTION GENERATOR
   * Generates personalized, non-repetitive suggestions based on test performance
   */

  // Comprehensive suggestion database with multiple variants
  const SUGGESTION_DATABASE = {
    high_performance: {
      codes: ["maintain_mock_tests", "review_missed_questions"],
      message: "You performed excellently! Keep up this momentum with regular full-length practice tests."
    },
    good_performance: {
      codes: ["practice_topic_sets", "review_missed_questions"],
      message: "Great result! Focus on consistency across different question types."
    },
    average_performance: {
      codes: ["practice_small_sets", "focus_weak_subjects"],
      message: "Steady progress. Practice smaller focused sets to improve accuracy."
    },
    low_performance: {
      codes: ["revise_core_concepts", "practice_small_sets"],
      message: "Start with fundamentals. Build a strong foundation before taking full tests."
    },
    time_management_issues: {
      codes: ["improve_time_management", "attempt_all_questions"],
      message: "Work on your pacing. Try to attempt all questions, even if you're unsure."
    },
    accuracy_issues: {
      codes: ["focus_accuracy_before_speed"],
      message: "Prioritize accuracy over speed. Slow down and check your work."
    },
    mixed_difficulty: {
      codes: ["practice_hard_questions", "bridge_to_medium"],
      message: "You do well on easy questions. Challenge yourself with harder questions."
    }
  };

  /**
   * Analyze performance and generate targeted suggestions
   */
  function analyzePerformance(correctCount, totalQuestions, answeredCount, unansweredCount) {
    const result = {
      percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
      attemptedAccuracy: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      answerRate: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
    };

    return result;
  }

  /**
   * Select appropriate suggestions based on performance
   */
  function generateSuggestions(correctCount, totalQuestions, answeredCount, unansweredCount) {
    const analysis = analyzePerformance(correctCount, totalQuestions, answeredCount, unansweredCount);
    const suggestions = [];

    console.log("🔍 SUGGESTION ENGINE ANALYSIS:", {
      percentage: analysis.percentage,
      attemptedAccuracy: analysis.attemptedAccuracy,
      answerRate: analysis.answerRate,
      unansweredCount: unansweredCount
    });

    // Performance-based suggestions
    if (analysis.percentage >= 75) {
      suggestions.push(...SUGGESTION_DATABASE.high_performance.codes);
    } else if (analysis.percentage >= 60) {
      suggestions.push(...SUGGESTION_DATABASE.good_performance.codes);
    } else if (analysis.percentage >= 45) {
      suggestions.push(...SUGGESTION_DATABASE.average_performance.codes);
    } else {
      suggestions.push(...SUGGESTION_DATABASE.low_performance.codes);
    }

    // Time management issues
    if (unansweredCount > totalQuestions * 0.15) {
      if (!suggestions.includes("improve_time_management")) {
        suggestions.push("improve_time_management");
        suggestions.push("attempt_all_questions");
      }
    }

    // Accuracy vs speed issues
    if (answeredCount >= totalQuestions - 1 && analysis.attemptedAccuracy < 60) {
      if (!suggestions.includes("focus_accuracy_before_speed")) {
        suggestions.push("focus_accuracy_before_speed");
      }
    }

    // Difficulty level suggestions
    if (analysis.percentage < 50 && analysis.attemptedAccuracy > 70) {
      if (!suggestions.includes("practice_hard_questions")) {
        suggestions.push("practice_hard_questions");
      }
    }

    // Remove duplicates and limit to 5
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

    console.log("✅ GENERATED SUGGESTIONS:", uniqueSuggestions);

    return uniqueSuggestions;
  }

  /**
   * Get performance status code
   */
  function getPerformanceStatus(percentage) {
    if (percentage >= 75) return "strong_performance";
    if (percentage >= 60) return "good_progress";
    if (percentage >= 45) return "steady_progress";
    return "needs_improvement";
  }

  /**
   * Build complete summary with suggestions
   */
  function buildSummaryWithSuggestions(correctCount, totalQuestions, answeredCount, submittedAt) {
    const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const attemptedAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    const suggestionCodes = generateSuggestions(correctCount, totalQuestions, answeredCount, unansweredCount);

    const summary = {
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
