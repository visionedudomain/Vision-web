(function () {
  "use strict";

  var SESSION_KEY = "vision_test_student_session_v1";

  function getBackendBaseUrl() {
    var configured = String((window.VisionFirebaseConfig || {}).backendBaseUrl || "").trim().replace(/\/+$/, "");
    if (configured) {
      return configured;
    }
    if (window.location.hostname === "localhost" || /\.netlify\.app$/i.test(window.location.hostname)) {
      return window.location.origin;
    }
    return "";
  }

  function buildFunctionUrl(name) {
    var baseUrl = getBackendBaseUrl();
    if (!baseUrl) {
      throw new Error(window.VisionTestI18n ? window.VisionTestI18n.t("test_status_backend_missing") : "Backend is not available.");
    }
    return baseUrl + "/.netlify/functions/" + name;
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

  function createApiError(response, payload) {
    var errorCode = payload && (payload.error || payload.code) ? String(payload.error || payload.code).trim() : "";
    var errorMessage = payload && payload.message ? String(payload.message).trim() : "";
    var fallbackMessage = response && response.status ? ("Request failed (" + String(response.status) + ").") : "Request failed.";
    var message = errorMessage || errorCode || fallbackMessage;

    if (errorCode === "usage_exceeded") {
      message = window.VisionTestI18n
        ? window.VisionTestI18n.t("test_status_backend_usage_exceeded", "Test server usage limit has been reached. Please contact the admin or try again later.")
        : "Test server usage limit has been reached. Please contact the admin or try again later.";
    }

    var error = new Error(message);
    error.code = errorCode || ("HTTP_" + String((response && response.status) || 0));
    error.status = Number((response && response.status) || 0);
    error.payload = payload || {};
    return error;
  }

  async function parseJson(response) {
    var payload = {};
    try {
      payload = await response.json();
    } catch (error) {
      payload = {};
    }

    if (!response.ok) {
      throw createApiError(response, payload);
    }
    return payload;
  }

  async function rawRequest(name, options) {
    var url = buildFunctionUrl(name);
    var response;
    try {
      response = await fetch(url, Object.assign({
        mode: "cors",
        cache: "no-store"
      }, options || {}));
    } catch (error) {
      var networkError = new Error(window.VisionTestI18n
        ? window.VisionTestI18n.t("test_status_backend_unreachable", "Cannot reach the test server. Please retry.")
        : "Cannot reach the test server. Please retry.");
      networkError.code = "NETWORK_ERROR";
      networkError.cause = error;
      throw networkError;
    }
    return parseJson(response);
  }

  async function requestAdmin(name, body) {
    if (!window.VisionTestStore || typeof window.VisionTestStore.getAdminIdToken !== "function") {
      throw new Error("Admin test store is not ready.");
    }
    var token = await window.VisionTestStore.getAdminIdToken();
    return rawRequest(name, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(body || {})
    });
  }

  async function requestStudent(name, method, body) {
    var headers = {};
    var token = getStudentSessionToken();
    if (token) {
      headers.Authorization = "Bearer " + token;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
    }
    return rawRequest(name, {
      method: method || "GET",
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async function studentLogin(loginName, password) {
    var payload = await rawRequest("test-student-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        loginName: loginName,
        password: password
      })
    });
    setStudentSessionToken(payload.sessionToken || "");
    return payload;
  }

  function logoutStudent() {
    setStudentSessionToken("");
  }

  window.VisionTestApi = {
    getBackendBaseUrl: getBackendBaseUrl,
    getStudentSessionToken: getStudentSessionToken,
    setStudentSessionToken: setStudentSessionToken,
    isNetworkError: function (error) {
      return Boolean(error && error.code === "NETWORK_ERROR");
    },
    registerStudent: function (payload) {
      return rawRequest("test-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
      });
    },
    approveStudent: function (payload) {
      return requestAdmin("test-admin-student", Object.assign({ action: "approve" }, payload || {}));
    },
    bulkApproveStudents: function (rows) {
      return requestAdmin("test-admin-student", {
        action: "bulkApprove",
        rows: Array.isArray(rows) ? rows : []
      });
    },
    resetStudentPassword: function (payload) {
      return requestAdmin("test-admin-student", Object.assign({ action: "resetPassword" }, payload || {}));
    },
    studentLogin: studentLogin,
    logoutStudent: logoutStudent,
    getStudentSession: function () {
      return requestStudent("test-student-session", "GET");
    },
    getActiveTest: function () {
      return requestStudent("test-student-active", "GET");
    },
    startAttempt: function () {
      return requestStudent("test-student-start", "POST", {});
    },
    submitAttempt: function (payload) {
      return requestStudent("test-student-submit", "POST", payload || {});
    }
  };
})();
