(function () {
  "use strict";

  var FIREBASE_VERSION = "12.7.0";
  var REGISTRATIONS_COLLECTION = "test_registrations";
  var STUDENTS_COLLECTION = "students";
  var TESTS_COLLECTION = "tests";
  var ATTEMPTS_COLLECTION = "attempts";
  var PUBLIC_TESTS_COLLECTION = "published_tests";
  var ANSWER_KEYS_COLLECTION = "test_answer_keys";

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

  function normalizeAdminEmail(value) {
    return clean(value).toLowerCase();
  }

  function normalizeLanguage(value) {
    return clean(value).toLowerCase() === "ta" || clean(value).toLowerCase() === "tamil" ? "ta" : "en";
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
      mobile: clean(data.mobile),
      language: normalizeLanguage(data.language),
      batchName: clean(data.batchName),
      examName: clean(data.examName),
      status: clean(data.status) || "pending",
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
      status: clean(data.status) || "approved",
      updatedAt: data.updatedAt || "",
      passwordUpdatedAt: data.passwordUpdatedAt || "",
      approvedAt: data.approvedAt || ""
    };
  }

  function mapQuestion(question, index) {
    var raw = question && typeof question === "object" ? question : {};
    var correctOptionId = clean(raw.correctOptionId).toLowerCase();
    return {
      id: clean(raw.id) || ("question_" + String(index + 1)),
      prompt: clean(raw.prompt),
      options: (Array.isArray(raw.options) ? raw.options : []).map(function (option, optionIndex) {
        var optionRaw = option && typeof option === "object" ? option : {};
        return {
          id: clean(optionRaw.id) || String.fromCharCode(97 + optionIndex),
          text: clean(optionRaw.text)
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
      prompt: clean(safe.prompt),
      options: (Array.isArray(safe.options) ? safe.options : []).map(function (option) {
        var optionSafe = option && typeof option === "object" ? option : {};
        return {
          id: clean(optionSafe.id),
          text: clean(optionSafe.text)
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
      status: clean(data.status) || "draft",
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
      status: clean(data.status) || "started"
    };
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
        state.api.query(state.api.collection(state.db, REGISTRATIONS_COLLECTION), state.api.orderBy("createdAt", "desc")),
        function (snapshot) {
          currentRegistrations = snapshot.docs.map(mapRegistrationDocument);
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
    state.app = state.api.getApps().length ? state.api.getApp() : state.api.initializeApp(config);
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
      batch.set(state.api.doc(state.db, TESTS_COLLECTION, docSnapshot.id), {
        isActive: false,
        status: "closed",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    publicSnapshot.docs.forEach(function (docSnapshot) {
      batch.set(state.api.doc(state.db, PUBLIC_TESTS_COLLECTION, docSnapshot.id), {
        isActive: false,
        status: "closed",
        updatedAt: new Date().toISOString()
      }, { merge: true });
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
    var existingStudentsSnapshot = await state.api.getDocs(state.api.query(
      state.api.collection(state.db, STUDENTS_COLLECTION),
      state.api.where("loginNameNormalized", "==", loginNameNormalized),
      state.api.limit(1)
    ));
    var legacyStudentSnapshot = existingStudentsSnapshot.empty ? null : existingStudentsSnapshot.docs[0];
    if (legacyStudentSnapshot && (clean((legacyStudentSnapshot.data() || {}).authUid) || clean((legacyStudentSnapshot.data() || {}).authEmail))) {
      throw new Error("This login name is already approved for a student.");
    }

    var tempPassword = clean(safe.tempPassword);
    if (tempPassword && tempPassword.length < 6) {
      throw new Error("Temporary password must be at least 6 characters.");
    }
    if (!tempPassword) {
      tempPassword = generateTempPassword();
    }

    var authPayload = await requestIdentityToolkit("accounts:signUp", {
      email: pseudoStudentEmail(loginNameNormalized),
      password: tempPassword,
      returnSecureToken: false
    });
    var studentId = clean(authPayload.localId);
    if (!studentId) {
      throw new Error("Unable to create the student login account.");
    }

    var now = new Date().toISOString();
    await state.api.setDoc(state.api.doc(state.db, STUDENTS_COLLECTION, studentId), {
      authUid: studentId,
      registrationId: registration.id,
      displayName: clean(safe.displayName || registration.displayName),
      loginName: loginName,
      loginNameNormalized: loginNameNormalized,
      authEmail: pseudoStudentEmail(loginNameNormalized),
      mobile: clean(safe.mobile || registration.mobile),
      language: normalizeLanguage(safe.language || registration.language),
      batchName: clean(safe.batchName || registration.batchName),
      examName: clean(safe.examName || registration.examName),
      status: clean(safe.status || "approved") === "inactive" ? "inactive" : "approved",
      approvedAt: now,
      passwordUpdatedAt: now,
      updatedAt: now
    }, { merge: true });

    if (legacyStudentSnapshot && legacyStudentSnapshot.id !== studentId) {
      await state.api.deleteDoc(state.api.doc(state.db, STUDENTS_COLLECTION, legacyStudentSnapshot.id));
    }

    await state.api.setDoc(registrationRef, {
      displayName: clean(safe.displayName || registration.displayName),
      loginName: loginName,
      loginNameNormalized: loginNameNormalized,
      mobile: clean(safe.mobile || registration.mobile),
      language: normalizeLanguage(safe.language || registration.language),
      batchName: clean(safe.batchName || registration.batchName),
      examName: clean(safe.examName || registration.examName),
      status: "approved",
      approvedAt: now,
      updatedAt: now,
      studentId: studentId
    }, { merge: true });

    return {
      ok: true,
      studentId: studentId,
      loginName: loginName,
      tempPassword: tempPassword
    };
  }

  async function bulkApproveStudents(rows) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    var items = Array.isArray(rows) ? rows : [];
    var credentials = [];
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
        examName: clean(row.examName),
        status: clean(row.status || "approved"),
        tempPassword: clean(row.tempPassword || row.password)
      });
      credentials.push({
        loginName: result.loginName,
        tempPassword: result.tempPassword
      });
    }
    return {
      ok: true,
      count: credentials.length,
      credentials: credentials
    };
  }

  async function getAdminIdToken(forceRefresh) {
    await readyPromise;
    assertConfigured();
    assertAdminSession();
    return state.currentUser.getIdToken(Boolean(forceRefresh));
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
    getAdminIdToken: getAdminIdToken,
    normalizeLoginName: normalizeLoginName,
    formatDateTime: formatDateTime
  };
})();
