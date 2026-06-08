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

  function cleanQuestionText(value) {
    var text = clean(value);
    return window.VisionTestText && typeof window.VisionTestText.normalizeTamilText === "function"
      ? window.VisionTestText.normalizeTamilText(text)
      : text;
  }

  function replaceTokens(template, values) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(values || {}, key) ? values[key] : "";
    });
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

  function formatCountdown(targetTime) {
    var targetMillis = new Date(targetTime).getTime();
    if (!Number.isFinite(targetMillis)) {
      return "-";
    }
    var diff = Math.max(targetMillis - Date.now(), 0);
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var clock = String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    return days > 0 ? String(days) + "d " + clock : clock;
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

  function getLanguageLabel(language) {
    return clean(language) === "ta" ? t("test_language_tamil", "Tamil") : t("test_language_english", "English");
  }

  function renderStudentTestWindows(student) {
    var studentLanguage = clean(student && student.language) === "ta" ? "ta" : "en";
    var labels = {
      en: t("test_window_allowed", "Your test window"),
      ta: t("test_window_locked", "Locked for your medium")
    };
    if (studentLanguage === "ta") {
      labels.en = t("test_window_locked", "Locked for your medium");
      labels.ta = t("test_window_allowed", "Your test window");
    }

    [
      { id: "englishTestWindow", statusId: "englishTestWindowStatus", language: "en" },
      { id: "tamilTestWindow", statusId: "tamilTestWindowStatus", language: "ta" }
    ].forEach(function (entry) {
      var card = byId(entry.id);
      var isActive = entry.language === studentLanguage;
      if (card) {
        card.classList.toggle("is-active", isActive);
        card.classList.toggle("is-locked", !isActive);
      }
      setText(entry.statusId, labels[entry.language] || getLanguageLabel(entry.language));
    });
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
    var title = t("test_suggestion_" + safeCode + "_title", "");
    var body = t("test_suggestion_" + safeCode + "_body", "");
    
    // If translations are missing, provide defaults
    if (!title) {
      var codeWords = safeCode.split("_").join(" ");
      title = codeWords.charAt(0).toUpperCase() + codeWords.slice(1);
    }
    if (!body) {
      body = "Focus on improving this area with targeted practice.";
    }
    
    return {
      title: title,
      body: body
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

  function supportsRewriteRequests() {
    return Boolean(window.VisionTestApi && typeof window.VisionTestApi.supportsRewriteRequests === "function" && window.VisionTestApi.supportsRewriteRequests());
  }

  function syncRewriteSectionVisibility(summary) {
    var rewriteSection = byId("resultRewriteSection");
    var rewriteButton = byId("requestRewriteButton");
    var rewriteStatus = byId("resultRewriteStatus");
    var requestStatus = clean(summary && summary.rewriteRequestStatus);

    if (rewriteSection) {
      rewriteSection.classList.toggle("hidden", !supportsRewriteRequests());
    }
    if (!supportsRewriteRequests()) {
      return;
    }

    if (rewriteButton) {
      rewriteButton.disabled = false;
      rewriteButton.textContent = t("test_btn_request_rewrite", "Request to Retake Test");
    }

    if (rewriteStatus) {
      rewriteStatus.textContent = "";
      rewriteStatus.classList.remove("status-success", "status-error");
    }

    if (requestStatus === "pending") {
      if (rewriteButton) {
        rewriteButton.disabled = true;
        rewriteButton.textContent = t("test_rewrite_requested_button", "Request Sent");
      }
      if (rewriteStatus) {
        rewriteStatus.textContent = t("test_rewrite_requested", "Rewrite request submitted successfully. Please wait for admin approval.");
        rewriteStatus.classList.add("status-success");
      }
      return;
    }

    if (requestStatus === "approved") {
      if (rewriteButton) {
        rewriteButton.disabled = true;
        rewriteButton.textContent = t("test_rewrite_requested_button", "Request Sent");
      }
      if (rewriteStatus) {
        rewriteStatus.textContent = t("test_rewrite_approved_ready", "Your retest has already been approved. Log in again and start the test.");
        rewriteStatus.classList.add("status-success");
      }
      return;
    }

    if (requestStatus === "rejected" && rewriteStatus) {
      rewriteStatus.textContent = t("test_rewrite_rejected", "Your previous retest request was rejected. You can request again if needed.");
      rewriteStatus.classList.add("status-error");
    }
  }

  function renderSuggestions(summary) {
    var listContainer = byId("resultSuggestionsList");
    var emptyMessage = byId("resultSuggestionsEmpty");
    
    console.log("🎯 renderSuggestions called with summary:", summary);
    
    if (!listContainer || !emptyMessage) {
      console.warn("⚠️ Suggestion containers not found");
      return;
    }

    var suggestionCodes = Array.isArray(summary.suggestionCodes) ? summary.suggestionCodes : [];
    console.log("📝 Suggestion codes:", suggestionCodes);
    
    if (suggestionCodes.length === 0) {
      console.log("ℹ️ No suggestions to display");
      listContainer.innerHTML = "";
      emptyMessage.classList.remove("hidden");
      return;
    }

    listContainer.innerHTML = "";
    emptyMessage.classList.add("hidden");

    var renderedCount = 0;
    suggestionCodes.forEach(function (code) {
      var copy = getSuggestionCopy(code);
      console.log("📌 Processing suggestion:", code, copy);
      
      if (copy.title || copy.body) {
        var item = document.createElement("div");
        item.className = "result-suggestion-item";
        var title = copy.title || code;
        var body = copy.body || "Practice and improve in this area.";
        item.innerHTML = "" +
          "<strong>" + title + "</strong>" +
          "<p>" + body + "</p>";
        listContainer.appendChild(item);
        renderedCount += 1;
        console.log("✅ Rendered suggestion:", code);
      } else {
        console.warn("⚠️ Missing translation for:", code);
      }
    });
    
    console.log("✨ Total suggestions rendered:", renderedCount);
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
    statusTimerId: null,
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

  function clearStatusTimer() {
    if (portalState.statusTimerId) {
      window.clearInterval(portalState.statusTimerId);
      portalState.statusTimerId = null;
    }
  }

  function getAvailabilityLabel(state) {
    var map = {
      no_test: "test_portal_availability_none",
      before_window: "test_portal_availability_not_open",
      window_closed: "test_portal_availability_closed",
      ready: "test_portal_availability_live",
      in_progress: "test_portal_availability_in_progress",
      submitted: "test_portal_availability_submitted"
    };
    return t(map[state] || "test_portal_availability_none", "No Test");
  }

  function updatePortalStateDetails() {
    var payload = portalState.activePayload || {};
    var state = clean(payload.state || "no_test");
    var test = payload.test || portalState.testData || null;
    var attempt = payload.attempt || portalState.attemptData || null;
    var message = getPortalStateMessage(state);
    var countdown = "-";

    if (state === "before_window" && test) {
      message = replaceTokens(t("test_portal_not_open_detail", "This test opens on {time}."), {
        time: formatDateTime(test.opensAt)
      });
      countdown = test.opensAt ? formatCountdown(test.opensAt) : "-";
    } else if (state === "ready" && test) {
      message = replaceTokens(t("test_portal_ready_detail", "The test is live now and closes on {time}."), {
        time: formatDateTime(test.closesAt)
      });
      countdown = test.closesAt ? formatCountdown(test.closesAt) : "-";
    } else if (state === "window_closed" && test) {
      message = replaceTokens(t("test_portal_window_closed_detail", "This test closed on {time}."), {
        time: formatDateTime(test.closesAt)
      });
      countdown = t("test_portal_countdown_closed", "Closed");
    } else if (state === "in_progress" && attempt) {
      message = replaceTokens(t("test_portal_progress_detail", "Your attempt is active until {time}."), {
        time: formatDateTime(attempt.expiresAt)
      });
      countdown = attempt.expiresAt ? formatCountdown(attempt.expiresAt) : "-";
    } else if (state === "submitted") {
      countdown = t("test_portal_countdown_complete", "Completed");
    }

    setText("testCardAvailability", getAvailabilityLabel(state));
    setText("testCardCountdown", countdown);
    setText("testCardMessage", message);
  }

  function syncStatusTimer() {
    clearStatusTimer();
    updatePortalStateDetails();

    var payload = portalState.activePayload || {};
    var state = clean(payload.state || "");
    if (state === "before_window" || state === "ready" || state === "in_progress") {
      portalState.statusTimerId = window.setInterval(updatePortalStateDetails, 1000);
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
    renderStudentTestWindows(payload.student);
    setText("testCardTitle", payload.test ? payload.test.title : "-");
    setText("testCardWindow", payload.test ? (formatDateTime(payload.test.opensAt) + " - " + formatDateTime(payload.test.closesAt)) : "-");
    setText("testCardLanguage", payload.test ? (payload.test.language === "ta" ? t("test_language_tamil") : t("test_language_english")) : "-");
    setText("testCardDuration", payload.test ? formatMinutes(payload.test.durationMinutes || 0) : "-");
    setText("testCardQuestions", payload.test ? String(payload.test.questionCount || 0) : "0");
    syncStatusTimer();

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
    portalState.activePayload = Object.assign({}, portalState.activePayload || {}, {
      state: "in_progress",
      test: testData,
      attempt: attemptData
    });
    portalState.testData = testData;
    portalState.attemptData = attemptData;
    portalState.resultSummary = null;
    syncStatusTimer();

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
          "<h3>" + cleanQuestionText(question.prompt) + "</h3>" +
        "</div>" +
        "<div class='runner-options'>" +
          question.options.map(function (option) {
            return "" +
              "<label class='runner-option'>" +
                "<input type='radio' name='question-" + question.id + "' data-question-id='" + question.id + "' value='" + option.id + "' " + (selectedValue === option.id ? "checked" : "") + ">" +
                "<span>" + cleanQuestionText(option.text) + "</span>" +
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
    console.log("🎬 renderResult called with:", summary);
    clearTimer();
    clearStatusTimer();
    portalState.activePayload = Object.assign({}, portalState.activePayload || {}, {
      state: "submitted",
      attempt: null,
      summary: summary
    });
    portalState.resultSummary = summary || null;
    portalState.attemptData = null;
    renderTestCard(portalState.activePayload);
    setSectionVisible("testRunnerSection", false);
    setSectionVisible("testResultSection", true);
    setText("resultScoreValue", String(summary.score || 0) + " / " + String(summary.totalQuestions || 0));
    setText("resultCorrectValue", String(summary.correctCount || 0));
    setText("resultAttemptedValue", String(summary.answeredCount || 0));
    setText("resultPercentageValue", clean(summary.percentage) ? String(summary.percentage) + "%" : "0%");
    setText("resultSubmittedAtValue", formatDateTime(summary.submittedAt));
    setText("resultStatusValue", clean(summary.customStatusLabel) || getPerformanceStatusLabel(summary.performanceStatusCode));
    setText("resultStatusNote", clean(summary.customStatusNote) || getPerformanceStatusNote(summary.performanceStatusCode));
    renderModelInsight(summary.modelInsight);
    syncRewriteSectionVisibility(summary);
    console.log("🎯 About to render suggestions...");
    renderSuggestions(summary);
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
    portalState.testData = payload.test || null;
    if (payload.state !== "in_progress") {
      portalState.attemptData = null;
    }
    if (payload.state !== "submitted") {
      portalState.resultSummary = null;
    }
    renderTestCard(payload);

    if (payload.state === "in_progress" && payload.test && payload.attempt) {
      renderRunner(payload.test, payload.attempt);
      setStatus(getPortalStateMessage(payload.state), false);
      return;
    }

    if (payload.state === "submitted" && payload.summary) {
      portalState.testData = payload.test || null;
      portalState.attemptData = null;
      renderResult(payload.summary);
      setStatus(getPortalStateMessage(payload.state), false);
      return;
    }

    clearTimer();
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
    syncRewriteSectionVisibility(null);
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
          renderStudentTestWindows(sessionPayload && sessionPayload.student);
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
        clearStatusTimer();
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
        portalState.activePayload = Object.assign({}, portalState.activePayload || {}, {
          state: "in_progress",
          test: response.test,
          attempt: response.attempt
        });
        renderTestCard(portalState.activePayload);
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

    async function requestRewrite() {
      console.log("🔄 requestRewrite clicked");
      if (!portalState.resultSummary || !portalState.testData) {
        console.warn("⚠️ Missing result summary or test data");
        return;
      }
      var rewriteButton = byId("requestRewriteButton");
      var rewriteStatus = byId("resultRewriteStatus");
      
      console.log("📝 Button:", rewriteButton, "Status element:", rewriteStatus);
      
      if (rewriteButton) {
        rewriteButton.disabled = true;
        rewriteButton.textContent = t("test_rewrite_requesting", "Requesting...") || "Requesting...";
      }
      
      try {
        console.log("📞 Calling requestRewrite API...");
        if (!window.VisionTestApi || !window.VisionTestApi.requestRewrite) {
          throw new Error("requestRewrite API not available");
        }
        var result = await window.VisionTestApi.requestRewrite({
          testId: (portalState.testData || (portalState.activePayload && portalState.activePayload.test) || {}).id
        });
        
        console.log("✅ Rewrite request submitted:", result);
        portalState.resultSummary = portalState.resultSummary || {};
        portalState.resultSummary.rewriteRequestStatus = "pending";
        if (rewriteStatus) {
          rewriteStatus.textContent = t("test_rewrite_requested", "Rewrite request submitted successfully. Please wait for admin approval.");
          rewriteStatus.classList.remove("status-error");
          rewriteStatus.classList.add("status-success");
        }
        if (rewriteButton) {
          rewriteButton.disabled = true;
          rewriteButton.textContent = t("test_rewrite_requested_button", "Request Sent") || "Request Sent";
        }
        syncRewriteSectionVisibility(portalState.resultSummary);
      } catch (error) {
        console.error("❌ Rewrite request failed:", error);
        if (rewriteStatus) {
          var errorMsg = error && error.message ? error.message : "Unable to submit rewrite request.";
          rewriteStatus.textContent = errorMsg;
          rewriteStatus.classList.remove("status-success");
          rewriteStatus.classList.add("status-error");
        }
        if (rewriteButton) {
          rewriteButton.disabled = false;
          rewriteButton.textContent = t("test_btn_request_rewrite", "Request to Retake Test");
        }
      }
    }

    var requestRewriteButton = byId("requestRewriteButton");
    console.log("🔘 Request rewrite button found:", requestRewriteButton);
    if (requestRewriteButton) {
      requestRewriteButton.addEventListener("click", requestRewrite);
      console.log("✅ Request rewrite button listener attached");
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
      renderStudentTestWindows(existingSession && existingSession.student);
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
