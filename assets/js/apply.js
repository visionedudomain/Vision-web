(function () {
  "use strict";

  function t(key, fallback) {
    if (window.VisionI18n && typeof window.VisionI18n.t === "function") {
      return window.VisionI18n.t(key);
    }
    return fallback || key;
  }

  function setStatus(message, isError) {
    var status = document.getElementById("applyStatus");
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.remove("status-success", "status-error");
    status.classList.add(isError ? "status-error" : "status-success");
  }

  function clean(value) {
    return (value || "").toString().trim();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }

    var form = document.getElementById("applicationForm");
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var candidateName = clean(formData.get("candidateName"));
      var fatherName = clean(formData.get("fatherName"));
      var motherName = clean(formData.get("motherName"));
      var dob = clean(formData.get("dob"));
      var gender = clean(formData.get("gender"));
      var qualification = clean(formData.get("qualification"));
      var religion = clean(formData.get("religion"));
      var category = clean(formData.get("category"));
      var mobile = clean(formData.get("mobile"));
      var address = clean(formData.get("address"));

      if (!candidateName || !fatherName || !dob || !gender || !qualification || !category || !mobile || !address) {
        setStatus(t("status_fill_required", "Please fill all required fields."), true);
        return;
      }

      var application = {
        id: "app_" + Date.now(),
        candidateName: candidateName,
        fatherName: fatherName,
        motherName: motherName,
        dob: dob,
        gender: gender,
        qualification: qualification,
        religion: religion,
        category: category,
        mobile: mobile,
        address: address,
        submittedAt: new Date().toISOString()
      };

      VisionStore.addApplication(application);
      form.reset();
      setStatus(t("status_apply_success", "Application submitted successfully. Admin can now view it."), false);
    });
  });
})();
