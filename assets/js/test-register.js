(function () {
  "use strict";

  function t(key, fallback) {
    return window.VisionTestI18n && typeof window.VisionTestI18n.t === "function" ? window.VisionTestI18n.t(key, fallback) : (fallback || key);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function setStatus(message, isError) {
    var element = document.getElementById("testRegistrationStatus");
    if (!element) {
      return;
    }
    element.textContent = message || "";
    element.classList.remove("status-success", "status-error");
    if (message) {
      element.classList.add(isError ? "status-error" : "status-success");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    var form = document.getElementById("testRegistrationForm");
    if (!form || !window.VisionTestApi) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var payload = {
        displayName: clean(form.elements.displayName.value),
        loginName: clean(form.elements.loginName.value),
        password: clean(form.elements.password.value),
        mobile: clean(form.elements.mobile.value),
        language: clean(form.elements.language.value),
        batchName: clean(form.elements.batchName.value),
        examName: clean(form.elements.examName.value)
      };

      if (!payload.displayName || !payload.loginName || !payload.password || !payload.mobile) {
        setStatus(t("status_fill_required", "Please fill all required fields."), true);
        return;
      }

      try {
        await window.VisionTestApi.registerStudent(payload);
        form.reset();
        setStatus(t("test_registration_success"), false);
      } catch (error) {
        setStatus(error && error.message ? error.message : t("test_registration_failed", "Unable to submit test registration right now."), true);
      }
    });
  });
})();
