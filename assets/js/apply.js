(function () {
  "use strict";

  function t(key, fallback) {
    if (window.VisionI18n && typeof window.VisionI18n.t === "function") {
      return window.VisionI18n.t(key);
    }
    return fallback || key;
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function setStatus(message, isError) {
    var status = document.getElementById("applyStatus");
    if (!status) {
      return;
    }
    status.textContent = message || "";
    status.classList.remove("status-success", "status-error");
    if (message) {
      status.classList.add(isError ? "status-error" : "status-success");
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    await VisionStore.ready();

    var form = document.getElementById("applicationForm");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var application = {
        candidateName: clean(formData.get("candidateName")),
        fatherName: clean(formData.get("fatherName")),
        motherName: clean(formData.get("motherName")),
        dob: clean(formData.get("dob")),
        gender: clean(formData.get("gender")),
        qualification: clean(formData.get("qualification")),
        religion: clean(formData.get("religion")),
        category: clean(formData.get("category")),
        mobile: clean(formData.get("mobile")),
        address: clean(formData.get("address"))
      };

      if (!application.candidateName || !application.fatherName || !application.dob || !application.gender || !application.qualification || !application.category || !application.mobile || !application.address) {
        setStatus(t("status_fill_required", "Please fill all required fields."), true);
        return;
      }

      try {
        await VisionStore.addApplication(application);
        form.reset();
        setStatus(t("status_apply_success", "Application submitted successfully. Admin can now view it."), false);
      } catch (error) {
        setStatus(error && error.message ? error.message : "Unable to submit the application right now.", true);
      }
    });
  });
})();
