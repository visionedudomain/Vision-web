(function () {
  "use strict";

  var FIREBASE_VERSION = "12.7.0";
  var REGISTRATIONS_COLLECTION = "test_registrations";
  var STUDENTS_COLLECTION = "students";
  var TESTS_COLLECTION = "tests";
  var ATTEMPTS_COLLECTION = "attempts";
  var REWRITE_REQUESTS_COLLECTION = "rewrite_requests";
  var LOGIN_INDEX_COLLECTION = "student_login_index";
  var PUBLIC_TESTS_COLLECTION = "published_tests";
  var ANSWER_KEYS_COLLECTION = "test_answer_keys";
  var DEFAULT_STUDENT_FEE = 800;

  var state = {
    configured: false,
    api: null,
    app: null,
    auth: null,
    db: null,
    currentUser: null,
    unsubscribeAuth: null,
    unsubscribeRegistrations: null,
    unsubscribeStudents: null,
    unsubscribeTests: null,
    unsubscribeAttempts: null
  };

  var currentRegistrations = [];
  var currentStudents = [];
  var currentTests = [];
  var currentAttempts = [];

  var listeners = {
    registrations: new Set(),
    students: new Set(),
    tests: new Set(),
    attempts: new Set()
  };

  var readyPromise = initialize();

  function clean(value) {
    return String(value || "").trim();
  }

  function cleanQuestionText(value) {
    var text = clean(value);
    return window.VisionTestText && typeof window.VisionTestText.normalizeTamilText === "function"
      ? window.VisionTestText.normalizeTamilText(text)
      : text;
  }

  function normalizeAdminEmail(value) {
    return clean(value).toLowerCase();
  }

  function normalizeLanguage(value) {
    return clean(value).toLowerCase() === "ta" || clean(value).toLowerCase() === "tamil" ? "ta" : "en";
  }

  function normalizeStatus(value, fallback) {
    var normalized = clean(value).toLowerCase();
    return normalized || clean(fallback).toLowerCase();
  }

  function normalizeAmount(value) {
    var amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      return 0;
    }
    return Math.round(amount * 100) / 100;
  }

  function deriveFeeStatus(totalAmount, paidAmount) {
    var total = normalizeAmount(totalAmount);
    var paid = normalizeAmount(paidAmount);
    if (total > 0 && paid >= total) {
      return "paid";
    }
    return "unpaid";
  }

  function mapStoredFeeDetails(value) {
    var safe = value && typeof value === "object" ? value : {};
    var totalAmount = DEFAULT_STUDENT_FEE;
    var rawStatus = normalizeStatus(safe.status, deriveFeeStatus(totalAmount, safe.paidAmount));
    var status = rawStatus === "paid" ? "paid" : "unpaid";
    var paidAmount = status === "paid" ? totalAmount : 0;
    var dueAmount = Math.max(totalAmount - paidAmount, 0);
    return {
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      status: status,
      lastPaidAt: status === "paid" ? (safe.lastPaidAt || "") : "",
      notes: clean(safe.notes),
      updatedAt: safe.updatedAt || ""
    };
  }

  function buildFeeDetailsPayload(value) {
    var safe = value && typeof value === "object" ? value : {};
    var totalAmount = DEFAULT_STUDENT_FEE;
    var requestedStatus = normalizeStatus(safe.status, deriveFeeStatus(totalAmount, safe.paidAmount));
    var status = requestedStatus === "paid" ? "paid" : "unpaid";
    var paidAmount = status === "paid" ? totalAmount : 0;
    var dueAmount = Math.max(totalAmount - paidAmount, 0);
    var lastPaidAt = clean(safe.lastPaidAt);
    if (status !== "paid") {
      lastPaidAt = "";
    } else if (!lastPaidAt) {
      lastPaidAt = new Date().toISOString().slice(0, 10);
    }
    return {
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      status: status,
      lastPaidAt: lastPaidAt,
      notes: clean(safe.notes),
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeLoginName(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hasRequiredFirebaseConfig(config) {
    return ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"].every(function (key) {
      return clean(config && config[key]);
    });
  }

  function getFirebaseModuleUrl(fileName) {
    return "https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/" + fileName;
  }

  async function loadFirebaseApi() {
    if (state.api) {
      return state.api;
    }

    var modules = await Promise.all([
      import(getFirebaseModuleUrl("firebase-app.js")),
      import(getFirebaseModuleUrl("firebase-auth.js")),
      import(getFirebaseModuleUrl("firebase-firestore.js"))
    ]);

    state.api = {
      initializeApp: modules[0].initializeApp,
      getApp: modules[0].getApp,
      getApps: modules[0].getApps,
      getAuth: modules[1].getAuth,
      onAuthStateChanged: modules[1].onAuthStateChanged,
      getFirestore: modules[2].getFirestore,
      collection: modules[2].collection,
      query: modules[2].query,
      orderBy: modules[2].orderBy,
      onSnapshot: modules[2].onSnapshot,
      setDoc: modules[2].setDoc,
      doc: modules[2].doc,
      addDoc: modules[2].addDoc,
      deleteDoc: modules[2].deleteDoc,
      getDoc: modules[2].getDoc,
      getDocs: modules[2].getDocs,
      where: modules[2].where,
      limit: modules[2].limit,
      writeBatch: modules[2].writeBatch
    };

    return state.api;
  }

  function isAdminUser(user) {
    var adminEmail = normalizeAdminEmail((window.VisionFirebaseConfig || {}).adminEmail || "");
    return Boolean(user && normalizeAdminEmail(user.email) && normalizeAdminEmail(user.email) === adminEmail);
  }

  function toDateValue(value) {
    if (!value) {
      return null;
    }
    if (typeof value.toDate === "function") {
      return value.toDate();
    }
    if (typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
    if (value instanceof Date) {
      return new Date(value.getTime());
    }
    if (typeof value === "string") {
      var parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  function formatDateTime(value) {
    var date = toDateValue(value);
    if (!date) {
      return "-";
    }
    var locale = window.VisionI18n && window.VisionI18n.getLanguage && window.VisionI18n.getLanguage() === "ta" ? "ta-IN" : "en-IN";
    return date.toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function toTimeMillis(value) {
    var date = toDateValue(value);
    return date ? date.getTime() : 0;
  }

  function subscribeTo(name, getter, callback) {
    listeners[name].add(callback);
    callback(getter());
    return function () {
      listeners[name].delete(callback);
    };
  }

  function emit(name, payload) {
    listeners[name].forEach(function (callback) {
      try {
        callback(payload);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function getRegistrations() {
    return deepCopy(currentRegistrations);
  }

  function getStudents() {
    return deepCopy(currentStudents);
  }

  function getTests() {
    return deepCopy(currentTests);
  }

  function getAttempts() {
    return deepCopy(currentAttempts.map(enrichAttempt));
  }

  function mapRegistrationDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      displayName: clean(data.displayName),
      loginName: clean(data.loginName),
      loginNameNormalized: clean(data.loginNameNormalized),
      authUid: clean(data.authUid),
      authEmail: clean(data.authEmail),
      mobile: clean(data.mobile),
      language: normalizeLanguage(data.language),
      batchName: clean(data.batchName),
      examName: clean(data.examName),
      status: normalizeStatus(data.status, "pending"),
      studentId: clean(data.studentId),
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || "",
      approvedAt: data.approvedAt || ""
    };
  }

  function mapStudentDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      authUid: clean(data.authUid || snapshot.id),
      registrationId: clean(data.registrationId || snapshot.id),
      displayName: clean(data.displayName),
      loginName: clean(data.loginName),
      loginNameNormalized: clean(data.loginNameNormalized),
      authEmail: clean(data.authEmail),
      mobile: clean(data.mobile),
      language: normalizeLanguage(data.language),
      batchName: clean(data.batchName),
      examName: clean(data.examName),
      status: normalizeStatus(data.status, "approved"),
      updatedAt: data.updatedAt || "",
      passwordUpdatedAt: data.passwordUpdatedAt || "",
      approvedAt: data.approvedAt || "",
      fee: mapStoredFeeDetails(data.fee)
    };
  }

  function mapQuestion(question, index) {
    var raw = question && typeof question === "object" ? question : {};
    var correctOptionId = clean(raw.correctOptionId).toLowerCase();
    return {
      id: clean(raw.id) || ("question_" + String(index + 1)),
      prompt: cleanQuestionText(raw.prompt),
      options: (Array.isArray(raw.options) ? raw.options : []).map(function (option, optionIndex) {
        var optionRaw = option && typeof option === "object" ? option : {};
        return {
          id: clean(optionRaw.id) || String.fromCharCode(97 + optionIndex),
          text: cleanQuestionText(optionRaw.text)
        };
      }).filter(function (option) {
        return option.text;
      }),
      correctOptionId: /^[a-d]$/.test(correctOptionId) ? correctOptionId : ""
    };
  }

  function buildPublicQuestion(question) {
    var safe = question && typeof question === "object" ? question : {};
    return {
      id: clean(safe.id),
      prompt: cleanQuestionText(safe.prompt),
      options: (Array.isArray(safe.options) ? safe.options : []).map(function (option) {
        var optionSafe = option && typeof option === "object" ? option : {};
        return {
          id: clean(optionSafe.id),
          text: cleanQuestionText(optionSafe.text)
        };
      }).filter(function (option) {
        return option.id && option.text;
      })
    };
  }

  function buildAnswerKeyQuestions(questions) {
    return (Array.isArray(questions) ? questions : []).map(function (question) {
      return {
        id: clean(question && question.id),
        correctOptionId: clean(question && question.correctOptionId).toLowerCase()
      };
    }).filter(function (question) {
      return question.id && /^[a-d]$/.test(question.correctOptionId);
    });
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

  function pseudoStudentEmail(loginNameNormalized) {
    return clean(loginNameNormalized) + "@students.visionacademy.local";
  }

  function buildStudentAuthEmail(loginNameNormalized) {
    return clean(loginNameNormalized) + "__" + Date.now() + Math.random().toString(36).slice(2, 8) + "@students.visionacademy.local";
  }

  function generateTempPassword() {
    return "Vision" + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.random().toString(10).slice(2, 6);
  }

  function createErrorFromPayload(payload, fallback) {
    var body = payload && typeof payload === "object" ? payload : {};
    return new Error(clean(body.error && body.error.message) || clean(body.message) || clean(body.error) || fallback || "Request failed.");
  }

  async function requestIdentityToolkit(endpoint, body) {
    var apiKey = clean((window.VisionFirebaseConfig || {}).apiKey);
    if (!apiKey) {
      throw new Error("Firebase apiKey is missing in assets/js/firebase-config.js.");
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
      if (clean(payload && payload.error && payload.error.message) === "EMAIL_EXISTS") {
        throw new Error("This login name is already approved for a student.");
      }
      throw createErrorFromPayload(payload, "Unable to create student login right now.");
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
      throw new Error("Unable to create the student login account.");
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

  function buildLoginIndexPayload(authEmail, updatedAt) {
    return {
      authEmail: clean(authEmail),
      updatedAt: clean(updatedAt) || new Date().toISOString()
    };
  }

  async function findExistingStudentByLoginName(loginNameNormalized) {
    var snapshot = await state.api.getDocs(state.api.query(
      state.api.collection(state.db, STUDENTS_COLLECTION),
      state.api.where("loginNameNormalized", "==", clean(loginNameNormalized)),
      state.api.limit(1)
    ));
    return snapshot.empty ? null : snapshot.docs[0];
  }

  function enrichAttempt(attempt) {
    var safe = attempt && typeof attempt === "object" ? attempt : {};
    var test = currentTests.find(function (item) {
      return item.id === clean(safe.testId);
    });
    var result = scoreAnswers(test && Array.isArray(test.questions) ? test.questions : [], safe.answers || {});
    return Object.assign({}, safe, {
      score: result.score,
      correctCount: result.correctCount,
      answeredCount: result.answeredCount,
      totalQuestions: result.totalQuestions || Number(safe.totalQuestions || 0)
    });
  }

  function mapTestDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      title: clean(data.title),
      language: normalizeLanguage(data.language),
      opensAt: clean(data.opensAt),
      closesAt: clean(data.closesAt),
      durationMinutes: Number(data.durationMinutes || 0),
      status: normalizeStatus(data.status, "draft"),
      isActive: Boolean(data.isActive),
      questionCount: Number(data.questionCount || (Array.isArray(data.questions) ? data.questions.length : 0)),
      questions: (Array.isArray(data.questions) ? data.questions : []).map(mapQuestion).filter(function (question) {
        return question.prompt;
      }),
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || ""
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
      startedAt: data.startedAt || "",
      expiresAt: data.expiresAt || "",
      submittedAt: data.submittedAt || "",
      answers: data.answers && typeof data.answers === "object" ? deepCopy(data.answers) : {},
      score: Number(data.score || 0),
      correctCount: Number(data.correctCount || 0),
      answeredCount: Number(data.answeredCount || 0),
      totalQuestions: Number(data.totalQuestions || 0),
      status: normalizeStatus(data.status, "started"),
      rewriteRequestStatus: normalizeStatus(data.rewriteRequestStatus, ""),
      rewriteRequestedAt: data.rewriteRequestedAt || "",
      rewriteRequestedAtMs: Number(data.rewriteRequestedAtMs || 0),
      rewriteReviewedAt: data.rewriteReviewedAt || "",
      rewriteReviewedAtMs: Number(data.rewriteReviewedAtMs || 0),
      rewriteReviewedBy: clean(data.rewriteReviewedBy)
    };
  }

  function mapRewriteRequestDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      studentId: clean(data.studentId),
      studentDisplayName: clean(data.studentDisplayName),
      studentLoginName: clean(data.studentLoginName),
      testId: clean(data.testId),
      testTitle: clean(data.testTitle),
      language: normalizeLanguage(data.language),
      attemptId: clean(data.attemptId),
      score: Number(data.score || 0),
      totalQuestions: Number(data.totalQuestions || 0),
      status: normalizeStatus(data.status || data.rewriteRequestStatus, ""),
      requestedAt: data.requestedAt || data.rewriteRequestedAt || "",
      requestedAtMs: Number(data.requestedAtMs || data.rewriteRequestedAtMs || 0),
      reviewedAt: data.reviewedAt || data.rewriteReviewedAt || "",
      reviewedAtMs: Number(data.reviewedAtMs || data.rewriteReviewedAtMs || 0),
      reviewedBy: clean(data.reviewedBy || data.rewriteReviewedBy),
      updatedAt: data.updatedAt || ""
    };
  }

  function sortRegistrations(items) {
    return items.slice().sort(function (left, right) {
      var leftTime = toTimeMillis(left.updatedAt || left.createdAt || left.approvedAt);
      var rightTime = toTimeMillis(right.updatedAt || right.createdAt || right.approvedAt);
      return rightTime - leftTime;
    });
  }

  function stopSubscriptions() {
    if (state.unsubscribeRegistrations) {
      state.unsubscribeRegistrations();
      state.unsubscribeRegistrations = null;
    }
    if (state.unsubscribeStudents) {
      state.unsubscribeStudents();
      state.unsubscribeStudents = null;
    }
    if (state.unsubscribeTests) {
      state.unsubscribeTests();
      state.unsubscribeTests = null;
    }
    if (state.unsubscribeAttempts) {
      state.unsubscribeAttempts();
      state.unsubscribeAttempts = null;
    }
    currentRegistrations = [];
    currentStudents = [];
    currentTests = [];
    currentAttempts = [];
    emit("registrations", getRegistrations());
    emit("students", getStudents());
    emit("tests", getTests());
    emit("attempts", getAttempts());
  }

  function startSubscriptions() {
    if (!state.configured || !isAdminUser(state.currentUser)) {
      stopSubscriptions();
      return;
    }
    if (!state.unsubscribeRegistrations) {
      state.unsubscribeRegistrations = state.api.onSnapshot(
        state.api.collection(state.db, REGISTRATIONS_COLLECTION),
        function (snapshot) {
          currentRegistrations = sortRegistrations(snapshot.docs.map(mapRegistrationDocument));
          emit("registrations", getRegistrations());
        },
        function (error) {
          console.error("Registrations subscription error", error);
        }
      );
    }
    if (!state.unsubscribeStudents) {
      state.unsubscribeStudents = state.api.onSnapshot(
        state.api.query(state.api.collection(state.db, STUDENTS_COLLECTION), state.api.orderBy("displayName", "asc")),
        function (snapshot) {
          currentStudents = snapshot.docs.map(mapStudentDocument);
          emit("students", getStudents());
        },
        function (error) {
          console.error("Students subscription error", error);
        }
      );
    }
    if (!state.unsubscribeTests) {
      state.unsubscribeTests = state.api.onSnapshot(
        state.api.query(state.api.collection(state.db, TESTS_COLLECTION), state.api.orderBy("createdAt", "desc")),
        function (snapshot) {
          currentTests = snapshot.docs.map(mapTestDocument);
          emit("tests", getTests());
          emit("attempts", getAttempts());
        },
        function (error) {
          console.error("Tests subscription error", error);
        }
      );
    }
    if (!state.unsubscribeAttempts) {
      state.unsubscribeAttempts = state.api.onSnapshot(
        state.api.query(state.api.collection(state.db, ATTEMPTS_COLLECTION), state.api.orderBy("startedAt", "desc")),
        function (snapshot) {
          currentAttempts = snapshot.docs.map(mapAttemptDocument);
          emit("attempts", getAttempts());
        },
        function (error) {
          console.error("Attempts subscription error", error);
        }
      );
    }
  }

  async function initialize() {
    var config = window.VisionFirebaseConfig || {};
    if (!hasRequiredFirebaseConfig(config)) {
      return;
    }

    state.api = await loadFirebaseApi();
    try {
      state.app = state.api.getApp();
    } catch (error) {
      state.app = state.api.initializeApp(config);
    }
    state.auth = state.api.getAuth(state.app);
    state.db = state.api.getFirestore(state.app);
    state.configured = true;

    await new Promise(function (resolve) {
      state.unsubscribeAuth = state.api.onAuthStateChanged(state.auth, function (user) {
        state.currentUser = isAdminUser(user) ? user : null;
        startSubscriptions();
        resolve();
      }, function (error) {
        console.error("Test store auth error", error);
        state.currentUser = null;
        stopSubscriptions();
        resolve();
      });
    });
  }

  function assertConfigured() {
    if (!state.configured) {
      throw new Error("Firebase test store is not configured.");
    }
  }

  function assertAdminSession() {
    if (!isAdminUser(state.currentUser)) {
      throw new Error("Admin login is required.");
    }
  }

  function sanitizeTestInput(test) {
    var safe = test && typeof test === "object" ? test : {};
    var questions = (Array.isArray(safe.questions) ? safe.questions : []).map(mapQuestion).filter(function (question) {
      return question.prompt;
    });
    return {
      id: clean(safe.id),
      title: clean(safe.title),
      language: normalizeLanguage(safe.language),
      opensAt: clean(safe.opensAt),
      closesAt: clean(safe.closesAt),
      durationMinutes: Math.max(1, Number(safe.durationMinutes || 0)),
      status: clean(safe.status) || "draft",
      isActive: Boolean(safe.isActive),
      questions: questions
    };
  }

  async function saveTest(test) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var safe = sanitizeTestInput(test);
    if (!safe.title || !safe.opensAt || !safe.closesAt || !safe.questions.length) {
      throw new Error("Test title, time window, and at least one question are required.");
    }
    if (new Date(safe.opensAt).getTime() >= new Date(safe.closesAt).getTime()) {
      throw new Error("Close time must be after open time.");
    }
    safe.questions.forEach(function (question) {
      if (!question.options.length || !question.correctOptionId) {
        throw new Error("Each question needs answer options and a correct answer.");
      }
    });

    var payload = {
      title: safe.title,
      language: safe.language,
      opensAt: safe.opensAt,
      opensAtMs: toTimeMillis(safe.opensAt),
      closesAt: safe.closesAt,
      closesAtMs: toTimeMillis(safe.closesAt),
      durationMinutes: safe.durationMinutes,
      status: "draft",
      isActive: false,
      questions: safe.questions,
      questionCount: safe.questions.length,
      updatedAt: new Date().toISOString(),
      createdAt: safe.id ? undefined : new Date().toISOString(),
      createdByEmail: clean(state.currentUser && state.currentUser.email)
    };

    if (safe.id) {
      delete payload.createdAt;
      await state.api.setDoc(state.api.doc(state.db, TESTS_COLLECTION, safe.id), payload, { merge: true });
      await state.api.setDoc(state.api.doc(state.db, ANSWER_KEYS_COLLECTION, safe.id), {
        testId: safe.id,
        title: safe.title,
        updatedAt: new Date().toISOString(),
        questions: buildAnswerKeyQuestions(safe.questions)
      }, { merge: true });
      return safe.id;
    }

    var created = await state.api.addDoc(state.api.collection(state.db, TESTS_COLLECTION), payload);
    await state.api.setDoc(state.api.doc(state.db, ANSWER_KEYS_COLLECTION, created.id), {
      testId: created.id,
      title: safe.title,
      updatedAt: new Date().toISOString(),
      questions: buildAnswerKeyQuestions(safe.questions)
    }, { merge: true });
    return created.id;
  }

  async function publishTest(id) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(id);
    var targetSnapshot = await state.api.getDoc(state.api.doc(state.db, TESTS_COLLECTION, targetId));
    if (!targetSnapshot.exists()) {
      throw new Error("Test draft not found.");
    }
    var targetData = mapTestDocument(targetSnapshot);
    var snapshot = await state.api.getDocs(state.api.query(state.api.collection(state.db, TESTS_COLLECTION), state.api.where("isActive", "==", true)));
    var publicSnapshot = await state.api.getDocs(state.api.query(state.api.collection(state.db, PUBLIC_TESTS_COLLECTION), state.api.where("isActive", "==", true)));
    var batch = state.api.writeBatch(state.db);
    snapshot.docs.forEach(function (docSnapshot) {
      if (normalizeLanguage((docSnapshot.data() || {}).language) === targetData.language) {
        batch.set(state.api.doc(state.db, TESTS_COLLECTION, docSnapshot.id), {
          isActive: false,
          status: "closed",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    });
    publicSnapshot.docs.forEach(function (docSnapshot) {
      if (normalizeLanguage((docSnapshot.data() || {}).language) === targetData.language) {
        batch.set(state.api.doc(state.db, PUBLIC_TESTS_COLLECTION, docSnapshot.id), {
          isActive: false,
          status: "closed",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    });
    batch.set(state.api.doc(state.db, TESTS_COLLECTION, targetId), {
      isActive: true,
      status: "published",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    batch.set(state.api.doc(state.db, PUBLIC_TESTS_COLLECTION, targetId), {
      id: targetId,
      title: targetData.title,
      language: targetData.language,
      opensAt: targetData.opensAt,
      opensAtMs: toTimeMillis(targetData.opensAt),
      closesAt: targetData.closesAt,
      closesAtMs: toTimeMillis(targetData.closesAt),
      durationMinutes: targetData.durationMinutes,
      status: "published",
      isActive: true,
      questionCount: targetData.questionCount,
      questions: targetData.questions.map(buildPublicQuestion),
      updatedAt: new Date().toISOString(),
      createdAt: targetData.createdAt || new Date().toISOString()
    }, { merge: true });
    batch.set(state.api.doc(state.db, ANSWER_KEYS_COLLECTION, targetId), {
      testId: targetId,
      title: targetData.title,
      updatedAt: new Date().toISOString(),
      questions: buildAnswerKeyQuestions(targetData.questions)
    }, { merge: true });
    await batch.commit();
  }

  async function closeTest(id) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(id);
    var batch = state.api.writeBatch(state.db);
    batch.set(state.api.doc(state.db, TESTS_COLLECTION, targetId), {
      isActive: false,
      status: "closed",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    batch.set(state.api.doc(state.db, PUBLIC_TESTS_COLLECTION, targetId), {
      isActive: false,
      status: "closed",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    await batch.commit();
  }

  async function deleteTest(id) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(id);
    var batch = state.api.writeBatch(state.db);
    batch.delete(state.api.doc(state.db, TESTS_COLLECTION, targetId));
    batch.delete(state.api.doc(state.db, PUBLIC_TESTS_COLLECTION, targetId));
    batch.delete(state.api.doc(state.db, ANSWER_KEYS_COLLECTION, targetId));
    await batch.commit();
  }

  async function updateStudentStatus(id, status) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    await state.api.setDoc(state.api.doc(state.db, STUDENTS_COLLECTION, clean(id)), {
      status: clean(status) === "inactive" ? "inactive" : "approved",
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async function saveStudentFee(payload) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var safe = payload && typeof payload === "object" ? payload : {};
    var studentId = clean(safe.studentId);
    if (!studentId) {
      throw new Error("Choose a student first.");
    }
    var fee = buildFeeDetailsPayload(safe);
    var updatedAt = new Date().toISOString();
    await state.api.setDoc(state.api.doc(state.db, STUDENTS_COLLECTION, studentId), {
      fee: fee,
      updatedAt: updatedAt
    }, { merge: true });
    return {
      ok: true,
      studentId: studentId,
      fee: fee
    };
  }

  async function resetStudentPassword(studentId, nextPassword) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(studentId);
    var password = clean(nextPassword);
    if (!targetId) {
      throw new Error("Student record not found.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    var studentRef = state.api.doc(state.db, STUDENTS_COLLECTION, targetId);
    var studentSnapshot = await state.api.getDoc(studentRef);
    if (!studentSnapshot.exists()) {
      throw new Error("Student record not found.");
    }

    var student = mapStudentDocument(studentSnapshot);
    if (!student.loginNameNormalized) {
      throw new Error("Student login name is invalid.");
    }

    var provisionedAccount = await provisionStudentAuthAccount(student.loginNameNormalized, password);
    var now = new Date().toISOString();

    try {
      var resetBatch = state.api.writeBatch(state.db);
      resetBatch.set(studentRef, {
        authUid: provisionedAccount.authUid,
        authEmail: provisionedAccount.authEmail,
        passwordUpdatedAt: now,
        updatedAt: now
      }, { merge: true });
      resetBatch.set(state.api.doc(state.db, LOGIN_INDEX_COLLECTION, student.loginNameNormalized), buildLoginIndexPayload(provisionedAccount.authEmail, now), { merge: true });
      if (student.registrationId) {
        resetBatch.set(state.api.doc(state.db, REGISTRATIONS_COLLECTION, student.registrationId), {
          authUid: provisionedAccount.authUid,
          authEmail: provisionedAccount.authEmail,
          updatedAt: now
        }, { merge: true });
      }
      await resetBatch.commit();
    } catch (error) {
      await deleteStudentAuthAccount(provisionedAccount.cleanupToken);
      throw error;
    }

    return {
      ok: true,
      studentId: targetId,
      passwordUpdatedAt: now
    };
  }

  async function deleteStudent(studentId) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(studentId);
    if (!targetId) {
      throw new Error("Student record not found.");
    }

    var studentRef = state.api.doc(state.db, STUDENTS_COLLECTION, targetId);
    var studentSnapshot = await state.api.getDoc(studentRef);
    if (!studentSnapshot.exists()) {
      throw new Error("Student record not found.");
    }

    var student = mapStudentDocument(studentSnapshot);
    var registrationRef = student.registrationId ? state.api.doc(state.db, REGISTRATIONS_COLLECTION, student.registrationId) : null;
    var now = new Date().toISOString();

    var deleteBatch = state.api.writeBatch(state.db);
    deleteBatch.delete(studentRef);

    if (registrationRef) {
      deleteBatch.delete(registrationRef);
    }

    if (student.loginNameNormalized) {
      deleteBatch.delete(state.api.doc(state.db, LOGIN_INDEX_COLLECTION, student.loginNameNormalized));
    }

    await deleteBatch.commit();

    while (true) {
      var attemptsSnapshot = await state.api.getDocs(state.api.query(
        state.api.collection(state.db, ATTEMPTS_COLLECTION),
        state.api.where("studentId", "==", targetId),
        state.api.limit(200)
      ));

      if (attemptsSnapshot.empty) {
        break;
      }

      var attemptsBatch = state.api.writeBatch(state.db);
      attemptsSnapshot.docs.forEach(function (docSnapshot) {
        attemptsBatch.delete(docSnapshot.ref);
      });
      await attemptsBatch.commit();

      if (attemptsSnapshot.docs.length < 200) {
        break;
      }
    }

    return {
      ok: true,
      studentId: targetId,
      deletedAt: now
    };
  }

  async function clearAttempts() {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var deletedCount = 0;

    while (true) {
      var attemptsSnapshot = await state.api.getDocs(state.api.query(
        state.api.collection(state.db, ATTEMPTS_COLLECTION),
        state.api.limit(200)
      ));
      if (attemptsSnapshot.empty) {
        break;
      }

      var clearBatch = state.api.writeBatch(state.db);
      attemptsSnapshot.docs.forEach(function (docSnapshot) {
        clearBatch.delete(docSnapshot.ref);
      });
      await clearBatch.commit();
      deletedCount += attemptsSnapshot.docs.length;

      if (attemptsSnapshot.docs.length < 200) {
        break;
      }
    }

    return {
      ok: true,
      count: deletedCount
    };
  }

  async function approveStudent(payload) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var safe = payload && typeof payload === "object" ? payload : {};
    var registrationId = clean(safe.registrationId);
    if (!registrationId) {
      throw new Error("Choose a registration first.");
    }
    var registrationRef = state.api.doc(state.db, REGISTRATIONS_COLLECTION, registrationId);
    var registrationSnapshot = await state.api.getDoc(registrationRef);
    if (!registrationSnapshot.exists()) {
      throw new Error("Registration record not found.");
    }
    var registration = mapRegistrationDocument(registrationSnapshot);
    var loginName = clean(safe.loginName || registration.loginName);
    var loginNameNormalized = normalizeLoginName(loginName);
    if (!loginNameNormalized) {
      throw new Error("Student login name is invalid.");
    }
    var registrationStudentId = clean(registration.studentId);
    var existingStudentSnapshot = await findExistingStudentByLoginName(loginNameNormalized);
    if (existingStudentSnapshot && existingStudentSnapshot.id !== registrationStudentId) {
      var existingStudentData = existingStudentSnapshot.data() || {};
      if (clean(existingStudentData.authUid) || clean(existingStudentData.authEmail)) {
        throw new Error("This login name is already approved for a student.");
      }
    }

    var tempPassword = clean(safe.tempPassword);
    if (tempPassword && tempPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    var shouldReuseRegistrationAuth = !tempPassword && clean(registration.authUid) && clean(registration.authEmail);
    var provisionedAccount = null;
    if (shouldReuseRegistrationAuth) {
      provisionedAccount = {
        authUid: clean(registration.authUid),
        authEmail: clean(registration.authEmail),
        cleanupToken: ""
      };
    } else {
      if (!tempPassword) {
        tempPassword = generateTempPassword();
      }
      provisionedAccount = await provisionStudentAuthAccount(loginNameNormalized, tempPassword);
    }
    var studentId = clean(provisionedAccount.authUid);
    var authEmail = clean(provisionedAccount.authEmail);

    var now = new Date().toISOString();
    var studentStatus = clean(safe.status || "approved") === "inactive" ? "inactive" : "approved";
    var studentPayload = {
      authUid: studentId,
      registrationId: registration.id,
      displayName: clean(safe.displayName || registration.displayName),
      loginName: loginName,
      loginNameNormalized: loginNameNormalized,
      authEmail: authEmail,
      mobile: clean(safe.mobile || registration.mobile),
      language: normalizeLanguage(safe.language || registration.language),
      batchName: clean(safe.batchName || registration.batchName),
      examName: clean(safe.examName || registration.examName),
      status: studentStatus,
      approvedAt: now,
      passwordUpdatedAt: now,
      updatedAt: now
    };
    var registrationPayload = {
      displayName: clean(safe.displayName || registration.displayName),
      loginName: loginName,
      loginNameNormalized: loginNameNormalized,
      authUid: studentId,
      authEmail: authEmail,
      mobile: clean(safe.mobile || registration.mobile),
      language: normalizeLanguage(safe.language || registration.language),
      batchName: clean(safe.batchName || registration.batchName),
      examName: clean(safe.examName || registration.examName),
      status: "approved",
      approvedAt: now,
      updatedAt: now,
      studentId: studentId
    };

    try {
      var approvalBatch = state.api.writeBatch(state.db);
      approvalBatch.set(state.api.doc(state.db, STUDENTS_COLLECTION, studentId), studentPayload, { merge: true });
      approvalBatch.set(registrationRef, registrationPayload, { merge: true });
      approvalBatch.set(state.api.doc(state.db, LOGIN_INDEX_COLLECTION, loginNameNormalized), buildLoginIndexPayload(authEmail, now), { merge: true });
      if (registration.loginNameNormalized && registration.loginNameNormalized !== loginNameNormalized) {
        approvalBatch.delete(state.api.doc(state.db, LOGIN_INDEX_COLLECTION, registration.loginNameNormalized));
      }
      if (existingStudentSnapshot && existingStudentSnapshot.id !== studentId) {
        approvalBatch.delete(state.api.doc(state.db, STUDENTS_COLLECTION, existingStudentSnapshot.id));
      }
      await approvalBatch.commit();
    } catch (error) {
      if (provisionedAccount && provisionedAccount.cleanupToken) {
        await deleteStudentAuthAccount(provisionedAccount.cleanupToken);
      }
      throw error;
    }

    return {
      ok: true,
      studentId: studentId,
      loginName: loginName,
      tempPassword: shouldReuseRegistrationAuth ? "" : tempPassword
    };
  }

  async function bulkApproveStudents(rows) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var items = Array.isArray(rows) ? rows : [];
    var credentials = [];
    var approvedCount = 0;
    for (var index = 0; index < items.length; index += 1) {
      var row = items[index] && typeof items[index] === "object" ? items[index] : {};
      var loginName = clean(row.loginName);
      if (!loginName) {
        continue;
      }
      var normalized = normalizeLoginName(loginName);
      var registrationSnapshot = await state.api.getDoc(state.api.doc(state.db, REGISTRATIONS_COLLECTION, normalized));
      if (!registrationSnapshot.exists()) {
        var registrationQuery = await state.api.getDocs(state.api.query(
          state.api.collection(state.db, REGISTRATIONS_COLLECTION),
          state.api.where("loginNameNormalized", "==", normalized),
          state.api.limit(1)
        ));
        registrationSnapshot = registrationQuery.empty ? registrationSnapshot : registrationQuery.docs[0];
      }
      if (!registrationSnapshot.exists()) {
        throw new Error("Registration record not found for " + loginName + ".");
      }
      var result = await approveStudent({
        registrationId: registrationSnapshot.id,
        loginName: loginName,
        language: clean(row.language),
        batchName: clean(row.batchName),
        status: clean(row.status || "approved"),
        tempPassword: clean(row.tempPassword || row.password)
      });
      approvedCount += 1;
      if (clean(result.tempPassword)) {
        credentials.push({
          loginName: result.loginName,
          tempPassword: result.tempPassword
        });
      }
    }
    return {
      ok: true,
      count: approvedCount,
      credentials: credentials
    };
  }

  async function getAdminIdToken(forceRefresh) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    return state.currentUser.getIdToken(Boolean(forceRefresh));
  }

  async function getRewriteRequests() {
    await readyPromise;
    if (!state.configured || !isAdminUser(state.currentUser)) {
      return [];
    }

    var mapped = {};
    var rewriteSnapshot = await state.api.getDocs(state.api.collection(state.db, REWRITE_REQUESTS_COLLECTION));
    rewriteSnapshot.docs.map(mapRewriteRequestDocument).forEach(function (request) {
      mapped[request.id] = {
        id: request.id,
        attemptId: clean(request.attemptId) || request.id,
        studentId: request.studentId,
        studentName: request.studentDisplayName,
        studentLoginName: request.studentLoginName,
        testId: request.testId,
        testTitle: request.testTitle,
        score: String(request.score || 0) + " / " + String(request.totalQuestions || 0),
        requestedAt: request.requestedAt || "",
        requestedAtMs: Number(request.requestedAtMs || 0),
        reviewedAt: request.reviewedAt || "",
        reviewedBy: request.reviewedBy || "",
        status: request.status || "pending"
      };
    });

    getAttempts().filter(function (attempt) {
      return Boolean(clean(attempt.rewriteRequestStatus)) && !mapped[attempt.id];
    }).forEach(function (attempt) {
      mapped[attempt.id] = {
        id: attempt.id,
        attemptId: attempt.id,
        studentId: attempt.studentId,
        studentName: attempt.studentDisplayName,
        studentLoginName: attempt.studentLoginName,
        testId: attempt.testId,
        testTitle: attempt.testTitle,
        score: String(attempt.score || 0) + " / " + String(attempt.totalQuestions || 0),
        requestedAt: attempt.rewriteRequestedAt || "",
        requestedAtMs: Number(attempt.rewriteRequestedAtMs || 0),
        reviewedAt: attempt.rewriteReviewedAt || "",
        reviewedBy: attempt.rewriteReviewedBy || "",
        status: attempt.rewriteRequestStatus || "pending"
      };
    });

    return Object.keys(mapped).map(function (key) {
      return mapped[key];
    }).sort(function (left, right) {
      return Number(right.requestedAtMs || 0) - Number(left.requestedAtMs || 0);
    });
  }

  async function approveRewrite(requestId) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(requestId);
    if (!targetId) {
      throw new Error("Rewrite request not found.");
    }

    var requestRef = state.api.doc(state.db, REWRITE_REQUESTS_COLLECTION, targetId);
    var requestSnapshot = await state.api.getDoc(requestRef);
    var rewriteRequest = requestSnapshot.exists() ? mapRewriteRequestDocument(requestSnapshot) : null;
    var attemptRef = state.api.doc(state.db, ATTEMPTS_COLLECTION, clean(rewriteRequest && rewriteRequest.attemptId) || targetId);
    var attemptSnapshot = await state.api.getDoc(attemptRef);
    if (!attemptSnapshot.exists()) {
      throw new Error("Rewrite request not found.");
    }

    var attempt = mapAttemptDocument(attemptSnapshot);
    var currentStatus = clean(rewriteRequest && rewriteRequest.status) || clean(attempt.rewriteRequestStatus);
    if (currentStatus !== "pending") {
      throw new Error("Only pending retest requests can be approved.");
    }

    var now = new Date().toISOString();
    await state.api.setDoc(attemptRef, {
      rewriteRequestStatus: "approved",
      rewriteReviewedAt: now,
      rewriteReviewedAtMs: Date.now(),
      rewriteReviewedBy: clean(state.currentUser && state.currentUser.email),
      updatedAt: now
    }, { merge: true });
    if (rewriteRequest) {
      await state.api.setDoc(requestRef, {
        status: "approved",
        reviewedAt: now,
        reviewedAtMs: Date.now(),
        reviewedBy: clean(state.currentUser && state.currentUser.email),
        updatedAt: now
      }, { merge: true });
    }

    return {
      ok: true,
      requestId: targetId,
      reviewedAt: now
    };
  }

  async function rejectRewrite(requestId) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var targetId = clean(requestId);
    if (!targetId) {
      throw new Error("Rewrite request not found.");
    }

    var requestRef = state.api.doc(state.db, REWRITE_REQUESTS_COLLECTION, targetId);
    var requestSnapshot = await state.api.getDoc(requestRef);
    var rewriteRequest = requestSnapshot.exists() ? mapRewriteRequestDocument(requestSnapshot) : null;
    var attemptRef = state.api.doc(state.db, ATTEMPTS_COLLECTION, clean(rewriteRequest && rewriteRequest.attemptId) || targetId);
    var attemptSnapshot = await state.api.getDoc(attemptRef);
    if (!attemptSnapshot.exists()) {
      throw new Error("Rewrite request not found.");
    }

    var attempt = mapAttemptDocument(attemptSnapshot);
    var currentStatus = clean(rewriteRequest && rewriteRequest.status) || clean(attempt.rewriteRequestStatus);
    if (currentStatus !== "pending") {
      throw new Error("Only pending retest requests can be rejected.");
    }

    var now = new Date().toISOString();
    await state.api.setDoc(attemptRef, {
      rewriteRequestStatus: "rejected",
      rewriteReviewedAt: now,
      rewriteReviewedAtMs: Date.now(),
      rewriteReviewedBy: clean(state.currentUser && state.currentUser.email),
      updatedAt: now
    }, { merge: true });
    if (rewriteRequest) {
      await state.api.setDoc(requestRef, {
        status: "rejected",
        reviewedAt: now,
        reviewedAtMs: Date.now(),
        reviewedBy: clean(state.currentUser && state.currentUser.email),
        updatedAt: now
      }, { merge: true });
    }

    return {
      ok: true,
      requestId: targetId,
      reviewedAt: now
    };
  }

  window.VisionTestStore = {
    ready: function () { return readyPromise; },
    getRegistrations: getRegistrations,
    getStudents: getStudents,
    getTests: getTests,
    getAttempts: getAttempts,
    subscribeRegistrations: function (callback) { return subscribeTo("registrations", getRegistrations, callback); },
    subscribeStudents: function (callback) { return subscribeTo("students", getStudents, callback); },
    subscribeTests: function (callback) { return subscribeTo("tests", getTests, callback); },
    subscribeAttempts: function (callback) { return subscribeTo("attempts", getAttempts, callback); },
    saveTest: saveTest,
    publishTest: publishTest,
    closeTest: closeTest,
    deleteTest: deleteTest,
    approveStudent: approveStudent,
    bulkApproveStudents: bulkApproveStudents,
    updateStudentStatus: updateStudentStatus,
    saveStudentFee: saveStudentFee,
    deleteStudent: deleteStudent,
    resetStudentPassword: resetStudentPassword,
    clearAttempts: clearAttempts,
    getRewriteRequests: getRewriteRequests,
    approveRewrite: approveRewrite,
    rejectRewrite: rejectRewrite,
    getAdminIdToken: getAdminIdToken,
    normalizeLoginName: normalizeLoginName,
    formatDateTime: formatDateTime
  };
})();
