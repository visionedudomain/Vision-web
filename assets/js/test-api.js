(function () {
  "use strict";

  var SESSION_KEY = "vision_test_student_session_v2";
  var FIREBASE_VERSION = "12.7.0";
  var STUDENT_APP_NAME = "vision-test-student-app";
  var REGISTRATIONS_COLLECTION = "test_registrations";
  var STUDENTS_COLLECTION = "students";
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
    return code === "network_error" || code === "auth/network-request-failed" || code === "unavailable" || /network|offline|unavailable/.test(message);
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
      status: clean(data.status) || "started",
      totalQuestions: Number(data.totalQuestions || 0)
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

  async function getActivePublicTestSnapshot() {
    await ensureStudentFirebase();
    var snapshot = await studentState.api.getDocs(studentState.api.query(
      studentState.api.collection(studentState.db, PUBLIC_TESTS_COLLECTION),
      studentState.api.where("isActive", "==", true),
      studentState.api.limit(1)
    ));
    return snapshot.empty ? null : snapshot.docs[0];
  }

  async function getStudentSnapshotByUid(uid) {
    await ensureStudentFirebase();
    return studentState.api.getDoc(studentState.api.doc(studentState.db, STUDENTS_COLLECTION, clean(uid)));
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

  async function getAnswerSummary(testId, answers, submittedAt, fallbackTotalQuestions) {
    await ensureStudentFirebase();
    var answerKeySnapshot = await studentState.api.getDoc(studentState.api.doc(studentState.db, ANSWER_KEYS_COLLECTION, clean(testId)));
    var answerQuestions = answerKeySnapshot.exists() ? (answerKeySnapshot.data().questions || []) : [];
    var result = scoreAnswers(answerQuestions, answers);
    return {
      score: result.score,
      correctCount: result.correctCount,
      answeredCount: result.answeredCount,
      totalQuestions: result.totalQuestions || Number(fallbackTotalQuestions || 0),
      submittedAt: clean(submittedAt)
    };
  }

  async function finalizeExpiredAttempt(attemptRef, attemptData) {
    var submittedAt = clean(attemptData.submittedAt) || new Date().toISOString();
    await studentState.api.setDoc(attemptRef, {
      status: "auto_submitted",
      submittedAt: submittedAt,
      submittedAtMs: Date.now(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return getAnswerSummary(attemptData.testId, attemptData.answers || {}, submittedAt, attemptData.totalQuestions);
  }

  async function studentLogin(loginName, password) {
    await ensureStudentFirebase();
    var loginNameNormalized = normalizeLoginName(loginName);
    var safePassword = clean(password);
    if (!loginNameNormalized || !safePassword) {
      throw createError("Login failed. Check the login name and password.", "LOGIN_INVALID");
    }

    try {
      await studentState.api.signInWithEmailAndPassword(studentState.auth, pseudoStudentEmail(loginNameNormalized), safePassword);
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
    var safe = payload && typeof payload === "object" ? payload : {};
    var displayName = clean(safe.displayName);
    var loginName = clean(safe.loginName);
    var loginNameNormalized = normalizeLoginName(loginName);
    var mobile = clean(safe.mobile);
    var language = normalizeLanguage(safe.language);
    var batchName = clean(safe.batchName);
    var examName = clean(safe.examName);

    if (!displayName || !loginNameNormalized || !mobile) {
      throw createError("Name, login name, and mobile number are required.", "REGISTRATION_INVALID");
    }

    try {
      await studentState.api.setDoc(studentState.api.doc(studentState.db, REGISTRATIONS_COLLECTION, loginNameNormalized), {
        displayName: displayName,
        loginName: loginName,
        loginNameNormalized: loginNameNormalized,
        mobile: mobile,
        language: language,
        batchName: batchName,
        examName: examName,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
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
    var sessionPayload = await getStudentSession();
    var activeTestSnapshot = await getActivePublicTestSnapshot();
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
    var attemptSnapshot = await studentState.api.getDoc(attemptRef);

    if (attemptSnapshot.exists()) {
      var attempt = mapAttemptDocument(attemptSnapshot);
      if (attempt.status !== "started") {
        return {
          ok: true,
          state: "submitted",
          student: sessionPayload.student,
          test: publicTest,
          summary: await getAnswerSummary(publicTest.id, attempt.answers || {}, attempt.submittedAt, attempt.totalQuestions),
          message: "Your test has already been submitted."
        };
      }

      if (new Date(attempt.expiresAt).getTime() <= now) {
        return {
          ok: true,
          state: "submitted",
          student: sessionPayload.student,
          test: publicTest,
          summary: await finalizeExpiredAttempt(attemptRef, attempt),
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
      return {
        ok: true,
        summary: await getAnswerSummary(publicTest.id, attempt.answers || {}, attempt.submittedAt, attempt.totalQuestions)
      };
    }

    var safePayload = payload && typeof payload === "object" ? payload : {};
    var answers = sanitizeAnswers(publicTest.questions, safePayload.answers);
    var submittedAt = new Date().toISOString();
    var timedOut = new Date(attempt.expiresAt).getTime() <= Date.now();
    var finalStatus = safePayload.autoSubmit || timedOut ? "auto_submitted" : "submitted";

    try {
      await studentState.api.setDoc(attemptRef, {
        answers: answers,
        submittedAt: submittedAt,
        submittedAtMs: new Date(submittedAt).getTime(),
        status: finalStatus,
        updatedAt: submittedAt
      }, { merge: true });
    } catch (error) {
      throw createError("Unable to submit the test right now.", clean(error && error.code) || "SUBMIT_FAILED", error);
    }

    return {
      ok: true,
      summary: await getAnswerSummary(publicTest.id, answers, submittedAt, publicTest.questionCount)
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
    getStudentSessionToken: getStudentSessionToken,
    setStudentSessionToken: setStudentSessionToken,
    isNetworkError: isNetworkError,
    registerStudent: registerStudent,
    approveStudent: async function (payload) {
      var store = await requireAdminStore();
      return store.approveStudent(payload || {});
    },
    bulkApproveStudents: async function (rows) {
      var store = await requireAdminStore();
      return store.bulkApproveStudents(rows);
    },
    resetStudentPassword: function () {
      throw new Error("Password reset is not available in Firebase-only mode.");
    },
    studentLogin: studentLogin,
    logoutStudent: logoutStudent,
    getStudentSession: getStudentSession,
    getActiveTest: getActiveTest,
    startAttempt: startAttempt,
    submitAttempt: submitAttempt
  };

  ensureStudentFirebase().catch(function () {
    // Auth warm-up is best effort so page boot does not depend on it.
  });
})();
