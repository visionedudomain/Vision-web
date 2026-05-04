(function () {
  "use strict";

  var SESSION_KEY = "vision_test_student_session_v2";
  var FIREBASE_VERSION = "12.7.0";
  var STUDENT_APP_NAME = "vision-test-student-app";
  var REGISTRATIONS_COLLECTION = "test_registrations";
  var STUDENTS_COLLECTION = "students";
  var LOGIN_INDEX_COLLECTION = "student_login_index";
  var PUBLIC_TESTS_COLLECTION = "published_tests";
  var ATTEMPTS_COLLECTION = "attempts";
  var ANSWER_KEYS_COLLECTION = "test_answer_keys";

  var studentState = {
    api: null,
    app: null,
    auth: null,
    db: null,
    currentUser: null,
    readyPromise: null
  };

  function clean(value) {
    return String(value || "").trim();
  }

  function normalizeLanguage(value) {
    return clean(value).toLowerCase() === "ta" || clean(value).toLowerCase() === "tamil" ? "ta" : "en";
  }

  function normalizeLoginName(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function pseudoStudentEmail(loginNameNormalized) {
    return clean(loginNameNormalized) + "@students.visionacademy.local";
  }

  function buildStudentAuthEmail(loginNameNormalized) {
    return clean(loginNameNormalized) + "__" + Date.now() + Math.random().toString(36).slice(2, 8) + "@students.visionacademy.local";
  }

  function getStudentSessionToken() {
    return localStorage.getItem(SESSION_KEY) || "";
  }

  function setStudentSessionToken(token) {
    if (token) {
      localStorage.setItem(SESSION_KEY, token);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function isNetworkError(error) {
    var code = clean(error && error.code).toLowerCase();
    var message = clean(error && error.message).toLowerCase();
    return code === "network_error" || code === "auth/network-request-failed" || code === "unavailable" || /network|offline|unavailable|failed to fetch|load failed/.test(message);
  }

  function isPermissionError(error) {
    var code = clean(error && error.code).toLowerCase();
    var message = clean(error && error.message).toLowerCase();
    return code === "permission-denied" || /missing or insufficient permissions/.test(message);
  }

  function createError(message, code, cause) {
    var error = new Error(message);
    error.code = code || "";
    if (cause) {
      error.cause = cause;
    }
    return error;
  }

  function hasRequiredFirebaseConfig(config) {
    return ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"].every(function (key) {
      return clean(config && config[key]);
    });
  }

  function createErrorFromPayload(payload, fallback) {
    var body = payload && typeof payload === "object" ? payload : {};
    return createError(clean(body.error && body.error.message) || clean(body.message) || clean(body.error) || fallback || "Request failed.");
  }

  function buildBackendUrl(functionName) {
    var baseUrl = clean((window.VisionFirebaseConfig || {}).backendBaseUrl || "").replace(/\/+$/, "");
    return (baseUrl || "") + "/.netlify/functions/" + clean(functionName);
  }

  async function getStudentIdToken(forceRefresh) {
    await ensureStudentFirebase();
    if (!studentState.currentUser || typeof studentState.currentUser.getIdToken !== "function") {
      throw createError("Student session is not active.", "SESSION_MISSING");
    }
    return studentState.currentUser.getIdToken(Boolean(forceRefresh));
  }

  async function callStudentFunction(functionName, options) {
    var token = await getStudentIdToken(false);
    var safeOptions = options && typeof options === "object" ? options : {};
    var method = clean(safeOptions.method || "POST").toUpperCase();
    var response = await fetch(buildBackendUrl(functionName), {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: method === "GET" ? undefined : JSON.stringify(safeOptions.body || {})
    });
    var payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }
    if (!response.ok) {
      var backendError = createErrorFromPayload(payload, safeOptions.fallbackMessage || "Request failed.");
      backendError.status = response.status;
      throw backendError;
    }
    return payload;
  }

  async function callAdminFunction(functionName, options) {
    var store = await requireAdminStore();
    if (!store || typeof store.getAdminIdToken !== "function") {
      throw createError("Admin login is required.", "ADMIN_SESSION_MISSING");
    }
    var token = await store.getAdminIdToken(false);
    var safeOptions = options && typeof options === "object" ? options : {};
    var method = clean(safeOptions.method || "POST").toUpperCase();
    var response = await fetch(buildBackendUrl(functionName), {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: method === "GET" ? undefined : JSON.stringify(safeOptions.body || {})
    });
    var payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }
    if (!response.ok) {
      var backendError = createErrorFromPayload(payload, safeOptions.fallbackMessage || "Request failed.");
      backendError.status = response.status;
      throw backendError;
    }
    return payload;
  }

  function shouldFallbackToDirectRewrite(error) {
    var status = Number(error && error.status || 0);
    if (status === 404 || status === 405 || status >= 500) {
      return true;
    }
    return isNetworkError(error);
  }

  function getFirebaseModuleUrl(fileName) {
    return "https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/" + fileName;
  }

  async function loadStudentApi() {
    if (studentState.api) {
      return studentState.api;
    }

    var modules = await Promise.all([
      import(getFirebaseModuleUrl("firebase-app.js")),
      import(getFirebaseModuleUrl("firebase-auth.js")),
      import(getFirebaseModuleUrl("firebase-firestore.js"))
    ]);

    studentState.api = {
      initializeApp: modules[0].initializeApp,
      getApp: modules[0].getApp,
      getApps: modules[0].getApps,
      getAuth: modules[1].getAuth,
      onAuthStateChanged: modules[1].onAuthStateChanged,
      signInWithEmailAndPassword: modules[1].signInWithEmailAndPassword,
      signOut: modules[1].signOut,
      setPersistence: modules[1].setPersistence,
      browserLocalPersistence: modules[1].browserLocalPersistence,
      getFirestore: modules[2].getFirestore,
      collection: modules[2].collection,
      query: modules[2].query,
      where: modules[2].where,
      limit: modules[2].limit,
      getDocs: modules[2].getDocs,
      getDoc: modules[2].getDoc,
      setDoc: modules[2].setDoc,
      doc: modules[2].doc
    };

    return studentState.api;
  }

  async function requestIdentityToolkit(endpoint, body) {
    var apiKey = clean((window.VisionFirebaseConfig || {}).apiKey);
    if (!apiKey) {
      throw createError("Firebase apiKey is missing in assets/js/firebase-config.js.", "CONFIG_MISSING");
    }
    var response = await fetch("https://identitytoolkit.googleapis.com/v1/" + endpoint + "?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || {})
    });
    var payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }
    if (!response.ok) {
      throw createErrorFromPayload(payload, "Unable to complete student login setup right now.");
    }
    return payload;
  }

  async function provisionStudentAuthAccount(loginNameNormalized, password) {
    var authEmail = buildStudentAuthEmail(loginNameNormalized);
    var payload = await requestIdentityToolkit("accounts:signUp", {
      email: authEmail,
      password: password,
      returnSecureToken: true
    });
    var authUid = clean(payload.localId);
    if (!authUid) {
      throw createError("Unable to create the student login account.", "AUTH_CREATE_FAILED");
    }
    return {
      authUid: authUid,
      authEmail: authEmail,
      cleanupToken: clean(payload.idToken)
    };
  }

  async function deleteStudentAuthAccount(idToken) {
    if (!clean(idToken)) {
      return;
    }
    try {
      await requestIdentityToolkit("accounts:delete", {
        idToken: clean(idToken)
      });
    } catch (error) {
      console.warn("Unable to clean up student auth account", error);
    }
  }

  async function ensureStudentFirebase() {
    if (studentState.readyPromise) {
      return studentState.readyPromise;
    }

    studentState.readyPromise = (async function () {
      var config = window.VisionFirebaseConfig || {};
      if (!hasRequiredFirebaseConfig(config)) {
        throw new Error("Firebase is not configured. Update assets/js/firebase-config.js first.");
      }

      var api = await loadStudentApi();
      try {
        studentState.app = api.getApp(STUDENT_APP_NAME);
      } catch (error) {
        studentState.app = api.initializeApp(config, STUDENT_APP_NAME);
      }
      studentState.auth = api.getAuth(studentState.app);
      studentState.db = api.getFirestore(studentState.app);

      try {
        await api.setPersistence(studentState.auth, api.browserLocalPersistence);
      } catch (error) {
        console.warn("Student auth persistence warning", error);
      }

      await new Promise(function (resolve) {
        api.onAuthStateChanged(studentState.auth, function (user) {
          studentState.currentUser = user || null;
          setStudentSessionToken(user && user.uid ? user.uid : "");
          resolve();
        }, function () {
          studentState.currentUser = null;
          setStudentSessionToken("");
          resolve();
        });
      });

      return studentState;
    })();

    return studentState.readyPromise;
  }

  function mapStudentDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      displayName: clean(data.displayName),
      loginName: clean(data.loginName),
      language: normalizeLanguage(data.language),
      mobile: clean(data.mobile),
      batchName: clean(data.batchName),
      examName: clean(data.examName),
      status: clean(data.status) || "approved"
    };
  }

  function mapPublicTestDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      title: clean(data.title),
      language: normalizeLanguage(data.language),
      opensAt: clean(data.opensAt),
      opensAtMs: Number(data.opensAtMs || 0),
      closesAt: clean(data.closesAt),
      closesAtMs: Number(data.closesAtMs || 0),
      durationMinutes: Number(data.durationMinutes || 0),
      questionCount: Number(data.questionCount || 0),
      questions: (Array.isArray(data.questions) ? data.questions : []).map(function (question) {
        return {
          id: clean(question && question.id),
          prompt: clean(question && question.prompt),
          options: (Array.isArray(question && question.options) ? question.options : []).map(function (option) {
            return {
              id: clean(option && option.id),
              text: clean(option && option.text)
            };
          }).filter(function (option) {
            return option.id && option.text;
          })
        };
      }).filter(function (question) {
        return question.id && question.prompt;
      })
    };
  }

  function mapAttemptDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      studentId: clean(data.studentId),
      studentDisplayName: clean(data.studentDisplayName),
      studentLoginName: clean(data.studentLoginName),
      testId: clean(data.testId),
      testTitle: clean(data.testTitle),
      language: normalizeLanguage(data.language),
      startedAt: clean(data.startedAt),
      startedAtMs: Number(data.startedAtMs || 0),
      expiresAt: clean(data.expiresAt),
      expiresAtMs: Number(data.expiresAtMs || 0),
      submittedAt: clean(data.submittedAt),
      submittedAtMs: Number(data.submittedAtMs || 0),
      answers: data.answers && typeof data.answers === "object" ? JSON.parse(JSON.stringify(data.answers)) : {},
      score: Number(data.score || 0),
      correctCount: Number(data.correctCount || 0),
      answeredCount: Number(data.answeredCount || 0),
      percentage: Number(data.percentage || 0),
      attemptedAccuracy: Number(data.attemptedAccuracy || 0),
      unansweredCount: Number(data.unansweredCount || 0),
      performanceStatusCode: clean(data.performanceStatusCode),
      suggestionCodes: Array.isArray(data.suggestionCodes) ? data.suggestionCodes.slice() : [],
      status: clean(data.status) || "started",
      totalQuestions: Number(data.totalQuestions || 0),
      rewriteRequestStatus: clean(data.rewriteRequestStatus),
      rewriteRequestedAt: clean(data.rewriteRequestedAt),
      rewriteRequestedAtMs: Number(data.rewriteRequestedAtMs || 0),
      rewriteReviewedAt: clean(data.rewriteReviewedAt),
      rewriteReviewedAtMs: Number(data.rewriteReviewedAtMs || 0),
      rewriteReviewedBy: clean(data.rewriteReviewedBy)
    };
  }

  function scoreAnswers(answerKeyQuestions, answers) {
    var safeAnswers = answers && typeof answers === "object" ? answers : {};
    var correctCount = 0;
    var answeredCount = 0;

    (Array.isArray(answerKeyQuestions) ? answerKeyQuestions : []).forEach(function (question) {
      var questionId = clean(question && question.id);
      var chosen = clean(safeAnswers[questionId]).toLowerCase();
      var correct = clean(question && question.correctOptionId).toLowerCase();
      if (chosen) {
        answeredCount += 1;
      }
      if (chosen && chosen === correct) {
        correctCount += 1;
      }
    });

    return {
      score: correctCount,
      correctCount: correctCount,
      answeredCount: answeredCount,
      totalQuestions: Array.isArray(answerKeyQuestions) ? answerKeyQuestions.length : 0
    };
  }

  function getAttemptDocumentId(studentId, testId) {
    return clean(studentId) + "__" + clean(testId);
  }

  function clampExpiry(now, closesAtIso, durationMinutes) {
    var closeTime = new Date(closesAtIso).getTime();
    var timedEnd = now.getTime() + (Number(durationMinutes || 0) * 60 * 1000);
    return new Date(Math.min(closeTime, timedEnd)).toISOString();
  }

  function roundOne(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function sanitizeAnswers(questions, answers) {
    var safeAnswers = answers && typeof answers === "object" ? answers : {};
    var validQuestionIds = {};
    (Array.isArray(questions) ? questions : []).forEach(function (question) {
      validQuestionIds[clean(question && question.id)] = true;
    });
    return Object.keys(safeAnswers).reduce(function (acc, questionId) {
      var normalizedQuestionId = clean(questionId);
      var choice = clean(safeAnswers[questionId]).toLowerCase();
      if (validQuestionIds[normalizedQuestionId] && /^[a-d]$/.test(choice)) {
        acc[normalizedQuestionId] = choice;
      }
      return acc;
    }, {});
  }

  async function getActivePublicTestSnapshot(studentLanguage) {
    await ensureStudentFirebase();
    var snapshot = await studentState.api.getDocs(studentState.api.query(
      studentState.api.collection(studentState.db, PUBLIC_TESTS_COLLECTION),
      studentState.api.where("isActive", "==", true)
    ));
    var targetLanguage = normalizeLanguage(studentLanguage);
    var targetDoc = null;
    snapshot.docs.forEach(function (docSnapshot) {
      if (normalizeLanguage((docSnapshot.data() || {}).language) === targetLanguage) {
        targetDoc = docSnapshot;
      }
    });
    return targetDoc;
  }

  async function getStudentSnapshotByUid(uid) {
    await ensureStudentFirebase();
    return studentState.api.getDoc(studentState.api.doc(studentState.db, STUDENTS_COLLECTION, clean(uid)));
  }

  async function getAttemptSnapshot(studentId, testId) {
    await ensureStudentFirebase();
    var safeStudentId = clean(studentId);
    var safeTestId = clean(testId);
    if (!safeStudentId || !safeTestId) {
      return null;
    }
    var snapshot = await studentState.api.getDocs(studentState.api.query(
      studentState.api.collection(studentState.db, ATTEMPTS_COLLECTION),
      studentState.api.where("studentId", "==", safeStudentId)
    ));
    if (snapshot.empty) {
      return null;
    }
    var matchedDoc = null;
    snapshot.docs.some(function (docSnapshot) {
      var data = docSnapshot.data() || {};
      if (clean(data.testId) === safeTestId) {
        matchedDoc = docSnapshot;
        return true;
      }
      return false;
    });
    return matchedDoc;
  }

  async function getStudentAuthEmail(loginNameNormalized) {
    await ensureStudentFirebase();
    try {
      var loginIndexSnapshot = await studentState.api.getDoc(studentState.api.doc(studentState.db, LOGIN_INDEX_COLLECTION, clean(loginNameNormalized)));
      if (loginIndexSnapshot.exists()) {
        var authEmail = clean((loginIndexSnapshot.data() || {}).authEmail);
        if (authEmail) {
          return authEmail;
        }
      }
    } catch (error) {
      if (clean(error && error.code) !== "permission-denied") {
        console.warn("Student login index lookup failed", error);
      }
    }
    return pseudoStudentEmail(loginNameNormalized);
  }

  async function getStudentSession() {
    await ensureStudentFirebase();
    if (!studentState.currentUser) {
      throw createError("Student session is not active.", "SESSION_MISSING");
    }
    var studentSnapshot = await getStudentSnapshotByUid(studentState.currentUser.uid);
    if (!studentSnapshot.exists()) {
      await logoutStudent();
      throw createError("Your test access is not active yet.", "STUDENT_NOT_FOUND");
    }
    var student = mapStudentDocument(studentSnapshot);
    if (student.status !== "approved") {
      await logoutStudent();
      throw createError("Your test access is not active yet.", "STUDENT_INACTIVE");
    }
    return {
      ok: true,
      student: student
    };
  }

  function buildBasicSummary(result, submittedAt) {
    var safe = result && typeof result === "object" ? result : {};
    var totalQuestions = Number(safe.totalQuestions || 0);
    var correctCount = Number(safe.correctCount || 0);
    var answeredCount = Number(safe.answeredCount || 0);
    var unansweredCount = Math.max(totalQuestions - answeredCount, 0);
    var percentage = totalQuestions ? roundOne((correctCount / totalQuestions) * 100) : 0;
    var attemptedAccuracy = answeredCount ? roundOne((correctCount / answeredCount) * 100) : 0;
    var suggestionCodes = [];

    function addSuggestion(code) {
      if (code && suggestionCodes.indexOf(code) === -1 && suggestionCodes.length < 5) {
        suggestionCodes.push(code);
      }
    }

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

    var performanceStatusCode = "needs_improvement";
    if (percentage >= 80) {
      performanceStatusCode = "strong_performance";
    } else if (percentage >= 60) {
      performanceStatusCode = "good_progress";
    } else if (percentage >= 45) {
      performanceStatusCode = "steady_progress";
    }

    return {
      score: Number(safe.score || 0),
      correctCount: correctCount,
      answeredCount: answeredCount,
      totalQuestions: totalQuestions,
      submittedAt: clean(submittedAt),
      percentage: percentage,
      attemptedAccuracy: attemptedAccuracy,
      unansweredCount: unansweredCount,
      performanceStatusCode: performanceStatusCode,
      suggestionCodes: suggestionCodes
    };
  }

  function buildEnhancedAnswerSummary(result, answers, answerQuestions, submittedAt, fallbackTotalQuestions) {
    var normalizedResult = {
      score: Number(result && result.score || 0),
      correctCount: Number(result && result.correctCount || 0),
      answeredCount: Number(result && result.answeredCount || 0),
      totalQuestions: Number(result && result.totalQuestions || fallbackTotalQuestions || 0)
    };
    var safeAnswers = answers && typeof answers === "object" ? JSON.parse(JSON.stringify(answers)) : {};
    var safeQuestions = Array.isArray(answerQuestions) ? JSON.parse(JSON.stringify(answerQuestions)) : [];
    var submittedValue = clean(submittedAt);

    if (window.VisionSuggestionEngine && typeof window.VisionSuggestionEngine.buildAdvancedSummary === "function") {
      try {
        return window.VisionSuggestionEngine.buildAdvancedSummary(normalizedResult, safeQuestions, safeAnswers, submittedValue);
      } catch (error) {
        console.warn("Advanced suggestion summary failed", error);
      }
    }

    if (window.SuggestionGenerator && typeof window.SuggestionGenerator.buildSummaryWithSuggestions === "function") {
      try {
        return window.SuggestionGenerator.buildSummaryWithSuggestions(
          normalizedResult.correctCount,
          normalizedResult.totalQuestions,
          normalizedResult.answeredCount,
          submittedValue
        );
      } catch (error) {
        console.warn("Fallback suggestion generator failed", error);
      }
    }

    return buildBasicSummary(normalizedResult, submittedValue);
  }

  function decorateSummaryWithRewriteRequest(summary, attempt) {
    var safeSummary = summary && typeof summary === "object" ? summary : {};
    var safeAttempt = attempt && typeof attempt === "object" ? attempt : {};
    safeSummary.rewriteRequestStatus = clean(safeAttempt.rewriteRequestStatus);
    safeSummary.rewriteRequestedAt = clean(safeAttempt.rewriteRequestedAt);
    safeSummary.rewriteReviewedAt = clean(safeAttempt.rewriteReviewedAt);
    return safeSummary;
  }

  function buildStoredAttemptSummary(attempt) {
    var safeAttempt = attempt && typeof attempt === "object" ? attempt : {};
    var summary = buildBasicSummary({
      score: Number(safeAttempt.score || safeAttempt.correctCount || 0),
      correctCount: Number(safeAttempt.correctCount || safeAttempt.score || 0),
      answeredCount: Number(safeAttempt.answeredCount || 0),
      totalQuestions: Number(safeAttempt.totalQuestions || 0)
    }, clean(safeAttempt.submittedAt));

    if (Number(safeAttempt.percentage || 0) > 0 || Number(safeAttempt.correctCount || 0) === 0) {
      summary.percentage = Number(safeAttempt.percentage || 0);
    }
    if (Number(safeAttempt.attemptedAccuracy || 0) > 0 || Number(safeAttempt.answeredCount || 0) === 0) {
      summary.attemptedAccuracy = Number(safeAttempt.attemptedAccuracy || 0);
    }
    summary.unansweredCount = Number(safeAttempt.unansweredCount || summary.unansweredCount || 0);
    summary.performanceStatusCode = clean(safeAttempt.performanceStatusCode) || clean(summary.performanceStatusCode);
    if (Array.isArray(safeAttempt.suggestionCodes) && safeAttempt.suggestionCodes.length) {
      summary.suggestionCodes = safeAttempt.suggestionCodes.slice();
    }
    return summary;
  }

  async function getAnswerSummary(testId, answers, submittedAt, fallbackTotalQuestions) {
    await ensureStudentFirebase();
    var answerKeySnapshot = await studentState.api.getDoc(studentState.api.doc(studentState.db, ANSWER_KEYS_COLLECTION, clean(testId)));
    var answerQuestions = answerKeySnapshot.exists() ? (answerKeySnapshot.data().questions || []) : [];
    var result = scoreAnswers(answerQuestions, answers);
    return buildEnhancedAnswerSummary(result, answers, answerQuestions, submittedAt, fallbackTotalQuestions);
  }

  async function finalizeExpiredAttempt(attemptRef, attemptData) {
    try {
      var backendResponse = await callStudentFunction("test-student-submit", {
        method: "POST",
        body: {
          answers: attemptData && attemptData.answers && typeof attemptData.answers === "object" ? attemptData.answers : {},
          autoSubmit: true
        },
        fallbackMessage: "Unable to submit the test right now."
      });
      return backendResponse.summary || backendResponse;
    } catch (backendError) {
      if (!shouldFallbackToDirectRewrite(backendError)) {
        throw backendError;
      }
    }

    var submittedAt = clean(attemptData.submittedAt) || new Date().toISOString();
    var summary;
    try {
      summary = await getAnswerSummary(attemptData.testId, attemptData.answers || {}, submittedAt, attemptData.totalQuestions);
    } catch (error) {
      if (isPermissionError(error)) {
        throw createError("Test submission needs the Netlify backend. Open the site through Netlify dev or set backendBaseUrl to your deployed Netlify site.", "SUBMIT_BACKEND_REQUIRED", error);
      }
      throw error;
    }
    await studentState.api.setDoc(attemptRef, {
      score: summary.score,
      correctCount: summary.correctCount,
      answeredCount: summary.answeredCount,
      totalQuestions: summary.totalQuestions,
      percentage: summary.percentage,
      attemptedAccuracy: summary.attemptedAccuracy,
      unansweredCount: summary.unansweredCount,
      performanceStatusCode: summary.performanceStatusCode,
      suggestionCodes: summary.suggestionCodes,
      status: "auto_submitted",
      submittedAt: submittedAt,
      submittedAtMs: Date.now(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return summary;
  }

  async function studentLogin(loginName, password) {
    await ensureStudentFirebase();
    var loginNameNormalized = normalizeLoginName(loginName);
    var safePassword = clean(password);
    if (!loginNameNormalized || !safePassword) {
      throw createError("Login failed. Check the login name and password.", "LOGIN_INVALID");
    }

    try {
      await studentState.api.signInWithEmailAndPassword(studentState.auth, await getStudentAuthEmail(loginNameNormalized), safePassword);
      setStudentSessionToken(studentState.auth.currentUser && studentState.auth.currentUser.uid ? studentState.auth.currentUser.uid : "1");
      return getStudentSession();
    } catch (error) {
      throw createError(
        window.VisionTestI18n ? window.VisionTestI18n.t("test_portal_login_failed", "Login failed. Check the login name and password.") : "Login failed. Check the login name and password.",
        clean(error && error.code) || "LOGIN_FAILED",
        error
      );
    }
  }

  async function logoutStudent() {
    if (!studentState.auth || !studentState.api) {
      setStudentSessionToken("");
      return;
    }
    try {
      await studentState.api.signOut(studentState.auth);
    } finally {
      studentState.currentUser = null;
      setStudentSessionToken("");
    }
  }

  async function registerStudent(payload) {
    await ensureStudentFirebase();
    
    // Ensure no previous student session is active, as Firestore rules require request.auth == null
    if (studentState.currentUser) {
      await logoutStudent();
    }

    var safe = payload && typeof payload === "object" ? payload : {};
    var displayName = clean(safe.displayName);
    var loginName = clean(safe.loginName);
    var loginNameNormalized = normalizeLoginName(loginName);
    var password = clean(safe.password);
    var mobile = clean(safe.mobile);
    var language = normalizeLanguage(safe.language);
    var batchName = clean(safe.batchName);

    if (!displayName || !loginNameNormalized || !mobile || !password) {
      throw createError("Name, login name, mobile number, and password are required.", "REGISTRATION_INVALID");
    }
    if (password.length < 6) {
      throw createError("Password must be at least 6 characters.", "REGISTRATION_PASSWORD_SHORT");
    }

    var provisionedAccount = await provisionStudentAuthAccount(loginNameNormalized, password);
    var now = new Date().toISOString();
    try {
      await studentState.api.setDoc(studentState.api.doc(studentState.db, REGISTRATIONS_COLLECTION, loginNameNormalized), {
        displayName: displayName,
        loginName: loginName,
        loginNameNormalized: loginNameNormalized,
        authUid: provisionedAccount.authUid,
        authEmail: provisionedAccount.authEmail,
        mobile: mobile,
        language: language,
        batchName: batchName,
        status: "pending",
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      await deleteStudentAuthAccount(provisionedAccount.cleanupToken);
      if (clean(error && error.code) === "permission-denied") {
        throw createError("This login name is already registered or approved for a student.", "REGISTRATION_CONFLICT", error);
      }
      throw createError("Unable to submit test registration right now.", clean(error && error.code) || "REGISTRATION_FAILED", error);
    }

    return {
      ok: true,
      registrationId: loginNameNormalized,
      message: "Online test registration submitted successfully."
    };
  }

  async function getActiveTest() {
    try {
      var backendResponse = await callStudentFunction("test-student-active", {
        method: "GET",
        fallbackMessage: "Unable to load the test right now."
      });
      if (backendResponse && backendResponse.state === "submitted" && backendResponse.summary) {
        backendResponse.summary = decorateSummaryWithRewriteRequest(backendResponse.summary, backendResponse.summary);
      }
      if (backendResponse && backendResponse.ok) {
        return backendResponse;
      }
    } catch (backendError) {
      if (!shouldFallbackToDirectRewrite(backendError)) {
        throw backendError;
      }
    }

    var sessionPayload = await getStudentSession();
    var activeTestSnapshot;
    try {
      activeTestSnapshot = await getActivePublicTestSnapshot(sessionPayload.student.language);
    } catch (error) {
      if (isPermissionError(error)) {
        throw createError(
          window.VisionTestI18n ? window.VisionTestI18n.t("test_portal_access_blocked", "Your login worked, but the test data is blocked by Firestore permissions. Publish the latest Firestore rules and republish the test.") : "Your login worked, but the test data is blocked by Firestore permissions. Publish the latest Firestore rules and republish the test.",
          "TEST_ACCESS_BLOCKED",
          error
        );
      }
      throw error;
    }
    if (!activeTestSnapshot) {
      return {
        ok: true,
        state: "no_test",
        student: sessionPayload.student,
        message: "No active online test is available right now."
      };
    }

    var publicTest = mapPublicTestDocument(activeTestSnapshot);
    var now = Date.now();
    var opensAt = Number(publicTest.opensAtMs || new Date(publicTest.opensAt).getTime());
    var closesAt = Number(publicTest.closesAtMs || new Date(publicTest.closesAt).getTime());
    var attemptRef = studentState.api.doc(studentState.db, ATTEMPTS_COLLECTION, getAttemptDocumentId(sessionPayload.student.id, publicTest.id));
    var attemptSnapshot;

    try {
      attemptSnapshot = await getAttemptSnapshot(sessionPayload.student.id, publicTest.id);
    } catch (error) {
      if (isPermissionError(error)) {
        throw createError(
          window.VisionTestI18n ? window.VisionTestI18n.t("test_portal_access_blocked", "Your login worked, but the test data is blocked by Firestore permissions. Publish the latest Firestore rules and republish the test.") : "Your login worked, but the test data is blocked by Firestore permissions. Publish the latest Firestore rules and republish the test.",
          "TEST_ACCESS_BLOCKED",
          error
        );
      }
      throw error;
    }

    if (attemptSnapshot && attemptSnapshot.exists()) {
      var attempt = mapAttemptDocument(attemptSnapshot);
      if (attempt.rewriteRequestStatus === "approved") {
        if (now < opensAt) {
          return {
            ok: true,
            state: "before_window",
            student: sessionPayload.student,
            test: publicTest,
            message: "The published test is not open yet."
          };
        }

        if (now > closesAt) {
          return {
            ok: true,
            state: "window_closed",
            student: sessionPayload.student,
            test: publicTest,
            message: "The published test window is closed."
          };
        }

        return {
          ok: true,
          state: "ready",
          student: sessionPayload.student,
          test: publicTest,
          message: "Your retest is ready to start."
        };
      }

      if (attempt.status !== "started") {
        var submittedSummary;
        try {
          submittedSummary = await getAnswerSummary(publicTest.id, attempt.answers || {}, attempt.submittedAt, attempt.totalQuestions);
        } catch (error) {
          if (isPermissionError(error)) {
            submittedSummary = buildStoredAttemptSummary(attempt);
          } else {
            throw error;
          }
        }
        return {
          ok: true,
          state: "submitted",
          student: sessionPayload.student,
          test: publicTest,
          summary: decorateSummaryWithRewriteRequest(submittedSummary, attempt),
          message: "Your test has already been submitted."
        };
      }

      if (new Date(attempt.expiresAt).getTime() <= now) {
        return {
          ok: true,
          state: "submitted",
          student: sessionPayload.student,
          test: publicTest,
          summary: decorateSummaryWithRewriteRequest(await finalizeExpiredAttempt(attemptRef, attempt), attempt),
          message: "Your test has already been submitted."
        };
      }

      return {
        ok: true,
        state: "in_progress",
        student: sessionPayload.student,
        test: publicTest,
        attempt: {
          id: attempt.id,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          answers: attempt.answers || {}
        },
        message: "Your test is in progress."
      };
    }

    if (now < opensAt) {
      return {
        ok: true,
        state: "before_window",
        student: sessionPayload.student,
        test: publicTest,
        message: "The published test is not open yet."
      };
    }

    if (now > closesAt) {
      return {
        ok: true,
        state: "window_closed",
        student: sessionPayload.student,
        test: publicTest,
        message: "The published test window is closed."
      };
    }

    return {
      ok: true,
      state: "ready",
      student: sessionPayload.student,
      test: publicTest,
      message: "Your test is ready to start."
    };
  }

  async function startAttempt() {
    try {
      var backendResponse = await callStudentFunction("test-student-start", {
        method: "POST",
        body: {},
        fallbackMessage: "Unable to start the test right now."
      });
      if (backendResponse && backendResponse.ok) {
        return {
          ok: true,
          test: backendResponse.test,
          attempt: backendResponse.attempt
        };
      }
    } catch (backendError) {
      if (!shouldFallbackToDirectRewrite(backendError)) {
        throw backendError;
      }
    }

    var activePayload = await getActiveTest();
    if (!activePayload.test) {
      throw createError("No active test is available right now.", "NO_ACTIVE_TEST");
    }
    if (activePayload.state === "in_progress") {
      return {
        ok: true,
        test: activePayload.test,
        attempt: activePayload.attempt
      };
    }
    if (activePayload.state === "submitted") {
      throw createError("Your test has already been submitted.", "ALREADY_SUBMITTED");
    }
    if (activePayload.state === "before_window") {
      throw createError("The test is not open yet.", "WINDOW_NOT_OPEN");
    }
    if (activePayload.state === "window_closed") {
      throw createError("The test window is already closed.", "WINDOW_CLOSED");
    }

    var now = new Date();
    var publicTest = activePayload.test;
    var attemptId = getAttemptDocumentId(activePayload.student.id, publicTest.id);
    var attemptRef = studentState.api.doc(studentState.db, ATTEMPTS_COLLECTION, attemptId);
    var expiresAt = clampExpiry(now, publicTest.closesAt, publicTest.durationMinutes);

    await studentState.api.setDoc(attemptRef, {
      studentId: activePayload.student.id,
      studentDisplayName: activePayload.student.displayName,
      studentLoginName: activePayload.student.loginName,
      testId: publicTest.id,
      testTitle: publicTest.title,
      language: publicTest.language,
      startedAt: now.toISOString(),
      startedAtMs: now.getTime(),
      expiresAt: expiresAt,
      expiresAtMs: new Date(expiresAt).getTime(),
      submittedAt: "",
      submittedAtMs: 0,
      status: "started",
      answers: {},
      totalQuestions: publicTest.questionCount,
      updatedAt: now.toISOString()
    }, { merge: false });

    return {
      ok: true,
      test: publicTest,
      attempt: {
        id: attemptId,
        startedAt: now.toISOString(),
        expiresAt: expiresAt,
        answers: {}
      }
    };
  }

  async function submitAttempt(payload) {
    var activePayload = await getActiveTest();
    if (!activePayload.test) {
      throw createError("No active test is available right now.", "NO_ACTIVE_TEST");
    }

    var publicTest = activePayload.test;
    var attemptRef = studentState.api.doc(studentState.db, ATTEMPTS_COLLECTION, getAttemptDocumentId(activePayload.student.id, publicTest.id));
    var attemptSnapshot = await studentState.api.getDoc(attemptRef);
    if (!attemptSnapshot.exists()) {
      throw createError("No active attempt was found for this student.", "ATTEMPT_MISSING");
    }

    var attempt = mapAttemptDocument(attemptSnapshot);
    if (attempt.status !== "started") {
      var existingSummary;
      try {
        existingSummary = await getAnswerSummary(publicTest.id, attempt.answers || {}, attempt.submittedAt, attempt.totalQuestions);
      } catch (error) {
        if (isPermissionError(error)) {
          existingSummary = buildStoredAttemptSummary(attempt);
        } else {
          throw error;
        }
      }
      return {
        ok: true,
        summary: decorateSummaryWithRewriteRequest(existingSummary, attempt)
      };
    }

    var safePayload = payload && typeof payload === "object" ? payload : {};
    var answers = sanitizeAnswers(publicTest.questions, safePayload.answers);

    try {
      var backendResponse = await callStudentFunction("test-student-submit", {
        method: "POST",
        body: {
          answers: answers,
          autoSubmit: Boolean(safePayload.autoSubmit)
        },
        fallbackMessage: "Unable to submit the test right now."
      });
      return {
        ok: true,
        summary: backendResponse.summary || backendResponse
      };
    } catch (backendError) {
      if (!shouldFallbackToDirectRewrite(backendError)) {
        throw backendError;
      }
    }

    var submittedAt = new Date().toISOString();
    var timedOut = new Date(attempt.expiresAt).getTime() <= Date.now();
    var finalStatus = safePayload.autoSubmit || timedOut ? "auto_submitted" : "submitted";
    var summary;

    try {
      summary = await getAnswerSummary(publicTest.id, answers, submittedAt, publicTest.questionCount);
    } catch (error) {
      if (isPermissionError(error)) {
        throw createError("Test submission needs the Netlify backend. Open the site through Netlify dev or set backendBaseUrl to your deployed Netlify site.", "SUBMIT_BACKEND_REQUIRED", error);
      }
      throw error;
    }

    try {
      await studentState.api.setDoc(attemptRef, {
        answers: answers,
        score: summary.score,
        correctCount: summary.correctCount,
        answeredCount: summary.answeredCount,
        totalQuestions: summary.totalQuestions,
        percentage: summary.percentage,
        attemptedAccuracy: summary.attemptedAccuracy,
        unansweredCount: summary.unansweredCount,
        performanceStatusCode: summary.performanceStatusCode,
        suggestionCodes: summary.suggestionCodes,
        submittedAt: submittedAt,
        submittedAtMs: new Date(submittedAt).getTime(),
        status: finalStatus,
        updatedAt: submittedAt
      }, { merge: true });
    } catch (error) {
      if (isPermissionError(error)) {
        throw createError("Test submission is blocked by Firestore permissions. Deploy the latest Netlify backend or publish the latest Firestore rules.", "SUBMIT_PERMISSION_BLOCKED", error);
      }
      throw createError("Unable to submit the test right now.", clean(error && error.code) || "SUBMIT_FAILED", error);
    }

    return {
      ok: true,
      summary: summary
    };
  }

  async function requestRewriteDirect(payload, activePayload) {
    var safe = payload && typeof payload === "object" ? payload : {};
    var requestedTestId = clean(safe.testId || activePayload.test.id);
    if (requestedTestId !== clean(activePayload.test.id)) {
      throw createError("Retest request could not be matched to the active test.", "TEST_MISMATCH");
    }

    var attemptSnapshot = await getAttemptSnapshot(activePayload.student.id, activePayload.test.id);
    if (!attemptSnapshot || !attemptSnapshot.exists()) {
      throw createError("No submitted test attempt was found for this student.", "ATTEMPT_MISSING");
    }

    var attempt = mapAttemptDocument(attemptSnapshot);
    if (attempt.status === "started") {
      throw createError("Finish and submit the current test before requesting a retest.", "ATTEMPT_IN_PROGRESS");
    }
    if (attempt.rewriteRequestStatus === "pending") {
      throw createError(window.VisionTestI18n ? window.VisionTestI18n.t("test_rewrite_already_requested", "You have already requested to retake this test.") : "You have already requested to retake this test.", "ALREADY_REQUESTED");
    }
    if (attempt.rewriteRequestStatus === "approved") {
      throw createError(window.VisionTestI18n ? window.VisionTestI18n.t("test_rewrite_approved_ready", "Your retest has already been approved. Log in again and start the test.") : "Your retest has already been approved. Log in again and start the test.", "ALREADY_APPROVED");
    }

    var requestedAt = new Date().toISOString();
    await studentState.api.setDoc(attemptSnapshot.ref, {
      rewriteRequestStatus: "pending",
      rewriteRequestedAt: requestedAt,
      rewriteRequestedAtMs: Date.now(),
      rewriteReviewedAt: "",
      rewriteReviewedAtMs: 0,
      rewriteReviewedBy: "",
      updatedAt: requestedAt
    }, { merge: true });

    return {
      ok: true,
      status: "pending",
      requestedAt: requestedAt
    };
  }

  async function requireAdminStore() {
    if (!window.VisionTestStore) {
      throw new Error("Admin test store is not ready.");
    }
    if (typeof window.VisionTestStore.ready === "function") {
      await window.VisionTestStore.ready();
    }
    return window.VisionTestStore;
  }

  window.VisionTestApi = {
    getBackendBaseUrl: function () {
      return clean((window.VisionFirebaseConfig || {}).backendBaseUrl || "");
    },
    supportsRewriteRequests: function () {
      return true;
    },
    getStudentSessionToken: getStudentSessionToken,
    setStudentSessionToken: setStudentSessionToken,
    isNetworkError: isNetworkError,
    isPermissionError: isPermissionError,
    registerStudent: registerStudent,
    approveStudent: async function (payload) {
      var store = await requireAdminStore();
      return store.approveStudent(payload || {});
    },
    deleteStudent: async function (payload) {
      var store = await requireAdminStore();
      var safe = payload && typeof payload === "object" ? payload : {};
      return store.deleteStudent(clean(safe.studentId));
    },
    bulkApproveStudents: async function (rows) {
      var store = await requireAdminStore();
      return store.bulkApproveStudents(rows);
    },
    resetStudentPassword: async function (payload) {
      var store = await requireAdminStore();
      var safe = payload && typeof payload === "object" ? payload : {};
      return store.resetStudentPassword(clean(safe.studentId), clean(safe.password));
    },
    studentLogin: studentLogin,
    logoutStudent: logoutStudent,
    getStudentSession: getStudentSession,
    getActiveTest: getActiveTest,
    startAttempt: startAttempt,
    submitAttempt: submitAttempt,
    requestRewrite: async function (payload) {
      var activePayload = await getActiveTest();
      if (!activePayload.test) {
        throw createError("No active test is available right now.", "NO_ACTIVE_TEST");
      }

      var safe = payload && typeof payload === "object" ? payload : {};
      var requestedTestId = clean(safe.testId || activePayload.test.id);
      if (requestedTestId !== clean(activePayload.test.id)) {
        throw createError("Retest request could not be matched to the active test.", "TEST_MISMATCH");
      }

      try {
        return await callStudentFunction("test-student-rewrite", {
          method: "POST",
          body: {
            testId: requestedTestId
          },
          fallbackMessage: "Unable to submit rewrite request right now."
        });
      } catch (backendError) {
        if (!shouldFallbackToDirectRewrite(backendError)) {
          throw backendError;
        }
      }

      try {
        return await requestRewriteDirect({ testId: requestedTestId }, activePayload);
      } catch (error) {
        if (isPermissionError(error)) {
          throw createError("Retake requests are blocked by Firestore permissions. Deploy the Netlify function or publish the latest Firestore rules to allow this action.", "REWRITE_PERMISSION_BLOCKED", error);
        }
        throw error;
      }
    },
    getRewriteRequests: async function () {
      var store = await requireAdminStore();
      return store.getRewriteRequests();
    },
    approveRewrite: async function (payload) {
      var safe = payload && typeof payload === "object" ? payload : {};
      var requestId = clean(safe.requestId);
      try {
        return await callAdminFunction("test-admin-rewrite", {
          method: "POST",
          body: {
            action: "approve",
            requestId: requestId
          },
          fallbackMessage: "Unable to approve rewrite request right now."
        });
      } catch (backendError) {
        if (!shouldFallbackToDirectRewrite(backendError)) {
          throw backendError;
        }
      }
      try {
        var store = await requireAdminStore();
        return store.approveRewrite(requestId);
      } catch (error) {
        if (isPermissionError(error)) {
          throw createError("Rewrite approvals are blocked by Firestore permissions. Deploy the latest Netlify admin backend or publish admin-capable Firestore rules.", "REWRITE_ADMIN_PERMISSION_BLOCKED", error);
        }
        throw error;
      }
    },
    rejectRewrite: async function (payload) {
      var safe = payload && typeof payload === "object" ? payload : {};
      var requestId = clean(safe.requestId);
      try {
        return await callAdminFunction("test-admin-rewrite", {
          method: "POST",
          body: {
            action: "reject",
            requestId: requestId
          },
          fallbackMessage: "Unable to reject rewrite request right now."
        });
      } catch (backendError) {
        if (!shouldFallbackToDirectRewrite(backendError)) {
          throw backendError;
        }
      }
      try {
        var store = await requireAdminStore();
        return store.rejectRewrite(requestId);
      } catch (error) {
        if (isPermissionError(error)) {
          throw createError("Rewrite approvals are blocked by Firestore permissions. Deploy the latest Netlify admin backend or publish admin-capable Firestore rules.", "REWRITE_ADMIN_PERMISSION_BLOCKED", error);
        }
        throw error;
      }
    }
  };

  ensureStudentFirebase().catch(function () {
    // Auth warm-up is best effort so page boot does not depend on it.
  });
})();
