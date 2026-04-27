(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search || "");
  if (params.get("demo") !== "1") {
    return;
  }

  var DEMO_SESSION_KEY = "vision_test_demo_session_v1";
  var DEMO_ATTEMPT_KEY = "vision_test_demo_attempt_v1";
  var MODEL_API_BASE = "http://127.0.0.1:8765";

  var DEMO_LOGIN = {
    loginName: "demo-student",
    password: "demo123"
  };

  var DEMO_STUDENT = {
    id: "demo-student-001",
    displayName: "Demo Student",
    loginName: DEMO_LOGIN.loginName,
    language: "en",
    status: "approved"
  };

  var DEMO_PROFILE = {
    overallAccuracy: 0.62,
    avgTimeRatio: 1.08,
    avgEfficiency: 0.12,
    subjectAccuracy: {
      Geography: 0.58,
      Chemistry: 0.49,
      "Current Affairs": 0.68,
      Maths: 0.54
    },
    topicAccuracy: {
      "World Geography": 0.55,
      "Organic Chemistry": 0.47,
      Awards: 0.70,
      Algebra: 0.52,
      Climatology: 0.50
    },
    difficultyAccuracy: {
      Easy: 0.74,
      Medium: 0.61,
      Hard: 0.46
    }
  };

  var CATEGORY_MAPS = {
    subject: {
      Geography: 7,
      Chemistry: 2,
      "Current Affairs": 5,
      Maths: 9
    },
    topic: {
      "World Geography": 43,
      "Organic Chemistry": 34,
      Awards: 4,
      Algebra: 0,
      Climatology: 6
    },
    difficulty_level: {
      Easy: 0,
      Hard: 1,
      Medium: 2
    }
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getNowIso() {
    return new Date().toISOString();
  }

  function getDemoTest() {
    var now = Date.now();
    var opensAt = new Date(now - (30 * 60 * 1000)).toISOString();
    var closesAt = new Date(now + (6 * 60 * 60 * 1000)).toISOString();
    return {
      id: "vision-demo-test-2026",
      title: "Vision Demo Aptitude Test",
      language: "en",
      opensAt: opensAt,
      closesAt: closesAt,
      durationMinutes: 18,
      questionCount: 5,
      questions: [
        {
          id: "q1",
          prompt: "Which layer of the atmosphere contains the ozone layer?",
          correctOptionId: "b",
          subject: "Geography",
          topic: "Climatology",
          difficulty_level: "Medium",
          expected_time_sec: 90,
          question_past_accuracy: 0.59,
          question_past_avg_time: 82,
          options: [
            { id: "a", text: "Mesosphere" },
            { id: "b", text: "Stratosphere" },
            { id: "c", text: "Troposphere" },
            { id: "d", text: "Exosphere" }
          ]
        },
        {
          id: "q2",
          prompt: "Which compound mainly represents an alkene functional group?",
          correctOptionId: "c",
          subject: "Chemistry",
          topic: "Organic Chemistry",
          difficulty_level: "Hard",
          expected_time_sec: 110,
          question_past_accuracy: 0.43,
          question_past_avg_time: 126,
          options: [
            { id: "a", text: "C-H single bond" },
            { id: "b", text: "C-O single bond" },
            { id: "c", text: "C=C double bond" },
            { id: "d", text: "N-H single bond" }
          ]
        },
        {
          id: "q3",
          prompt: "Which award is presented for excellence in Indian cinema?",
          correctOptionId: "a",
          subject: "Current Affairs",
          topic: "Awards",
          difficulty_level: "Easy",
          expected_time_sec: 50,
          question_past_accuracy: 0.66,
          question_past_avg_time: 41,
          options: [
            { id: "a", text: "Dadasaheb Phalke Award" },
            { id: "b", text: "Bharat Ratna" },
            { id: "c", text: "Padma Vibhushan" },
            { id: "d", text: "Arjuna Award" }
          ]
        },
        {
          id: "q4",
          prompt: "What is the value of x if 3x + 6 = 21?",
          correctOptionId: "a",
          subject: "Maths",
          topic: "Algebra",
          difficulty_level: "Medium",
          expected_time_sec: 80,
          question_past_accuracy: 0.52,
          question_past_avg_time: 75,
          options: [
            { id: "a", text: "5" },
            { id: "b", text: "4" },
            { id: "c", text: "6" },
            { id: "d", text: "7" }
          ]
        },
        {
          id: "q5",
          prompt: "Which line divides Earth into northern and southern hemispheres?",
          correctOptionId: "d",
          subject: "Geography",
          topic: "World Geography",
          difficulty_level: "Hard",
          expected_time_sec: 100,
          question_past_accuracy: 0.48,
          question_past_avg_time: 118,
          options: [
            { id: "a", text: "Tropic of Cancer" },
            { id: "b", text: "Prime Meridian" },
            { id: "c", text: "Tropic of Capricorn" },
            { id: "d", text: "Equator" }
          ]
        }
      ]
    };
  }

  function getStudentSessionToken() {
    return localStorage.getItem(DEMO_SESSION_KEY) || "";
  }

  function setStudentSessionToken(token) {
    if (token) {
      localStorage.setItem(DEMO_SESSION_KEY, token);
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  }

  function getSavedAttempt() {
    var raw = localStorage.getItem(DEMO_ATTEMPT_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(DEMO_ATTEMPT_KEY);
      return null;
    }
  }

  function saveAttempt(attempt) {
    localStorage.setItem(DEMO_ATTEMPT_KEY, JSON.stringify(attempt));
  }

  function clearAttempt() {
    localStorage.removeItem(DEMO_ATTEMPT_KEY);
  }

  if (params.get("reset") === "1") {
    setStudentSessionToken("");
    clearAttempt();
  }

  function createError(message, code) {
    var error = new Error(message);
    error.code = code || "";
    return error;
  }

  function scoreAnswers(questions, answers) {
    var safeAnswers = answers && typeof answers === "object" ? answers : {};
    var correctCount = 0;
    var answeredCount = 0;

    (Array.isArray(questions) ? questions : []).forEach(function (question) {
      var chosen = clean(safeAnswers[question.id]).toLowerCase();
      if (chosen) {
        answeredCount += 1;
      }
      if (chosen && chosen === clean(question.correctOptionId).toLowerCase()) {
        correctCount += 1;
      }
    });

    return {
      score: correctCount,
      correctCount: correctCount,
      answeredCount: answeredCount,
      totalQuestions: Array.isArray(questions) ? questions.length : 0
    };
  }

  function roundOne(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function buildRuleSummary(result, questions, answers, submittedAt) {
    // Use advanced suggestion engine if available, otherwise fallback to basic logic
    if (window.VisionSuggestionEngine && typeof window.VisionSuggestionEngine.buildAdvancedSummary === "function") {
      var summary = window.VisionSuggestionEngine.buildAdvancedSummary(result, questions, answers, submittedAt || getNowIso());
      return summary;
    }

    // Fallback to basic suggestion logic (if suggestion engine hasn't loaded yet)
    var totalQuestions = Number(result.totalQuestions || 0);
    var correctCount = Number(result.correctCount || 0);
    var answeredCount = Number(result.answeredCount || 0);
    var unansweredCount = Math.max(totalQuestions - answeredCount, 0);
    var percentage = totalQuestions ? roundOne((correctCount / totalQuestions) * 100) : 0;
    var attemptedAccuracy = answeredCount ? roundOne((correctCount / answeredCount) * 100) : 0;
    var suggestionCodes = [];

    function addSuggestion(code) {
      if (code && suggestionCodes.indexOf(code) === -1 && suggestionCodes.length < 4) {
        suggestionCodes.push(code);
      }
    }

    if (percentage >= 80) {
      addSuggestion("maintain_mock_tests");
      addSuggestion("review_missed_questions");
    } else if (percentage >= 55) {
      addSuggestion("practice_topic_sets");
      addSuggestion("review_missed_questions");
    } else {
      addSuggestion("revise_core_concepts");
      addSuggestion("practice_small_sets");
    }

    if (unansweredCount > 0) {
      addSuggestion("improve_time_management");
      addSuggestion("attempt_all_questions");
    }

    if (answeredCount >= Math.max(totalQuestions - 1, 1) && attemptedAccuracy < 60) {
      addSuggestion("focus_accuracy_before_speed");
    }

    var performanceStatusCode = "needs_improvement";
    if (percentage >= 80) {
      performanceStatusCode = "strong_performance";
    } else if (percentage >= 60) {
      performanceStatusCode = "good_progress";
    } else if (percentage >= 45) {
      performanceStatusCode = "steady_progress";
    }

    return {
      score: Number(result.score || 0),
      correctCount: correctCount,
      answeredCount: answeredCount,
      totalQuestions: totalQuestions,
      submittedAt: submittedAt || getNowIso(),
      percentage: percentage,
      attemptedAccuracy: attemptedAccuracy,
      unansweredCount: unansweredCount,
      performanceStatusCode: performanceStatusCode,
      suggestionCodes: suggestionCodes
    };
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  function getQuestionStats(questions, answers, key, value) {
    var asked = 0;
    var correct = 0;

    questions.forEach(function (question) {
      if (clean(question[key]) !== clean(value)) {
        return;
      }
      var chosen = clean(answers[question.id]).toLowerCase();
      if (!chosen) {
        return;
      }
      asked += 1;
      if (chosen === clean(question.correctOptionId).toLowerCase()) {
        correct += 1;
      }
    });

    return asked ? correct / asked : null;
  }

  function chooseFocusQuestion(questions, answers) {
    var firstWrong = null;
    var firstUnanswered = null;
    var lastAnswered = null;

    questions.forEach(function (question, index) {
      var chosen = clean(answers[question.id]).toLowerCase();
      if (!chosen && !firstUnanswered) {
        firstUnanswered = { question: question, position: index + 1 };
      }
      if (chosen) {
        lastAnswered = { question: question, position: index + 1 };
      }
      if (chosen && chosen !== clean(question.correctOptionId).toLowerCase() && !firstWrong) {
        firstWrong = { question: question, position: index + 1 };
      }
    });

    return firstWrong || firstUnanswered || lastAnswered || { question: questions[0], position: 1 };
  }

  function buildModelPayload(test, answers, startedAt, submittedAt) {
    var questions = Array.isArray(test.questions) ? test.questions : [];
    var result = scoreAnswers(questions, answers);
    var focus = chooseFocusQuestion(questions, answers);
    var elapsedSeconds = Math.max(Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000), 1);
    var answeredCount = Math.max(Number(result.answeredCount || 0), 1);
    var overallAccuracy = Number(result.correctCount || 0) / answeredCount;
    var averageExpected = questions.reduce(function (sum, question) {
      return sum + Number(question.expected_time_sec || 90);
    }, 0) / Math.max(questions.length, 1);
    var averageTimeSpent = elapsedSeconds / answeredCount;
    var remainingSeconds = Math.max((new Date(startedAt).getTime() + (Number(test.durationMinutes || 0) * 60 * 1000)) - new Date(submittedAt).getTime(), 0) / 1000;
    var timeRatio = averageTimeSpent / Math.max(averageExpected, 1);
    var subjectAccuracyNow = getQuestionStats(questions, answers, "subject", focus.question.subject);
    var topicAccuracyNow = getQuestionStats(questions, answers, "topic", focus.question.topic);
    var difficultyAccuracyNow = getQuestionStats(questions, answers, "difficulty_level", focus.question.difficulty_level);

    function mix(base, current, weight) {
      var currentValue = typeof current === "number" && !Number.isNaN(current) ? current : base;
      return (base * (1 - weight)) + (currentValue * weight);
    }

    return {
      past_accuracy: clamp(mix(DEMO_PROFILE.overallAccuracy, overallAccuracy, 0.35), 0.05, 0.99),
      past_avg_time_ratio: clamp(mix(DEMO_PROFILE.avgTimeRatio, timeRatio, 0.5), 0.2, 3),
      past_avg_efficiency: mix(DEMO_PROFILE.avgEfficiency, overallAccuracy - Math.max(timeRatio - 1, 0), 0.45),
      past_subject_accuracy: clamp(mix(DEMO_PROFILE.subjectAccuracy[focus.question.subject] || DEMO_PROFILE.overallAccuracy, subjectAccuracyNow, 0.45), 0.05, 0.99),
      past_topic_accuracy: clamp(mix(DEMO_PROFILE.topicAccuracy[focus.question.topic] || DEMO_PROFILE.overallAccuracy, topicAccuracyNow, 0.45), 0.05, 0.99),
      past_difficulty_accuracy: clamp(mix(DEMO_PROFILE.difficultyAccuracy[focus.question.difficulty_level] || DEMO_PROFILE.overallAccuracy, difficultyAccuracyNow, 0.45), 0.05, 0.99),
      question_past_accuracy: Number(focus.question.question_past_accuracy || 0.5),
      question_past_avg_time: Number(focus.question.question_past_avg_time || focus.question.expected_time_sec || 90),
      question_position: Number(focus.position || 1),
      fatigue_index: clamp((Number(focus.position || 1) / Math.max(questions.length, 1)) * 0.95, 0.01, 0.99),
      time_remaining_ratio: clamp(remainingSeconds / Math.max((Number(focus.question.expected_time_sec || 90) * Math.max(questions.length - Number(focus.position || 1) + 1, 1)), 1), 0, 2),
      pace_so_far: clamp(averageTimeSpent, 10, 600),
      expected_time_sec: Number(focus.question.expected_time_sec || 90),
      difficulty_level: clean(focus.question.difficulty_level),
      subject: clean(focus.question.subject),
      topic: clean(focus.question.topic),
      difficulty_encoded: CATEGORY_MAPS.difficulty_level[clean(focus.question.difficulty_level)] || 0,
      subject_encoded: CATEGORY_MAPS.subject[clean(focus.question.subject)] || 0,
      topic_encoded: CATEGORY_MAPS.topic[clean(focus.question.topic)] || 0
    };
  }

  async function callModel(payload) {
    var response = await fetch(MODEL_API_BASE + "/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    var body = {};
    try {
      body = await response.json();
    } catch (error) {
      body = {};
    }
    if (!response.ok || !body.ok) {
      throw createError(clean(body.error) || "Local model server returned an error.", "MODEL_ERROR");
    }
    return body;
  }

  async function buildDemoSummary(test, answers, startedAt, submittedAt) {
    var baseSummary = buildRuleSummary(scoreAnswers(test.questions, answers), test.questions, answers, submittedAt);
    var modelPayload = buildModelPayload(test, answers, startedAt, submittedAt);

    try {
      var modelResponse = await callModel(modelPayload);
      return Object.assign({}, baseSummary, {
        customStatusLabel: clean(modelResponse.status && modelResponse.status.label),
        customStatusNote: clean(modelResponse.status && modelResponse.status.summary),
        customSuggestions: Array.isArray(modelResponse.suggestions) ? modelResponse.suggestions.map(function (entry) {
          return {
            title: clean(entry && entry.title),
            body: clean(entry && entry.message)
          };
        }).filter(function (entry) {
          return entry.title && entry.body;
        }) : [],
        modelInsight: {
          connected: true,
          label: clean(modelResponse.prediction && modelResponse.prediction.label),
          probabilityCorrect: Number(modelResponse.prediction && modelResponse.prediction.probabilityCorrect || 0),
          detail: clean(modelResponse.status && modelResponse.status.summary)
        }
      });
    } catch (error) {
      return Object.assign({}, baseSummary, {
        modelInsight: {
          connected: false,
          label: "Model Not Connected",
          probabilityCorrect: 0,
          detail: "Start the local Random Forest portal server before submitting the demo test."
        }
      });
    }
  }

  async function studentLogin(loginName, password) {
    if (clean(loginName) !== DEMO_LOGIN.loginName || clean(password) !== DEMO_LOGIN.password) {
      throw createError("Use demo-student / demo123 for local demo mode.", "DEMO_LOGIN_FAILED");
    }
    setStudentSessionToken("demo-active");
    return {
      ok: true,
      student: clone(DEMO_STUDENT)
    };
  }

  async function logoutStudent() {
    setStudentSessionToken("");
  }

  async function getStudentSession() {
    if (!getStudentSessionToken()) {
      throw createError("Demo session is not active.", "SESSION_MISSING");
    }
    return {
      ok: true,
      student: clone(DEMO_STUDENT)
    };
  }

  async function getActiveTest() {
    await getStudentSession();
    var test = getDemoTest();
    var attempt = getSavedAttempt();
    if (attempt && clean(attempt.status) !== "started") {
      return {
        ok: true,
        state: "submitted",
        student: clone(DEMO_STUDENT),
        test: clone(test),
        summary: clone(attempt.summary),
        message: "Your demo test has already been submitted."
      };
    }

    if (attempt && clean(attempt.status) === "started") {
      if (new Date(attempt.expiresAt).getTime() <= Date.now()) {
        var timedOutSummary = await buildDemoSummary(test, attempt.answers || {}, attempt.startedAt, getNowIso());
        attempt.status = "auto_submitted";
        attempt.submittedAt = timedOutSummary.submittedAt;
        attempt.summary = timedOutSummary;
        saveAttempt(attempt);
        return {
          ok: true,
          state: "submitted",
          student: clone(DEMO_STUDENT),
          test: clone(test),
          summary: clone(timedOutSummary),
          message: "Your demo test has already been submitted."
        };
      }
      return {
        ok: true,
        state: "in_progress",
        student: clone(DEMO_STUDENT),
        test: clone(test),
        attempt: {
          id: attempt.id,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          answers: clone(attempt.answers || {})
        },
        message: "Your demo test is in progress."
      };
    }

    return {
      ok: true,
      state: "ready",
      student: clone(DEMO_STUDENT),
      test: clone(test),
      message: "Your demo test is ready to start."
    };
  }

  async function startAttempt() {
    var activePayload = await getActiveTest();
    if (activePayload.state === "in_progress") {
      return {
        ok: true,
        test: activePayload.test,
        attempt: activePayload.attempt
      };
    }
    if (activePayload.state === "submitted") {
      throw createError("Your demo test has already been submitted.", "ALREADY_SUBMITTED");
    }

    var now = new Date();
    var test = activePayload.test;
    var attempt = {
      id: DEMO_STUDENT.id + "__" + test.id,
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + (Number(test.durationMinutes || 0) * 60 * 1000)).toISOString(),
      answers: {},
      status: "started",
      totalQuestions: test.questionCount
    };
    saveAttempt(attempt);

    return {
      ok: true,
      test: clone(test),
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        answers: {}
      }
    };
  }

  async function submitAttempt(payload) {
    var activePayload = await getActiveTest();
    var test = activePayload.test;
    var attempt = getSavedAttempt();

    if (!attempt || clean(attempt.status) !== "started") {
      if (attempt && attempt.summary) {
        return {
          ok: true,
          summary: clone(attempt.summary)
        };
      }
      throw createError("No active demo attempt was found.", "ATTEMPT_MISSING");
    }

    var safePayload = payload && typeof payload === "object" ? payload : {};
    var answers = safePayload.answers && typeof safePayload.answers === "object" ? clone(safePayload.answers) : {};
    var submittedAt = getNowIso();
    var summary = await buildDemoSummary(test, answers, attempt.startedAt, submittedAt);

    attempt.answers = answers;
    attempt.status = safePayload.autoSubmit ? "auto_submitted" : "submitted";
    attempt.submittedAt = submittedAt;
    attempt.summary = summary;
    saveAttempt(attempt);

    return {
      ok: true,
      summary: clone(summary)
    };
  }

  window.VisionTestApi = {
    isDemoMode: function () {
      return true;
    },
    getDemoCredentials: function () {
      return clone(DEMO_LOGIN);
    },
    getStudentSessionToken: getStudentSessionToken,
    setStudentSessionToken: setStudentSessionToken,
    isNetworkError: function () {
      return false;
    },
    studentLogin: studentLogin,
    logoutStudent: logoutStudent,
    getStudentSession: getStudentSession,
    getActiveTest: getActiveTest,
    startAttempt: startAttempt,
    submitAttempt: submitAttempt,
    resetDemoAttempt: function () {
      clearAttempt();
    }
  };
})();
