(function () {
  "use strict";

  function t(key, fallback) {
    return window.VisionTestI18n && typeof window.VisionTestI18n.t === "function" ? window.VisionTestI18n.t(key, fallback) : (fallback || key);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
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

  function setStatus(message, isError) {
    var element = byId("testPortalStatus");
    if (!element) {
      return;
    }
    element.textContent = message || "";
    element.classList.remove("status-success", "status-error");
    if (message) {
      element.classList.add(isError ? "status-error" : "status-success");
    }
  }

  function setSessionVisible(isLoggedIn) {
    var loginSection = byId("studentLoginSection");
    var dashboardSection = byId("studentDashboardSection");
    if (loginSection) {
      loginSection.classList.toggle("hidden", isLoggedIn);
    }
    if (dashboardSection) {
      dashboardSection.classList.toggle("hidden", !isLoggedIn);
    }
  }

  function setSectionVisible(id, isVisible) {
    var element = byId(id);
    if (element) {
      element.classList.toggle("hidden", !isVisible);
    }
  }

  function setText(id, value) {
    var element = byId(id);
    if (element) {
      element.textContent = value || "";
    }
  }

  function setHtml(id, value) {
    var element = byId(id);
    if (element) {
      element.innerHTML = value || "";
    }
  }

  function setStudentWelcome(student) {
    var safe = student && typeof student === "object" ? student : {};
    setText("studentWelcomeName", safe.displayName || safe.loginName || t("test_portal_student_fallback", "Student"));
  }

  function formatMinutes(value) {
    return String(value || 0) + " " + t("test_unit_minutes", "min");
  }

  function getPerformanceStatusLabel(code) {
    var key = "test_performance_" + clean(code || "needs_improvement");
    return t(key, t("test_performance_needs_improvement", "Needs Improvement"));
  }

  function getPerformanceStatusNote(code) {
    var key = "test_performance_note_" + clean(code || "needs_improvement");
    return t(key, "");
  }

  function getSuggestionCopy(code) {
    var safeCode = clean(code);
    return {
      title: t("test_suggestion_" + safeCode + "_title", safeCode),
      body: t("test_suggestion_" + safeCode + "_body", "")
    };
  }

  function renderModelInsight(modelInsight) {
    var element = byId("resultModelInsight");
    if (!element) {
      return;
    }
    if (!modelInsight || typeof modelInsight !== "object") {
      element.textContent = "";
      element.classList.add("hidden");
      return;
    }

    var label = clean(modelInsight.label) || t("test_model_status_unavailable", "AI evaluation unavailable.");
    var detail = clean(modelInsight.detail);
    var probability = Number(modelInsight.probabilityCorrect || 0);
    var message = t("test_portal_ai_evaluation", "AI Evaluation") + ": " + label;
    if (modelInsight.connected && probability > 0) {
      message += " (" + (probability * 100).toFixed(1).replace(/\.0$/, "") + "%)";
    }
    if (detail) {
      message += " - " + detail;
    }
    element.textContent = message;
    element.classList.remove("hidden");
  }

  function getPortalStateMessage(state) {
    var map = {
      no_test: "test_portal_no_test",
      before_window: "test_portal_not_open",
      window_closed: "test_portal_window_closed",
      ready: "test_portal_ready",
      in_progress: "test_portal_progress",
      submitted: "test_portal_submitted"
    };
    return t(map[state] || "test_portal_no_test");
  }

  var portalState = {
    activePayload: null,
    timerId: null,
    testData: null,
    attemptData: null,
    resultSummary: null,
    isSubmitting: false
  };

  function clearTimer() {
    if (portalState.timerId) {
      window.clearInterval(portalState.timerId);
      portalState.timerId = null;
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, Number(ms || 0));
    });
  }

  function setSubmitPending(isPending) {
    portalState.isSubmitting = Boolean(isPending);
    var submitButtonTop = byId("submitTestButtonTop");
    var submitButtonBottom = byId("submitTestButtonBottom");
    if (submitButtonTop) {
      submitButtonTop.disabled = Boolean(isPending);
    }
    if (submitButtonBottom) {
      submitButtonBottom.disabled = Boolean(isPending);
    }
  }

  function collectAnswers() {
    var answers = {};
    document.querySelectorAll("input[data-question-id]:checked").forEach(function (input) {
      answers[input.getAttribute("data-question-id")] = input.value;
    });
    return answers;
  }

  function updateAnswerSummary() {
    if (!portalState.testData) {
      return;
    }
    var answeredCount = Object.keys(collectAnswers()).length;
    var total = portalState.testData.questions.length;
    setText("runnerAnsweredCount", String(answeredCount));
    setText("runnerUnansweredCount", String(Math.max(total - answeredCount, 0)));
  }

  function renderQuestionNav(questions) {
    var container = byId("questionNav");
    if (!container) {
      return;
    }
    container.innerHTML = "";
    questions.forEach(function (question, index) {
      var link = document.createElement("a");
      link.href = "#question-" + question.id;
      link.className = "question-nav-pill";
      link.textContent = String(index + 1);
      container.appendChild(link);
    });
  }

  function startTimer(expiresAt) {
    clearTimer();
    function tick() {
      var expiryTime = new Date(expiresAt).getTime();
      var diff = expiryTime - Date.now();
      if (diff <= 0) {
        setText("runnerTimeLeft", "00:00");
        clearTimer();
        autoSubmitAttempt();
        return;
      }
      var totalSeconds = Math.floor(diff / 1000);
      var minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      var seconds = String(totalSeconds % 60).padStart(2, "0");
      setText("runnerTimeLeft", minutes + ":" + seconds);
    }
    tick();
    portalState.timerId = window.setInterval(tick, 1000);
  }

  function renderTestCard(payload) {
    setStudentWelcome(payload.student);
    setText("testCardTitle", payload.test ? payload.test.title : "-");
    setText("testCardWindow", payload.test ? (formatDateTime(payload.test.opensAt) + " - " + formatDateTime(payload.test.closesAt)) : "-");
    setText("testCardLanguage", payload.test ? (payload.test.language === "ta" ? t("test_language_tamil") : t("test_language_english")) : "-");
    setText("testCardDuration", payload.test ? formatMinutes(payload.test.durationMinutes || 0) : "-");
    setText("testCardQuestions", payload.test ? String(payload.test.questionCount || 0) : "0");
    setText("testCardMessage", getPortalStateMessage(payload.state));

    var startButton = byId("startTestButton");
    var resumeButton = byId("resumeTestButton");
    if (startButton) {
      startButton.classList.toggle("hidden", payload.state !== "ready");
    }
    if (resumeButton) {
      resumeButton.classList.toggle("hidden", payload.state !== "in_progress");
    }
  }

  function renderRunner(testData, attemptData) {
    var list = byId("testQuestionsList");
    if (!list) {
      return;
    }
    portalState.testData = testData;
    portalState.attemptData = attemptData;
    portalState.resultSummary = null;

    setSectionVisible("testRunnerSection", true);
    setSectionVisible("testResultSection", false);

    setText("runnerTestTitle", testData.title || "-");
    setText("runnerWindowValue", formatDateTime(testData.opensAt) + " - " + formatDateTime(testData.closesAt));
    setText("runnerQuestionCount", String(testData.questions.length));
    renderQuestionNav(testData.questions);

    list.innerHTML = "";
    testData.questions.forEach(function (question, index) {
      var card = document.createElement("article");
      card.className = "runner-question-card";
      card.id = "question-" + question.id;
      var selectedValue = attemptData && attemptData.answers ? attemptData.answers[question.id] : "";
      card.innerHTML = "" +
        "<div class='runner-question-head'>" +
          "<span class='question-index'>Q" + String(index + 1) + "</span>" +
          "<h3>" + question.prompt + "</h3>" +
        "</div>" +
        "<div class='runner-options'>" +
          question.options.map(function (option) {
            return "" +
              "<label class='runner-option'>" +
                "<input type='radio' name='question-" + question.id + "' data-question-id='" + question.id + "' value='" + option.id + "' " + (selectedValue === option.id ? "checked" : "") + ">" +
                "<span>" + option.text + "</span>" +
              "</label>";
          }).join("") +
        "</div>";
      list.appendChild(card);
    });

    list.querySelectorAll("input[data-question-id]").forEach(function (input) {
      input.addEventListener("change", updateAnswerSummary);
    });
    updateAnswerSummary();
    startTimer(attemptData.expiresAt);
  }

  function renderResult(summary) {
    clearTimer();
    portalState.resultSummary = summary || null;
    setSectionVisible("testRunnerSection", false);
    setSectionVisible("testResultSection", true);
    setText("resultScoreValue", String(summary.score || 0) + " / " + String(summary.totalQuestions || 0));
    setText("resultCorrectValue", String(summary.correctCount || 0));
    setText("resultAttemptedValue", String(summary.answeredCount || 0));
    setText("resultSubmittedAtValue", formatDateTime(summary.submittedAt));
    setText("resultStatusValue", clean(summary.customStatusLabel) || getPerformanceStatusLabel(summary.performanceStatusCode));
    setText("resultStatusNote", clean(summary.customStatusNote) || getPerformanceStatusNote(summary.performanceStatusCode));
    renderModelInsight(summary.modelInsight);
  }

  async function autoSubmitAttempt() {
    if (!portalState.testData || portalState.isSubmitting) {
      return;
    }
    setSubmitPending(true);
    setStatus(t("test_portal_auto_submit"), false);
    try {
      var response = await submitAttemptWithRecovery({
        testId: portalState.testData.id,
        answers: collectAnswers(),
        autoSubmit: true
      });
      if (response) {
        renderResult(response.summary || response);
        setStatus(t("test_portal_submitted"), false);
      }
    } catch (error) {
      setStatus(error && error.message ? error.message : t("test_status_backend_missing"), true);
    } finally {
      setSubmitPending(false);
    }
  }

  async function refreshPortal() {
    var payload = await window.VisionTestApi.getActiveTest();
    portalState.activePayload = payload;
    renderTestCard(payload);

    if (payload.state === "in_progress" && payload.test && payload.attempt) {
      renderRunner(payload.test, payload.attempt);
      setStatus(getPortalStateMessage(payload.state), false);
      return;
    }

    if (payload.state === "submitted" && payload.summary) {
      renderResult(payload.summary);
      setStatus(getPortalStateMessage(payload.state), false);
      return;
    }

    setSectionVisible("testRunnerSection", false);
    setSectionVisible("testResultSection", false);
    setStatus(getPortalStateMessage(payload.state), false);
  }

  async function tryRecoverSubmittedState() {
    try {
      await wait(900);
      await refreshPortal();
      return Boolean(portalState.activePayload && portalState.activePayload.state === "submitted");
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async function submitAttemptWithRecovery(payload) {
    try {
      return await window.VisionTestApi.submitAttempt(payload);
    } catch (error) {
      if (!window.VisionTestApi.isNetworkError || !window.VisionTestApi.isNetworkError(error)) {
        throw error;
      }
      await wait(600);
      try {
        return await window.VisionTestApi.submitAttempt(payload);
      } catch (retryError) {
        if ((!window.VisionTestApi.isNetworkError || !window.VisionTestApi.isNetworkError(retryError)) || !(await tryRecoverSubmittedState())) {
          throw retryError;
        }
      }
    }
    return null;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.VisionTestApi) {
      return;
    }

    var yearElement = byId("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    var loginForm = byId("studentLoginForm");
    var logoutButton = byId("studentLogoutButton");
    var startButton = byId("startTestButton");
    var resumeButton = byId("resumeTestButton");
    var submitButtonTop = byId("submitTestButtonTop");
    var submitButtonBottom = byId("submitTestButtonBottom");

    setSessionVisible(false);
    setSectionVisible("testRunnerSection", false);
    setSectionVisible("testResultSection", false);
    setStatus(t("test_portal_loading"), false);

    if (loginForm) {
      if (window.VisionTestApi.isDemoMode && window.VisionTestApi.isDemoMode()) {
        var demoCredentials = window.VisionTestApi.getDemoCredentials ? window.VisionTestApi.getDemoCredentials() : null;
        if (demoCredentials) {
          loginForm.elements.loginName.value = demoCredentials.loginName || "";
          loginForm.elements.password.value = demoCredentials.password || "";
        }
        setStatus(t("test_demo_mode_hint", "Demo mode is active. Use demo-student / demo123 and submit the sample test after starting the local model server."), false);
      }

      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
          var sessionPayload = await window.VisionTestApi.studentLogin(clean(loginForm.elements.loginName.value), clean(loginForm.elements.password.value));
          loginForm.reset();
          setStudentWelcome(sessionPayload && sessionPayload.student);
          setSessionVisible(true);
          await refreshPortal();
        } catch (error) {
          setStatus(error && error.message ? error.message : t("test_portal_login_failed"), true);
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", function () {
        clearTimer();
        portalState.activePayload = null;
        portalState.testData = null;
        portalState.attemptData = null;
        portalState.resultSummary = null;
        window.VisionTestApi.logoutStudent();
        setSessionVisible(false);
        setSectionVisible("testRunnerSection", false);
        setSectionVisible("testResultSection", false);
        setStatus("", false);
      });
    }

    async function startOrResume() {
      try {
        var response = await window.VisionTestApi.startAttempt();
        renderRunner(response.test, response.attempt);
        setStatus(t("test_portal_progress"), false);
      } catch (error) {
        setStatus(error && error.message ? error.message : t("test_status_backend_missing"), true);
        try {
          await refreshPortal();
        } catch (refreshError) {
          console.error(refreshError);
        }
      }
    }

    if (startButton) {
      startButton.addEventListener("click", startOrResume);
    }
    if (resumeButton) {
      resumeButton.addEventListener("click", startOrResume);
    }

    async function submitNow() {
      if (!portalState.testData || portalState.isSubmitting) {
        return;
      }
      if (!window.confirm(t("test_portal_submit_confirm"))) {
        return;
      }
      setSubmitPending(true);
      try {
        var response = await submitAttemptWithRecovery({
          testId: portalState.testData.id,
          answers: collectAnswers(),
          autoSubmit: false
        });
        if (response) {
          renderResult(response.summary || response);
          setStatus(t("test_portal_submitted"), false);
        }
      } catch (error) {
        setStatus(error && error.message ? error.message : t("test_status_backend_missing"), true);
      } finally {
        setSubmitPending(false);
      }
    }

    if (submitButtonTop) {
      submitButtonTop.addEventListener("click", submitNow);
    }
    if (submitButtonBottom) {
      submitButtonBottom.addEventListener("click", submitNow);
    }

    try {
      var existingSession = await window.VisionTestApi.getStudentSession();
      setStudentWelcome(existingSession && existingSession.student);
      setSessionVisible(true);
      try {
        await refreshPortal();
      } catch (refreshError) {
        setStatus(refreshError && refreshError.message ? refreshError.message : t("test_status_backend_missing"), true);
      }
    } catch (error) {
      if (window.VisionTestApi.getStudentSessionToken()) {
        try {
          await window.VisionTestApi.logoutStudent();
        } catch (logoutError) {
          console.error(logoutError);
        }
      }
      setSessionVisible(false);
      if (window.VisionTestApi.isDemoMode && window.VisionTestApi.isDemoMode()) {
        setStatus(t("test_demo_mode_hint", "Demo mode is active. Use demo-student / demo123 and start the local Random Forest server before submitting the sample test."), false);
      } else {
        setStatus(t("test_portal_no_test"), false);
      }
    }

    window.addEventListener("vision-language-changed", function () {
      if (portalState.activePayload) {
        renderTestCard(portalState.activePayload);
        if (portalState.testData && portalState.attemptData && !byId("testRunnerSection").classList.contains("hidden")) {
          portalState.attemptData.answers = Object.assign({}, portalState.attemptData.answers || {}, collectAnswers());
          renderRunner(portalState.testData, portalState.attemptData);
        }
        if (portalState.resultSummary && !byId("testResultSection").classList.contains("hidden")) {
          renderResult(portalState.resultSummary);
        }
        setStatus(getPortalStateMessage(portalState.activePayload.state), false);
      }
    });
  });
})();
