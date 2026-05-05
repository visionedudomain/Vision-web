(function () {
  "use strict";

  var FIXED_TOTAL_FEE = 800;

  function t(key, fallback) {
    return window.VisionTestI18n && typeof window.VisionTestI18n.t === "function"
      ? window.VisionTestI18n.t(key, fallback)
      : (fallback || key);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character] || character;
    });
  }

  function setStatus(id, message, isError) {
    var element = byId(id);
    if (!element) {
      return;
    }
    element.textContent = message || "";
    element.classList.remove("status-success", "status-error");
    if (message) {
      element.classList.add(isError ? "status-error" : "status-success");
    }
  }

  function normalizeAmount(value) {
    var amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      return 0;
    }
    return Math.round(amount * 100) / 100;
  }

  function formatMoney(value) {
    var amount = normalizeAmount(value);
    var hasDecimals = Math.abs(amount % 1) > 0;
    return "Rs. " + amount.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  function deriveFeeStatus(totalAmount, paidAmount) {
    var total = normalizeAmount(totalAmount);
    var paid = normalizeAmount(paidAmount);
    if (total > 0 && paid >= total) {
      return "paid";
    }
    return "unpaid";
  }

  function getFeeStatusLabel(status) {
    var safeStatus = clean(status).toLowerCase() || "unpaid";
    var fallback = {
      paid: "Paid",
      unpaid: "Not Paid",
      not_set: "Not Paid"
    };
    return t("test_fees_status_" + safeStatus, fallback[safeStatus] || "Not Set");
  }

  function normalizeFeeRecord(value) {
    var safe = value && typeof value === "object" ? value : {};
    var status = clean(safe.status).toLowerCase() === "paid" ? "paid" : deriveFeeStatus(FIXED_TOTAL_FEE, safe.paidAmount);
    var paidAmount = status === "paid" ? FIXED_TOTAL_FEE : 0;
    return {
      totalAmount: FIXED_TOTAL_FEE,
      paidAmount: paidAmount,
      dueAmount: Math.max(FIXED_TOTAL_FEE - paidAmount, 0),
      status: status,
      lastPaidAt: status === "paid" ? clean(safe.lastPaidAt) : "",
      notes: clean(safe.notes)
    };
  }

  function getRewriteStatusLabel(status) {
    var safeStatus = clean(status).toLowerCase() || "pending";
    if (safeStatus === "approved") {
      return t("test_status_approved", "Approved");
    }
    if (safeStatus === "rejected") {
      return t("test_status_rejected", "Rejected");
    }
    return t("test_status_pending", "Pending");
  }

  function getRewriteErrorMessage(error, fallback) {
    var message = clean(error && error.message) || clean(fallback);
    var backendBaseUrl = window.VisionTestApi && typeof window.VisionTestApi.getBackendBaseUrl === "function"
      ? clean(window.VisionTestApi.getBackendBaseUrl())
      : "";
    var isLocalBackend = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(backendBaseUrl);

    if (/usage exceeded/i.test(message)) {
      return t(
        "test_rewrite_backend_usage_exceeded",
        "The hosted rewrite backend is temporarily unavailable. Please try again later or publish the latest Firestore rules."
      );
    }

    if (/missing or insufficient permissions/i.test(message)) {
      if (isLocalBackend) {
        return t(
          "test_rewrite_permissions_localhost",
          "Approve/Reject will not work from this localhost page until you either publish the latest Firestore rules or run the Netlify backend locally."
        );
      }
      return t(
        "test_rewrite_permissions_help",
        "Rewrite approval needs the latest Firestore rules or the Netlify admin backend."
      );
    }

    if (clean(error && error.code) === "REWRITE_ADMIN_PERMISSION_BLOCKED") {
      if (isLocalBackend) {
        return t(
          "test_rewrite_permissions_localhost",
          "Approve/Reject will not work from this localhost page until you either publish the latest Firestore rules or run the Netlify backend locally."
        );
      }
      return t(
        "test_rewrite_permissions_help",
        "Rewrite approval needs the latest Firestore rules or the Netlify admin backend."
      );
    }

    return message || clean(fallback) || "Unable to process rewrite request.";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.VisionTestStore) {
      return;
    }

    await window.VisionTestStore.ready();

    var feeForm = byId("feeManagementForm");
    var feeStudentsTableBody = byId("feesStudentsTableBody");
    var feeStudentSelect = byId("feeStudentSelect");
    var feeDueAmount = byId("feeDueAmount");
    var feeStatusSelect = byId("feeStatusSelect");
    var clearFeeFormButton = byId("clearFeeForm");
    var rewriteBody = byId("testRewriteRequestsBody");

    var students = [];

    function getSelectedStudent() {
      var studentId = clean(feeStudentSelect && feeStudentSelect.value);
      return students.find(function (student) {
        return student.id === studentId;
      }) || null;
    }

    function populateFeeStudentSelect() {
      if (!feeStudentSelect) {
        return;
      }
      var selectedValue = feeStudentSelect.value;
      feeStudentSelect.innerHTML = "";
      feeStudentSelect.appendChild(new Option(t("test_fees_select_student_placeholder", "Select a student"), ""));
      students.forEach(function (student) {
        var optionLabel = clean(student.displayName) || clean(student.loginName) || student.id;
        if (clean(student.batchName)) {
          optionLabel += " - " + student.batchName;
        }
        feeStudentSelect.appendChild(new Option(optionLabel, student.id));
      });
      feeStudentSelect.value = selectedValue && feeStudentSelect.querySelector("option[value='" + selectedValue + "']") ? selectedValue : "";
    }

    function syncFeePreview() {
      if (!feeForm || !feeDueAmount || !feeStatusSelect) {
        return;
      }
      var totalAmount = FIXED_TOTAL_FEE;
      var status = clean(feeForm.elements.status.value).toLowerCase() === "paid" ? "paid" : "unpaid";
      var paidAmount = status === "paid" ? totalAmount : 0;
      var dueAmount = Math.max(totalAmount - paidAmount, 0);
      feeForm.elements.totalAmount.value = String(totalAmount);
      feeForm.elements.paidAmount.value = String(paidAmount);
      feeDueAmount.value = formatMoney(dueAmount);
      if (status !== "paid") {
        feeForm.elements.lastPaidAt.value = "";
      }
    }

    function applyFeeDetails(studentId) {
      if (!feeForm) {
        return;
      }
      var student = students.find(function (entry) {
        return entry.id === clean(studentId);
      });
      var fee = normalizeFeeRecord(student && student.fee);
      feeForm.elements.studentId.value = student ? student.id : "";
      feeForm.elements.totalAmount.value = String(FIXED_TOTAL_FEE);
      feeForm.elements.status.value = fee.status;
      feeForm.elements.paidAmount.value = String(fee.paidAmount);
      feeForm.elements.lastPaidAt.value = clean(fee.lastPaidAt);
      feeForm.elements.notes.value = clean(fee.notes);
      syncFeePreview();
    }

    function resetFeeForm() {
      if (!feeForm) {
        return;
      }
      feeForm.reset();
      feeForm.elements.totalAmount.value = String(FIXED_TOTAL_FEE);
      feeForm.elements.status.value = "unpaid";
      feeForm.elements.paidAmount.value = "0";
      syncFeePreview();
      setStatus("feesStatus", "", false);
    }

    function renderFeeSummary() {
      var summary = students.reduce(function (result, student) {
        var fee = normalizeFeeRecord(student && student.fee);
        var totalAmount = normalizeAmount(fee.totalAmount);
        var paidAmount = normalizeAmount(fee.paidAmount);
        var dueAmount = Math.max(totalAmount - paidAmount, 0);
        var status = fee.status;
        result.students += 1;
        result.collected += paidAmount;
        result.outstanding += dueAmount;
        if (status === "paid") {
          result.paid += 1;
        }
        return result;
      }, {
        students: 0,
        paid: 0,
        collected: 0,
        outstanding: 0
      });

      if (byId("feesSummaryStudents")) {
        byId("feesSummaryStudents").textContent = String(summary.students);
      }
      if (byId("feesSummaryPaid")) {
        byId("feesSummaryPaid").textContent = String(summary.paid);
      }
      if (byId("feesSummaryCollected")) {
        byId("feesSummaryCollected").textContent = formatMoney(summary.collected);
      }
      if (byId("feesSummaryDue")) {
        byId("feesSummaryDue").textContent = formatMoney(summary.outstanding);
      }
    }

    function renderFeesTable() {
      if (!feeStudentsTableBody) {
        return;
      }
      feeStudentsTableBody.innerHTML = "";
      if (!students.length) {
        feeStudentsTableBody.innerHTML = "<tr><td colspan='9'>" + escapeHtml(t("test_fees_empty", "No approved students available for fee tracking yet.")) + "</td></tr>";
        return;
      }
      students.forEach(function (student) {
        var fee = normalizeFeeRecord(student && student.fee);
        var status = fee.status;
        var row = document.createElement("tr");
        row.innerHTML = "" +
          "<td>" + escapeHtml(student.displayName || "-") + "</td>" +
          "<td>" + escapeHtml(student.loginName || "-") + "</td>" +
          "<td>" + escapeHtml(student.batchName || "-") + "</td>" +
          "<td>" + escapeHtml(formatMoney(fee.totalAmount)) + "</td>" +
          "<td>" + escapeHtml(formatMoney(fee.paidAmount)) + "</td>" +
          "<td>" + escapeHtml(formatMoney(fee.dueAmount)) + "</td>" +
          "<td><span class='status-pill status-pill-" + escapeHtml(status) + "'>" + escapeHtml(getFeeStatusLabel(status)) + "</span></td>" +
          "<td>" + escapeHtml(clean(fee.lastPaidAt) || "-") + "</td>" +
          "<td><button type='button' class='btn btn-outline btn-small' data-fee-edit='" + escapeHtml(student.id) + "'>" + escapeHtml(t("test_fees_edit", "Edit Fee")) + "</button></td>";
        feeStudentsTableBody.appendChild(row);
      });
    }

    async function refreshRewriteRequests() {
      if (!rewriteBody) {
        return;
      }
      try {
        var requests = await window.VisionTestStore.getRewriteRequests();
        rewriteBody.innerHTML = "";
        if (!Array.isArray(requests) || !requests.length) {
          rewriteBody.innerHTML = "<tr><td colspan='6'>" + escapeHtml(t("test_rewrite_no_requests", "No pending rewrite requests.")) + "</td></tr>";
          return;
        }
        requests.forEach(function (request) {
          var row = document.createElement("tr");
          row.innerHTML = "" +
            "<td>" + escapeHtml(request.studentName || "-") + "</td>" +
            "<td>" + escapeHtml(request.testTitle || "-") + "</td>" +
            "<td>" + escapeHtml(request.score || "-") + "</td>" +
            "<td>" + escapeHtml(window.VisionTestStore.formatDateTime(request.requestedAt)) + "</td>" +
            "<td><span class='status-pill status-pill-" + escapeHtml(request.status || "pending") + "'>" + escapeHtml(getRewriteStatusLabel(request.status)) + "</span></td>" +
            "<td><div class='table-actions'>" +
              (request.status === "pending"
                ? "<button type='button' class='btn btn-primary btn-small' data-rewrite-action='approve' data-rewrite-id='" + escapeHtml(request.id) + "'>" + escapeHtml(t("test_btn_approve_rewrite", "Approve Rewrite")) + "</button>" +
                  "<button type='button' class='btn btn-danger btn-small' data-rewrite-action='reject' data-rewrite-id='" + escapeHtml(request.id) + "'>" + escapeHtml(t("test_btn_reject_rewrite", "Reject Rewrite")) + "</button>"
                : "<span class='table-subtext'>" + escapeHtml(clean(request.reviewedBy) || "-") + "</span>") +
            "</div></td>";
          rewriteBody.appendChild(row);
        });
      } catch (error) {
        setStatus("testRewriteStatus", getRewriteErrorMessage(error, "Unable to load rewrite requests."), true);
      }
    }

    window.VisionTestStore.subscribeStudents(function (items) {
      students = Array.isArray(items) ? items.slice() : [];
      populateFeeStudentSelect();
      renderFeeSummary();
      renderFeesTable();
      syncFeePreview();
    });

    window.VisionTestStore.subscribeAttempts(function () {
      refreshRewriteRequests();
    });

    if (rewriteBody) {
      rewriteBody.addEventListener("click", async function (event) {
        var button = event.target.closest("button[data-rewrite-action]");
        if (!button) {
          return;
        }
        var requestId = clean(button.getAttribute("data-rewrite-id"));
        var action = clean(button.getAttribute("data-rewrite-action"));
        if (!requestId || !action) {
          return;
        }
        try {
          button.disabled = true;
          setStatus("testRewriteStatus", "", false);
          if (action === "approve") {
            await window.VisionTestApi.approveRewrite({ requestId: requestId });
            setStatus("testRewriteStatus", t("test_rewrite_approved_message", "Retest request approved successfully."), false);
          } else {
            await window.VisionTestApi.rejectRewrite({ requestId: requestId });
            setStatus("testRewriteStatus", t("test_rewrite_rejected_message", "Retest request rejected."), false);
          }
          await refreshRewriteRequests();
        } catch (error) {
          setStatus("testRewriteStatus", getRewriteErrorMessage(error, "Unable to process rewrite request."), true);
        } finally {
          button.disabled = false;
        }
      });
    }

    if (feeStudentSelect) {
      feeStudentSelect.addEventListener("change", function () {
        applyFeeDetails(feeStudentSelect.value);
      });
    }

    if (feeForm) {
      feeForm.elements.status.addEventListener("change", syncFeePreview);

      feeForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var selectedStudent = getSelectedStudent();
        if (!selectedStudent) {
          setStatus("feesStatus", t("test_fees_choose_student", "Choose a student before saving fee details."), true);
          return;
        }
        try {
          var status = clean(feeForm.elements.status.value).toLowerCase() === "paid" ? "paid" : "unpaid";
          await window.VisionTestStore.saveStudentFee({
            studentId: selectedStudent.id,
            totalAmount: FIXED_TOTAL_FEE,
            paidAmount: status === "paid" ? FIXED_TOTAL_FEE : 0,
            status: status,
            lastPaidAt: feeForm.elements.lastPaidAt.value,
            notes: feeForm.elements.notes.value
          });
          setStatus("feesStatus", t("test_fees_saved", "Fee details saved successfully."), false);
          applyFeeDetails(selectedStudent.id);
        } catch (error) {
          setStatus("feesStatus", error && error.message ? error.message : "Unable to save fee details.", true);
        }
      });
    }

    if (clearFeeFormButton) {
      clearFeeFormButton.addEventListener("click", resetFeeForm);
    }

    if (feeStudentsTableBody) {
      feeStudentsTableBody.addEventListener("click", function (event) {
        var button = event.target.closest("button[data-fee-edit]");
        if (!button) {
          return;
        }
        applyFeeDetails(button.getAttribute("data-fee-edit"));
        if (feeForm) {
          feeForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    window.addEventListener("vision-language-changed", function () {
      renderFeeSummary();
      renderFeesTable();
      refreshRewriteRequests();
      syncFeePreview();
    });

    if (feeForm) {
      feeForm.elements.totalAmount.value = String(FIXED_TOTAL_FEE);
      feeForm.elements.status.value = "unpaid";
      feeForm.elements.paidAmount.value = "0";
    }
    syncFeePreview();
    refreshRewriteRequests();
  });
})();
