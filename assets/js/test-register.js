(function () {
  "use strict";

  var LOOKUP_STORAGE_KEY = "vision_test_registration_lookup_v1";
  var pageState = {
    lastLookupResult: null,
    lastLookupQuery: null
  };

  function t(key, fallback) {
    return window.VisionTestI18n && typeof window.VisionTestI18n.t === "function" ? window.VisionTestI18n.t(key, fallback) : (fallback || key);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function setStatusText(id, message, tone) {
    var element = byId(id);
    if (!element) {
      return;
    }
    element.textContent = message || "";
    element.classList.remove("status-success", "status-error");
    if (tone === "success") {
      element.classList.add("status-success");
    } else if (tone === "error") {
      element.classList.add("status-error");
    }
  }

  function setRegistrationStatus(message, tone) {
    setStatusText("testRegistrationStatus", message, tone);
  }

  function setLookupStatus(message, tone) {
    setStatusText("testRegistrationLookupStatus", message, tone);
  }

  function getLanguageLabel(code) {
    return clean(code) === "ta" ? t("test_language_tamil", "Tamil") : t("test_language_english", "English");
  }

  function getStatusLabel(status) {
    var safeStatus = clean(status || "pending").toLowerCase();
    return t("test_status_" + safeStatus, safeStatus ? safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1) : "Pending");
  }

  function getStatusNote(result) {
    var safeStatus = clean(result && result.status || "pending").toLowerCase();
    if (safeStatus === "approved") {
      return t("test_registration_status_approved_note", "Your registration is approved. You can now log in to the online test portal.");
    }
    if (safeStatus === "inactive") {
      return t("test_registration_status_inactive_note", "Your student access is inactive right now. Please contact Vision Academy.");
    }
    if (safeStatus === "rejected") {
      return t("test_registration_status_rejected_note", "Your registration is currently rejected. Please contact Vision Academy.");
    }
    return t("test_registration_status_pending_note", "Your registration is pending admin approval after payment verification.");
  }

  function setLookupValue(id, value) {
    var element = byId(id);
    if (element) {
      element.textContent = clean(value) || "-";
    }
  }

  function saveLookupState() {
    try {
      window.localStorage.setItem(LOOKUP_STORAGE_KEY, JSON.stringify({
        result: pageState.lastLookupResult,
        query: pageState.lastLookupQuery
      }));
    } catch (error) {
      console.warn(error);
    }
  }

  function loadLookupState() {
    try {
      return JSON.parse(window.localStorage.getItem(LOOKUP_STORAGE_KEY) || "null");
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  function renderLookupResult(result) {
    var card = byId("testRegistrationStatusResult");
    var pill = byId("registrationStatusPill");
    var loginLink = byId("registrationStatusLoginLink");

    pageState.lastLookupResult = result && result.found ? Object.assign({}, result) : null;
    saveLookupState();

    if (!card || !pill) {
      return;
    }

    if (!result || !result.found) {
      card.classList.add("hidden");
      return;
    }

    var safeStatus = clean(result.status || "pending").toLowerCase();
    pill.className = "status-pill status-pill-" + safeStatus;
    pill.textContent = getStatusLabel(safeStatus);

    setLookupValue("registrationStatusName", result.displayName);
    setLookupValue("registrationStatusLogin", result.loginName);
    setLookupValue("registrationStatusBatch", result.batchName);
    setLookupValue("registrationStatusLanguage", getLanguageLabel(result.language));
    setLookupValue("registrationStatusNote", getStatusNote(result) || clean(result.message));

    if (loginLink) {
      loginLink.classList.toggle("hidden", safeStatus !== "approved");
    }

    card.classList.remove("hidden");
  }

  function normalizeLookupQuery(payload) {
    var safe = payload && typeof payload === "object" ? payload : {};
    return {
      loginName: clean(safe.loginName),
      mobile: clean(safe.mobile)
    };
  }

  function syncLookupForm(lookupForm, payload) {
    if (!lookupForm || !payload) {
      return;
    }
    lookupForm.elements.loginName.value = clean(payload.loginName);
    lookupForm.elements.mobile.value = clean(payload.mobile);
  }

  async function runLookup(lookupForm, payload, toneOnMissing) {
    var query = normalizeLookupQuery(payload);
    if (!query.loginName || !query.mobile) {
      setLookupStatus(t("status_fill_required", "Please fill all required fields."), "error");
      renderLookupResult(null);
      return null;
    }

    pageState.lastLookupQuery = query;
    saveLookupState();
    setLookupStatus(t("test_registration_status_checking", "Checking registration status..."), null);

    try {
      var result = await window.VisionTestApi.getRegistrationStatus(query);
      if (!result || !result.found) {
        renderLookupResult(null);
        setLookupStatus(clean(result && result.message) || t("test_registration_status_not_found", "No registration was found for this login name and mobile number yet."), toneOnMissing ? "error" : null);
        return result || null;
      }
      renderLookupResult(result);
      setLookupStatus("", null);
      return result;
    } catch (error) {
      renderLookupResult(null);
      setLookupStatus(error && error.message ? error.message : t("test_registration_status_unavailable", "Unable to check registration status right now."), "error");
      return null;
    }
  }

  async function validateAvailability(form, showSuccessMessage) {
    if (!window.VisionTestApi || typeof window.VisionTestApi.checkRegistrationAvailability !== "function") {
      return true;
    }

    var payload = {
      loginName: clean(form.elements.loginName.value),
      mobile: clean(form.elements.mobile.value)
    };

    if (!payload.loginName && !payload.mobile) {
      return true;
    }

    try {
      var result = await window.VisionTestApi.checkRegistrationAvailability(payload);
      if (result && result.isAvailable === false) {
        setRegistrationStatus(clean(result.message) || t("test_registration_duplicate", "This registration already exists."), "error");
        return false;
      }
      if (showSuccessMessage && payload.loginName && payload.mobile && !(result && result.skipped)) {
        setRegistrationStatus(t("test_registration_available", "This login name and mobile number are available."), "success");
      }
      return true;
    } catch (error) {
      if (showSuccessMessage) {
        setRegistrationStatus(error && error.message ? error.message : t("test_registration_failed", "Unable to submit test registration right now."), "error");
      }
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearElement = byId("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    var form = byId("testRegistrationForm");
    var lookupForm = byId("testRegistrationStatusForm");
    if (!window.VisionTestApi) {
      return;
    }

    if (lookupForm) {
      lookupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        await runLookup(lookupForm, {
          loginName: lookupForm.elements.loginName.value,
          mobile: lookupForm.elements.mobile.value
        }, false);
      });
    }

    if (form) {
      ["loginName", "mobile"].forEach(function (fieldName) {
        var field = form.elements[fieldName];
        if (!field) {
          return;
        }
        field.addEventListener("blur", function () {
          validateAvailability(form, Boolean(clean(form.elements.loginName.value) && clean(form.elements.mobile.value)));
        });
      });
    }

    var savedState = loadLookupState();
    if (savedState && lookupForm) {
      pageState.lastLookupQuery = normalizeLookupQuery(savedState.query);
      syncLookupForm(lookupForm, pageState.lastLookupQuery);
      if (savedState.result && savedState.result.found) {
        renderLookupResult(savedState.result);
      }
    }

    if (!form) {
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
        batchName: clean(form.elements.batchName.value)
      };

      if (!payload.displayName || !payload.loginName || !payload.password || !payload.mobile) {
        setRegistrationStatus(t("status_fill_required", "Please fill all required fields."), "error");
        return;
      }

      if (!(await validateAvailability(form, false))) {
        return;
      }

      try {
        await window.VisionTestApi.registerStudent(payload);
        setRegistrationStatus(t("test_registration_success"), "success");
        if (lookupForm) {
          syncLookupForm(lookupForm, payload);
          await runLookup(lookupForm, payload, false);
        }
        form.reset();
      } catch (error) {
        setRegistrationStatus(error && error.message ? error.message : t("test_registration_failed", "Unable to submit test registration right now."), "error");
      }
    });

    window.addEventListener("vision-language-changed", function () {
      if (pageState.lastLookupResult) {
        renderLookupResult(pageState.lastLookupResult);
      }
    });
  });
})();
