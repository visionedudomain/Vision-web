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

  function formatMinutes(value) {
    return String(value || 0) + " " + t("test_unit_minutes", "min");
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
    resultSummary: null
  };

  function clearTimer() {
    if (portalState.timerId) {
      window.clearInterval(portalState.timerId);
      portalState.timerId = null;
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
    setText("studentWelcomeName", payload.student && (payload.student.displayName || payload.student.loginName || ""));
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
  }

  async function autoSubmitAttempt() {
    if (!portalState.testData) {
      return;
    }
    setStatus(t("test_portal_auto_submit"), false);
    try {
      var response = await window.VisionTestApi.submitAttempt({
        testId: portalState.testData.id,
        answers: collectAnswers(),
        autoSubmit: true
      });
      renderResult(response.summary || response);
      setStatus(t("test_portal_submitted"), false);
    } catch (error) {
      setStatus(error && error.message ? error.message : t("test_status_backend_missing"), true);
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
      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
          await window.VisionTestApi.studentLogin(clean(loginForm.elements.loginName.value), clean(loginForm.elements.password.value));
          loginForm.reset();
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
      if (!portalState.testData) {
        return;
      }
      if (!window.confirm(t("test_portal_submit_confirm"))) {
        return;
      }
      try {
        var response = await window.VisionTestApi.submitAttempt({
          testId: portalState.testData.id,
          answers: collectAnswers(),
          autoSubmit: false
        });
        renderResult(response.summary || response);
        setStatus(t("test_portal_submitted"), false);
      } catch (error) {
        setStatus(error && error.message ? error.message : t("test_status_backend_missing"), true);
      }
    }

    if (submitButtonTop) {
      submitButtonTop.addEventListener("click", submitNow);
    }
    if (submitButtonBottom) {
      submitButtonBottom.addEventListener("click", submitNow);
    }

    if (window.VisionTestApi.getStudentSessionToken()) {
      try {
        await window.VisionTestApi.getStudentSession();
        setSessionVisible(true);
        await refreshPortal();
      } catch (error) {
        window.VisionTestApi.logoutStudent();
        setSessionVisible(false);
        setStatus(t("test_portal_no_test"), false);
      }
    } else {
      setStatus(t("test_portal_no_test"), false);
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
