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

  function getStatusLabel(status) {
    var key = "test_status_" + clean(status || "draft").replace(/[^a-z_]+/g, "_");
    var translated = t(key, "");
    return translated || clean(status || "draft");
  }

  function csvCell(value) {
    var text = String(value || "");
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function downloadTextFile(fileName, content, contentType) {
    var blob = new Blob([content], { type: contentType || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function parseCsvLine(line) {
    var cells = [];
    var current = "";
    var inQuotes = false;
    var index;
    for (index = 0; index < line.length; index += 1) {
      var char = line.charAt(index);
      if (char === '"') {
        if (inQuotes && line.charAt(index + 1) === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells.map(function (cell) {
      return clean(cell);
    });
  }

  function parseCsvRows(text) {
    return String(text || "").split(/\r?\n/).map(function (line) {
      return line.trim();
    }).filter(Boolean).map(parseCsvLine);
  }

  function toLocalDateTimeValue(value) {
    if (!value) {
      return "";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    var pad = function (part) {
      return String(part).padStart(2, "0");
    };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function fromLocalDateTimeValue(value) {
    var text = clean(value);
    if (!text) {
      return "";
    }
    var date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function getDefaultQuestion(index) {
    return {
      id: "question_" + String(index + 1),
      prompt: "",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" }
      ],
      correctOptionId: "a"
    };
  }

  function formatQuestionRow(question, index) {
    return "" +
      "<article class='question-editor-card'>" +
        "<div class='row-between question-editor-head'>" +
          "<h3>" + t("test_template_question") + " " + String(index + 1) + "</h3>" +
          "<button type='button' class='btn btn-danger btn-small' data-remove-question='" + index + "'>" + t("test_btn_remove_question") + "</button>" +
        "</div>" +
        "<label><span>" + t("test_label_question_prompt") + "</span><textarea rows='2' data-question-index='" + index + "' data-question-field='prompt'>" + (question.prompt || "") + "</textarea></label>" +
        "<div class='question-option-grid'>" +
          ["a", "b", "c", "d"].map(function (optionId, optionIndex) {
            var label = t("test_label_option_" + optionId);
            var option = question.options[optionIndex] || { id: optionId, text: "" };
            return "<label><span>" + label + "</span><input type='text' data-question-index='" + index + "' data-question-field='option-" + optionId + "' value='" + (option.text || "") + "'></label>";
          }).join("") +
        "</div>" +
        "<label><span>" + t("test_label_correct_option") + "</span>" +
          "<select data-question-index='" + index + "' data-question-field='correct'>" +
            ["a", "b", "c", "d"].map(function (optionId) {
              return "<option value='" + optionId + "' " + (question.correctOptionId === optionId ? "selected" : "") + ">" + optionId.toUpperCase() + "</option>";
            }).join("") +
          "</select>" +
        "</label>" +
      "</article>";
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.VisionTestStore || !window.VisionTestApi) {
      return;
    }

    await window.VisionTestStore.ready();

    var registrationsBody = byId("testRegistrationsTableBody");
    var studentsBody = byId("testStudentsTableBody");
    var testsBody = byId("testAdminTestsTableBody");
    var attemptsBody = byId("testAttemptsTableBody");
    var exportRegistrationsButton = byId("exportTestRegistrations");
    var approvalCsvInput = byId("approvalCsvInput");
    var downloadApprovalTemplateButton = byId("downloadApprovalTemplate");
    var exportResultsButton = byId("exportTestResults");
    var studentApprovalForm = byId("studentApprovalForm");
    var testBuilderForm = byId("testBuilderForm");
    var addQuestionButton = byId("addQuestionButton");
    var resetBuilderButton = byId("resetTestBuilder");
    var questionBuilderList = byId("questionBuilderList");
    var testCsvInput = byId("testCsvInput");
    var downloadTestCsvTemplate = byId("downloadTestCsvTemplate");

    var registrations = [];
    var students = [];
    var tests = [];
    var attempts = [];
    var builderQuestions = [getDefaultQuestion(0)];

    function populateRegistrationSelect() {
      var select = studentApprovalForm ? studentApprovalForm.elements.registrationId : null;
      if (!select) {
        return;
      }
      var currentValue = select.value;
      select.innerHTML = "";
      select.appendChild(new Option(t("test_select_registration"), ""));
      registrations.filter(function (registration) {
        return registration.status === "pending";
      }).forEach(function (registration) {
        select.appendChild(new Option(registration.displayName + " - " + registration.loginName, registration.id));
      });
      select.value = currentValue && select.querySelector("option[value='" + currentValue + "']") ? currentValue : "";
    }

    function renderRegistrations() {
      if (!registrationsBody) {
        return;
      }
      registrationsBody.innerHTML = "";
      if (!registrations.length) {
        registrationsBody.innerHTML = "<tr><td colspan='7'>" + t("test_students_empty") + "</td></tr>";
        return;
      }
      registrations.forEach(function (registration) {
        var row = document.createElement("tr");
        row.innerHTML = "" +
          "<td>" + (registration.displayName || "-") + "</td>" +
          "<td>" + (registration.loginName || "-") + "</td>" +
          "<td>" + (registration.mobile || "-") + "</td>" +
          "<td>" + (registration.batchName || "-") + "</td>" +
          "<td>" + (registration.examName || "-") + "</td>" +
          "<td><span class='status-pill status-pill-" + (registration.status || "draft") + "'>" + getStatusLabel(registration.status || "pending") + "</span></td>" +
          "<td><div class='table-actions'>" +
            (registration.status === "pending"
              ? "<button type='button' class='btn btn-primary btn-small' data-approve-registration='" + registration.id + "'>" + t("test_btn_approve_student") + "</button>"
              : "<span class='table-subtext'>" + window.VisionTestStore.formatDateTime(registration.approvedAt || registration.updatedAt || registration.createdAt) + "</span>") +
          "</div></td>";
        registrationsBody.appendChild(row);
      });
    }

    function renderStudents() {
      if (!studentsBody) {
        return;
      }
      studentsBody.innerHTML = "";
      if (!students.length) {
        studentsBody.innerHTML = "<tr><td colspan='7'>" + t("test_students_empty") + "</td></tr>";
        return;
      }
      students.forEach(function (student) {
        var row = document.createElement("tr");
        row.innerHTML = "" +
          "<td>" + (student.displayName || "-") + "</td>" +
          "<td>" + (student.loginName || "-") + "</td>" +
          "<td>" + (student.mobile || "-") + "</td>" +
          "<td>" + (student.batchName || "-") + "</td>" +
          "<td>" + (student.language === "ta" ? t("test_language_tamil") : t("test_language_english")) + "</td>" +
          "<td><span class='status-pill status-pill-" + (student.status || "draft") + "'>" + getStatusLabel(student.status || "approved") + "</span></td>" +
          "<td><div class='table-actions'>" +
            "<button type='button' class='btn btn-outline btn-small' data-reset-student-password='" + student.id + "'>" + t("test_btn_reset_password") + "</button>" +
            "<button type='button' class='btn " + (student.status === "inactive" ? "btn-primary" : "btn-danger") + " btn-small' data-update-student-status='" + student.id + "' data-next-status='" + (student.status === "inactive" ? "approved" : "inactive") + "'>" + (student.status === "inactive" ? t("test_btn_activate") : t("test_btn_deactivate")) + "</button>" +
          "</div></td>";
        studentsBody.appendChild(row);
      });
    }

    function renderQuestions() {
      if (!questionBuilderList) {
        return;
      }
      questionBuilderList.innerHTML = builderQuestions.map(formatQuestionRow).join("");
    }

    function renderTests() {
      if (!testsBody) {
        return;
      }
      testsBody.innerHTML = "";
      if (!tests.length) {
        testsBody.innerHTML = "<tr><td colspan='6'>" + t("test_tests_empty") + "</td></tr>";
        return;
      }
      tests.forEach(function (test) {
        var row = document.createElement("tr");
        row.innerHTML = "" +
          "<td>" + (test.title || "-") + "</td>" +
          "<td>" + window.VisionTestStore.formatDateTime(test.opensAt) + "<br>" + window.VisionTestStore.formatDateTime(test.closesAt) + "</td>" +
          "<td>" + (test.durationMinutes || 0) + " min</td>" +
          "<td>" + (test.questionCount || 0) + "</td>" +
          "<td><span class='status-pill status-pill-" + (test.status || "draft") + "'>" + getStatusLabel(test.status || "draft") + "</span></td>" +
          "<td><div class='table-actions'>" +
            "<button type='button' class='btn btn-outline btn-small' data-test-edit='" + test.id + "'>" + t("test_btn_edit") + "</button>" +
            "<button type='button' class='btn btn-primary btn-small' data-test-publish='" + test.id + "'>" + t("test_btn_publish") + "</button>" +
            "<button type='button' class='btn btn-outline btn-small' data-test-close='" + test.id + "'>" + t("test_btn_close") + "</button>" +
            "<button type='button' class='btn btn-danger btn-small' data-test-delete='" + test.id + "'>" + t("test_btn_delete") + "</button>" +
          "</div></td>";
        testsBody.appendChild(row);
      });
    }

    function renderAttempts() {
      if (!attemptsBody) {
        return;
      }
      attemptsBody.innerHTML = "";
      if (!attempts.length) {
        attemptsBody.innerHTML = "<tr><td colspan='7'>" + t("test_results_empty") + "</td></tr>";
        return;
      }
      attempts.forEach(function (attempt) {
        var row = document.createElement("tr");
        row.innerHTML = "" +
          "<td>" + (attempt.studentDisplayName || "-") + "<br><span class='table-subtext'>" + (attempt.studentLoginName || "-") + "</span></td>" +
          "<td>" + (attempt.testTitle || "-") + "</td>" +
          "<td>" + window.VisionTestStore.formatDateTime(attempt.startedAt) + "</td>" +
          "<td>" + window.VisionTestStore.formatDateTime(attempt.submittedAt) + "</td>" +
          "<td>" + String(attempt.score || 0) + " / " + String(attempt.totalQuestions || 0) + "</td>" +
          "<td>" + String(attempt.answeredCount || 0) + "</td>" +
          "<td><span class='status-pill status-pill-" + (attempt.status || "draft") + "'>" + getStatusLabel(attempt.status || "started") + "</span></td>";
        attemptsBody.appendChild(row);
      });
    }

    function applyRegistrationToForm(registrationId) {
      if (!studentApprovalForm) {
        return;
      }
      var registration = registrations.find(function (item) {
        return item.id === registrationId;
      });
      if (!registration) {
        return;
      }
      if (!clean(studentApprovalForm.elements.loginName.value)) {
        studentApprovalForm.elements.loginName.value = registration.loginName || "";
      }
      studentApprovalForm.elements.language.value = registration.language || "en";
      studentApprovalForm.elements.batchName.value = registration.batchName || "";
      studentApprovalForm.elements.examName.value = registration.examName || "";
    }

    function resetBuilder() {
      if (testBuilderForm) {
        testBuilderForm.reset();
      }
      var testIdInput = byId("testBuilderId");
      if (testIdInput) {
        testIdInput.value = "";
      }
      builderQuestions = [getDefaultQuestion(0)];
      renderQuestions();
    }

    function loadTestIntoBuilder(testId) {
      var test = tests.find(function (item) { return item.id === testId; });
      if (!test || !testBuilderForm) {
        return;
      }
      byId("testBuilderId").value = test.id;
      testBuilderForm.elements.title.value = test.title || "";
      testBuilderForm.elements.language.value = test.language || "en";
      testBuilderForm.elements.opensAt.value = toLocalDateTimeValue(test.opensAt);
      testBuilderForm.elements.closesAt.value = toLocalDateTimeValue(test.closesAt);
      testBuilderForm.elements.durationMinutes.value = test.durationMinutes || 60;
      builderQuestions = (test.questions || []).map(function (question, index) {
        return {
          id: question.id || ("question_" + String(index + 1)),
          prompt: question.prompt,
          options: ["a", "b", "c", "d"].map(function (optionId) {
            var option = (question.options || []).find(function (entry) { return entry.id === optionId; });
            return {
              id: optionId,
              text: option ? option.text : ""
            };
          }),
          correctOptionId: question.correctOptionId || "a"
        };
      });
      renderQuestions();
    }

    window.VisionTestStore.subscribeRegistrations(function (items) {
      registrations = Array.isArray(items) ? items.slice() : [];
      populateRegistrationSelect();
      renderRegistrations();
    });

    window.VisionTestStore.subscribeStudents(function (items) {
      students = Array.isArray(items) ? items.slice() : [];
      renderStudents();
    });

    window.VisionTestStore.subscribeTests(function (items) {
      tests = Array.isArray(items) ? items.slice() : [];
      renderTests();
    });

    window.VisionTestStore.subscribeAttempts(function (items) {
      attempts = Array.isArray(items) ? items.slice() : [];
      renderAttempts();
    });

    if (studentApprovalForm) {
      studentApprovalForm.elements.registrationId.addEventListener("change", function () {
        applyRegistrationToForm(clean(studentApprovalForm.elements.registrationId.value));
      });

      studentApprovalForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
          await window.VisionTestApi.approveStudent({
            registrationId: clean(studentApprovalForm.elements.registrationId.value),
            loginName: clean(studentApprovalForm.elements.loginName.value),
            language: clean(studentApprovalForm.elements.language.value),
            batchName: clean(studentApprovalForm.elements.batchName.value),
            examName: clean(studentApprovalForm.elements.examName.value)
          });
          studentApprovalForm.reset();
          setStatus("testRegistrationsStatus", t("test_status_student_approved"), false);
        } catch (error) {
          setStatus("testRegistrationsStatus", error && error.message ? error.message : "Unable to approve student.", true);
        }
      });
    }

    if (registrationsBody) {
      registrationsBody.addEventListener("click", async function (event) {
        var approveButton = event.target.closest("button[data-approve-registration]");
        if (!approveButton) {
          return;
        }
        try {
          var selectedRegistrationId = approveButton.getAttribute("data-approve-registration");
          studentApprovalForm.elements.registrationId.value = selectedRegistrationId;
          applyRegistrationToForm(selectedRegistrationId);
          await window.VisionTestApi.approveStudent({
            registrationId: selectedRegistrationId
          });
          setStatus("testRegistrationsStatus", t("test_status_student_approved"), false);
        } catch (error) {
          setStatus("testRegistrationsStatus", error && error.message ? error.message : "Unable to approve registration.", true);
        }
      });
    }

    if (studentsBody) {
      studentsBody.addEventListener("click", async function (event) {
        var resetButton = event.target.closest("button[data-reset-student-password]");
        var statusButton = event.target.closest("button[data-update-student-status]");
        if (resetButton) {
          var newPassword = window.prompt(t("test_prompt_new_password"));
          if (!newPassword) {
            return;
          }
          try {
            await window.VisionTestApi.resetStudentPassword({
              studentId: resetButton.getAttribute("data-reset-student-password"),
              password: newPassword
            });
            setStatus("testStudentsStatus", t("test_status_password_reset"), false);
          } catch (error) {
            setStatus("testStudentsStatus", error && error.message ? error.message : "Unable to reset password.", true);
          }
          return;
        }
        if (statusButton) {
          var nextStatus = statusButton.getAttribute("data-next-status");
          var confirmMessage = nextStatus === "inactive" ? t("test_prompt_confirm_deactivate") : t("test_prompt_confirm_activate");
          if (!window.confirm(confirmMessage)) {
            return;
          }
          try {
            await window.VisionTestStore.updateStudentStatus(statusButton.getAttribute("data-update-student-status"), nextStatus);
            setStatus("testStudentsStatus", t("test_status_student_updated"), false);
          } catch (error) {
            setStatus("testStudentsStatus", error && error.message ? error.message : "Unable to update student.", true);
          }
        }
      });
    }

    if (exportRegistrationsButton) {
      exportRegistrationsButton.addEventListener("click", function () {
        if (!registrations.length) {
          setStatus("testRegistrationsStatus", t("test_students_empty"), true);
          return;
        }
        var headers = ["displayName", "loginName", "mobile", "batchName", "examName", "language", "status", "createdAt"];
        var rows = registrations.map(function (registration) {
          return [
            registration.displayName,
            registration.loginName,
            registration.mobile,
            registration.batchName,
            registration.examName,
            registration.language,
            registration.status,
            registration.createdAt
          ];
        });
        var csv = [headers.join(",")].concat(rows.map(function (row) {
          return row.map(csvCell).join(",");
        })).join("\n");
        downloadTextFile("vision-test-registrations.csv", csv, "text/csv;charset=utf-8");
        setStatus("testRegistrationsStatus", t("test_status_registrations_exported"), false);
      });
    }

    if (downloadApprovalTemplateButton) {
      downloadApprovalTemplateButton.addEventListener("click", function () {
        var template = [
          "loginName,status,language,batchName,examName",
          "student-login,approved,en,morning,LDC 2026"
        ].join("\n");
        downloadTextFile("vision-test-approval-template.csv", template, "text/csv;charset=utf-8");
      });
    }

    if (approvalCsvInput) {
      approvalCsvInput.addEventListener("change", async function () {
        var file = approvalCsvInput.files && approvalCsvInput.files[0];
        if (!file) {
          return;
        }
        try {
          var text = await file.text();
          var rows = parseCsvRows(text);
          if (!rows.length) {
            throw new Error("Approval CSV is empty.");
          }
          var header = rows[0];
          var dataRows = rows.slice(1).map(function (row) {
            return {
              loginName: row[header.indexOf("loginName")],
              status: row[header.indexOf("status")],
              language: row[header.indexOf("language")],
              batchName: row[header.indexOf("batchName")],
              examName: row[header.indexOf("examName")]
            };
          }).filter(function (row) {
            return clean(row.loginName);
          });
          var result = await window.VisionTestApi.bulkApproveStudents(dataRows);
          setStatus("testRegistrationsStatus", t("test_status_bulk_approved") + (result && typeof result.count === "number" ? " (" + result.count + ")" : ""), false);
        } catch (error) {
          setStatus("testRegistrationsStatus", error && error.message ? error.message : "Unable to process approval CSV.", true);
        } finally {
          approvalCsvInput.value = "";
        }
      });
    }

    if (questionBuilderList) {
      questionBuilderList.addEventListener("input", function (event) {
        var input = event.target;
        if (!input.hasAttribute("data-question-field")) {
          return;
        }
        var index = Number(input.getAttribute("data-question-index"));
        var field = input.getAttribute("data-question-field");
        if (!builderQuestions[index]) {
          return;
        }
        if (field === "prompt") {
          builderQuestions[index].prompt = clean(input.value);
          return;
        }
        if (field === "correct") {
          builderQuestions[index].correctOptionId = clean(input.value) || "a";
          return;
        }
        var match = field.match(/^option-(a|b|c|d)$/);
        if (!match) {
          return;
        }
        var optionIndex = ["a", "b", "c", "d"].indexOf(match[1]);
        builderQuestions[index].options[optionIndex] = {
          id: match[1],
          text: clean(input.value)
        };
      });

      questionBuilderList.addEventListener("change", function (event) {
        var input = event.target;
        if (input.hasAttribute("data-question-field")) {
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      questionBuilderList.addEventListener("click", function (event) {
        var button = event.target.closest("button[data-remove-question]");
        if (!button) {
          return;
        }
        builderQuestions.splice(Number(button.getAttribute("data-remove-question")), 1);
        if (!builderQuestions.length) {
          builderQuestions = [getDefaultQuestion(0)];
        }
        renderQuestions();
      });
    }

    if (addQuestionButton) {
      addQuestionButton.addEventListener("click", function () {
        builderQuestions.push(getDefaultQuestion(builderQuestions.length));
        renderQuestions();
      });
    }

    if (resetBuilderButton) {
      resetBuilderButton.addEventListener("click", resetBuilder);
    }

    if (downloadTestCsvTemplate) {
      downloadTestCsvTemplate.addEventListener("click", function () {
        downloadTextFile("vision-test-template.csv", "question,optionA,optionB,optionC,optionD,correctOption\nSample question,Option A,Option B,Option C,Option D,A", "text/csv;charset=utf-8");
      });
    }

    if (testCsvInput) {
      testCsvInput.addEventListener("change", async function () {
        var file = testCsvInput.files && testCsvInput.files[0];
        if (!file) {
          return;
        }
        try {
          var text = await file.text();
          var rows = parseCsvRows(text);
          var startIndex = rows.length && clean(rows[0][0]).toLowerCase() === "question" ? 1 : 0;
          builderQuestions = rows.slice(startIndex).map(function (row, index) {
            return {
              id: "question_" + String(index + 1),
              prompt: row[0],
              options: [
                { id: "a", text: row[1] || "" },
                { id: "b", text: row[2] || "" },
                { id: "c", text: row[3] || "" },
                { id: "d", text: row[4] || "" }
              ],
              correctOptionId: clean(row[5] || "A").toLowerCase()
            };
          }).filter(function (question) {
            return clean(question.prompt);
          });
          if (!builderQuestions.length) {
            throw new Error("CSV file did not contain valid questions.");
          }
          renderQuestions();
          setStatus("testBuilderStatus", t("test_status_csv_loaded"), false);
        } catch (error) {
          setStatus("testBuilderStatus", error && error.message ? error.message : "Unable to import question CSV.", true);
        } finally {
          testCsvInput.value = "";
        }
      });
    }

    if (testBuilderForm) {
      testBuilderForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
          await window.VisionTestStore.saveTest({
            id: clean(byId("testBuilderId").value),
            title: clean(testBuilderForm.elements.title.value),
            language: clean(testBuilderForm.elements.language.value),
            opensAt: fromLocalDateTimeValue(testBuilderForm.elements.opensAt.value),
            closesAt: fromLocalDateTimeValue(testBuilderForm.elements.closesAt.value),
            durationMinutes: Number(testBuilderForm.elements.durationMinutes.value || 60),
            questions: builderQuestions.map(function (question, index) {
              return {
                id: question.id || ("question_" + String(index + 1)),
                prompt: clean(question.prompt),
                options: (question.options || []).map(function (option) {
                  return {
                    id: option.id,
                    text: clean(option.text)
                  };
                }).filter(function (option) {
                  return option.text;
                }),
                correctOptionId: clean(question.correctOptionId) || "a"
              };
            })
          });
          setStatus("testBuilderStatus", t("test_status_test_saved"), false);
          resetBuilder();
        } catch (error) {
          setStatus("testBuilderStatus", error && error.message ? error.message : "Unable to save online test.", true);
        }
      });
    }

    if (testsBody) {
      testsBody.addEventListener("click", async function (event) {
        var editButton = event.target.closest("button[data-test-edit]");
        var publishButton = event.target.closest("button[data-test-publish]");
        var closeButton = event.target.closest("button[data-test-close]");
        var deleteButton = event.target.closest("button[data-test-delete]");
        try {
          if (editButton) {
            loadTestIntoBuilder(editButton.getAttribute("data-test-edit"));
            return;
          }
          if (publishButton) {
            if (!window.confirm(t("test_prompt_confirm_publish"))) {
              return;
            }
            await window.VisionTestStore.publishTest(publishButton.getAttribute("data-test-publish"));
            setStatus("testBuilderStatus", t("test_status_test_published"), false);
            return;
          }
          if (closeButton) {
            if (!window.confirm(t("test_prompt_confirm_close"))) {
              return;
            }
            await window.VisionTestStore.closeTest(closeButton.getAttribute("data-test-close"));
            setStatus("testBuilderStatus", t("test_status_test_closed"), false);
            return;
          }
          if (deleteButton) {
            if (!window.confirm(t("test_prompt_confirm_delete"))) {
              return;
            }
            await window.VisionTestStore.deleteTest(deleteButton.getAttribute("data-test-delete"));
            setStatus("testBuilderStatus", t("test_status_test_deleted"), false);
          }
        } catch (error) {
          setStatus("testBuilderStatus", error && error.message ? error.message : "Unable to update online test.", true);
        }
      });
    }

    if (exportResultsButton) {
      exportResultsButton.addEventListener("click", function () {
        if (!attempts.length) {
          setStatus("testResultsStatus", t("test_results_empty"), true);
          return;
        }
        var headers = ["studentDisplayName", "studentLoginName", "testTitle", "language", "startedAt", "submittedAt", "score", "correctCount", "answeredCount", "totalQuestions", "status"];
        var csv = [headers.join(",")].concat(attempts.map(function (attempt) {
          return [
            attempt.studentDisplayName,
            attempt.studentLoginName,
            attempt.testTitle,
            attempt.language,
            attempt.startedAt,
            attempt.submittedAt,
            attempt.score,
            attempt.correctCount,
            attempt.answeredCount,
            attempt.totalQuestions,
            attempt.status
          ].map(csvCell).join(",");
        })).join("\n");
        downloadTextFile("vision-test-results.csv", csv, "text/csv;charset=utf-8");
        setStatus("testResultsStatus", t("test_status_results_exported"), false);
      });
    }

    window.addEventListener("vision-language-changed", function () {
      populateRegistrationSelect();
      renderRegistrations();
      renderStudents();
      renderTests();
      renderAttempts();
      renderQuestions();
    });

    resetBuilder();
  });
})();
