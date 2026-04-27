(function () {
  "use strict";

  /**
   * Enhanced Suggestion Engine for Vision Test Portal
   * Provides intelligent, personalized suggestions based on detailed performance analysis
   */

  function clean(value) {
    return String(value || "").trim();
  }

  function roundOne(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  /**
   * Calculate category-wise accuracy (subject, topic, or difficulty)
   */
  function getCategoryAccuracy(questions, answers, categoryKey, categoryValue) {
    const matching = (Array.isArray(questions) ? questions : []).filter(q => clean(q[categoryKey]) === clean(categoryValue));
    if (matching.length === 0) {
      return null;
    }

    let correct = 0;
    let answered = 0;

    matching.forEach(question => {
      const chosen = clean(answers[question.id]);
      if (chosen) {
        answered += 1;
        if (chosen === clean(question.correctOptionId)) {
          correct += 1;
        }
      }
    });

    return answered > 0 ? correct / answered : null;
  }

  /**
   * Extract unique categories from questions
   */
  function getUniqueCategories(questions, categoryKey) {
    const categories = new Set();
    (Array.isArray(questions) ? questions : []).forEach(q => {
      const val = clean(q[categoryKey]);
      if (val) {
        categories.add(val);
      }
    });
    return Array.from(categories);
  }

  /**
   * Get questions in a specific category
   */
  function getQuestionsInCategory(questions, categoryKey, categoryValue) {
    return (Array.isArray(questions) ? questions : []).filter(q => clean(q[categoryKey]) === clean(categoryValue));
  }

  /**
   * Analyze performance across all categories
   */
  function analyzePerformance(questions, answers, overallAccuracy) {
    const analysis = {
      subjects: {},
      topics: {},
      difficulties: {}
    };

    const subjects = getUniqueCategories(questions, "subject");
    const topics = getUniqueCategories(questions, "topic");
    const difficulties = getUniqueCategories(questions, "difficulty_level");

    subjects.forEach(subject => {
      const accuracy = getCategoryAccuracy(questions, answers, "subject", subject);
      const count = getQuestionsInCategory(questions, "subject", subject).length;
      analysis.subjects[subject] = {
        accuracy,
        count,
        isWeak: accuracy !== null && accuracy < (overallAccuracy * 0.85),
        isStrong: accuracy !== null && accuracy > (overallAccuracy * 1.15)
      };
    });

    topics.forEach(topic => {
      const accuracy = getCategoryAccuracy(questions, answers, "topic", topic);
      const count = getQuestionsInCategory(questions, "topic", topic).length;
      analysis.topics[topic] = {
        accuracy,
        count,
        isWeak: accuracy !== null && accuracy < (overallAccuracy * 0.85),
        isStrong: accuracy !== null && accuracy > (overallAccuracy * 1.15)
      };
    });

    difficulties.forEach(difficulty => {
      const accuracy = getCategoryAccuracy(questions, answers, "difficulty_level", difficulty);
      const count = getQuestionsInCategory(questions, "difficulty_level", difficulty).length;
      analysis.difficulties[difficulty] = {
        accuracy,
        count,
        isWeak: accuracy !== null && accuracy < (overallAccuracy * 0.85),
        isStrong: accuracy !== null && accuracy > (overallAccuracy * 1.15)
      };
    });

    return analysis;
  }

  /**
   * Get weak areas for targeted practice
   */
  function getWeakAreas(analysis) {
    const weakAreas = [];

    Object.entries(analysis.subjects).forEach(([subject, data]) => {
      if (data.isWeak && data.accuracy !== null) {
        weakAreas.push({ type: "subject", name: subject, accuracy: data.accuracy });
      }
    });

    Object.entries(analysis.topics).forEach(([topic, data]) => {
      if (data.isWeak && data.accuracy !== null) {
        weakAreas.push({ type: "topic", name: topic, accuracy: data.accuracy });
      }
    });

    Object.entries(analysis.difficulties).forEach(([difficulty, data]) => {
      if (data.isWeak && data.accuracy !== null) {
        weakAreas.push({ type: "difficulty", name: difficulty, accuracy: data.accuracy });
      }
    });

    return weakAreas.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  }

  /**
   * Generate intelligent suggestion codes based on analysis
   */
  function generateSuggestionCodes(questions, answers, result) {
    const totalQuestions = Number(result.totalQuestions || 0);
    const correctCount = Number(result.correctCount || 0);
    const answeredCount = Number(result.answeredCount || 0);
    const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
    const percentage = totalQuestions ? roundOne((correctCount / totalQuestions) * 100) : 0;
    const attemptedAccuracy = answeredCount ? roundOne((correctCount / answeredCount) * 100) : 0;
    const overallAccuracy = answeredCount > 0 ? correctCount / answeredCount : 0;

    const suggestionCodes = [];
    const suggestions = [];

    function addSuggestion(code, detail) {
      if (code && suggestionCodes.indexOf(code) === -1 && suggestionCodes.length < 5) {
        suggestionCodes.push(code);
        if (detail) {
          suggestions.push({ code, detail });
        }
      }
    }

    // Analyze performance by categories
    const analysis = analyzePerformance(questions, answers, overallAccuracy);
    const weakAreas = getWeakAreas(analysis);

    // Core performance-based suggestions
    if (percentage >= 80) {
      addSuggestion("maintain_mock_tests", "Maintain your excellent performance level");
      if (Object.values(analysis.subjects).some(s => s.isWeak)) {
        addSuggestion("review_missed_questions", "Review the few questions you got wrong");
      }
    } else if (percentage >= 65) {
      addSuggestion("practice_topic_sets", "Practice topic-wise sets to improve consistency");
      addSuggestion("review_missed_questions", "Review incorrect answers to understand the mistakes");
    } else if (percentage >= 50) {
      addSuggestion("practice_small_sets", "Practice smaller focused sets daily");
      if (weakAreas.length > 0) {
        addSuggestion("focus_weak_subjects", `Focus on ${weakAreas[0].name} where your accuracy was lower`);
      }
    } else {
      addSuggestion("revise_core_concepts", "Strengthen the core concepts first");
      addSuggestion("practice_small_sets", "Start with small practice sets before full tests");
    }

    // Time management suggestions
    if (unansweredCount > Math.max(totalQuestions * 0.1, 1)) {
      addSuggestion("improve_time_management", "Work on pacing to attempt more questions");
      addSuggestion("attempt_all_questions", "Try to attempt all questions even if unsure");
    }

    // Accuracy vs speed suggestions
    if (answeredCount >= Math.max(totalQuestions - 1, 1) && attemptedAccuracy < 60) {
      addSuggestion("focus_accuracy_before_speed", "Prioritize accuracy over speed for now");
    }

    // Difficulty-level specific suggestions
    const hard = analysis.difficulties["Hard"] || analysis.difficulties["hard"];
    const easy = analysis.difficulties["Easy"] || analysis.difficulties["easy"];

    if (hard && hard.accuracy !== null && hard.accuracy < 0.4) {
      addSuggestion("practice_hard_questions", "Practice more challenging difficulty level questions");
    }

    if (easy && easy.accuracy !== null && easy.accuracy > 0.8 && percentage < 60) {
      addSuggestion("bridge_to_medium", "You do well on easy questions; now work on medium difficulty");
    }

    // Remove duplicates and limit to 5
    const uniqueCodes = [...new Set(suggestionCodes)].slice(0, 5);

    return {
      suggestionCodes: uniqueCodes,
      suggestions,
      analysis
    };
  }

  /**
   * Build comprehensive summary with advanced suggestions
   */
  function buildAdvancedSummary(result, questions, answers, submittedAt) {
    const totalQuestions = Number(result.totalQuestions || 0);
    const correctCount = Number(result.correctCount || 0);
    const answeredCount = Number(result.answeredCount || 0);
    const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
    const percentage = totalQuestions ? roundOne((correctCount / totalQuestions) * 100) : 0;
    const attemptedAccuracy = answeredCount ? roundOne((correctCount / answeredCount) * 100) : 0;

    const { suggestionCodes, analysis } = generateSuggestionCodes(questions, answers, result);

    let performanceStatusCode = "needs_improvement";
    if (percentage >= 80) {
      performanceStatusCode = "strong_performance";
    } else if (percentage >= 60) {
      performanceStatusCode = "good_progress";
    } else if (percentage >= 45) {
      performanceStatusCode = "steady_progress";
    }

    return {
      score: Number(result.score || 0),
      correctCount,
      answeredCount,
      totalQuestions,
      submittedAt: submittedAt || "",
      percentage,
      attemptedAccuracy,
      unansweredCount,
      performanceStatusCode,
      suggestionCodes,
      analysis: {
        subjectAccuracy: Object.fromEntries(
          Object.entries(analysis.subjects).map(([k, v]) => [k, { accuracy: v.accuracy, count: v.count }])
        ),
        topicAccuracy: Object.fromEntries(
          Object.entries(analysis.topics).map(([k, v]) => [k, { accuracy: v.accuracy, count: v.count }])
        ),
        difficultyAccuracy: Object.fromEntries(
          Object.entries(analysis.difficulties).map(([k, v]) => [k, { accuracy: v.accuracy, count: v.count }])
        )
      }
    };
  }

  // Export for both frontend (browser) and backend (Node.js)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      buildAdvancedSummary,
      generateSuggestionCodes,
      analyzePerformance,
      getCategoryAccuracy
    };
  } else if (typeof window !== "undefined") {
    window.VisionSuggestionEngine = {
      buildAdvancedSummary,
      generateSuggestionCodes,
      analyzePerformance,
      getCategoryAccuracy
    };
  }
})();
