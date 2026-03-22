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

  function replaceTokens(template, values) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return Object.prototype.hasOwnProperty.call(values || {}, key) ? values[key] : "";
    });
  }

  function normalizeQuestionStartLine(text) {
    return clean(text).replace(/^(q(?:uestion)?\s*)?((?:\d\s*){1,3})\s*([\)\].:-])\s*/i, function (_, prefix, digits, punctuation) {
      return clean(prefix || "") + (prefix ? "" : "") + String(digits || "").replace(/\s+/g, "") + punctuation + " ";
    }).replace(/^\s+/, "");
  }

  function normalizeOptionStartLine(text) {
    return clean(text).replace(/^([A-D])\s*([\)\].:-])\s*/i, function (_, optionId, punctuation) {
      return String(optionId).toUpperCase() + punctuation + " ";
    }).replace(/^\s+/, "");
  }

  function normalizeImportedLine(text) {
    return normalizeOptionStartLine(normalizeQuestionStartLine(text));
  }

  function isQuestionStartLine(text) {
    return /^(?:q(?:uestion)?\s*)?\d{1,3}[\)\].:-]\s*/i.test(normalizeQuestionStartLine(text));
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

  var pdfJsPromise = null;

  function isTamilLine(text) {
    // Tamil Unicode range: U+0B80 to U+0BFF
    var tamilRegex = /[\u0B80-\u0BFF]/g;
    var tamilChars = (String(text || "").match(tamilRegex) || []).length;
    var totalChars = String(text || "").replace(/\s+/g, "").length;
    // Consider it MOSTLY Tamil if more than 50% of characters are Tamil (skip pure Tamil lines)
    // Keep English lines even if they have 1-2 Tamil characters
    return totalChars > 5 && tamilChars / totalChars > 0.5;
  }

  var pdfJsPromise = null;

  function loadPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      return Promise.resolve(window.pdfjsLib);
    }

    if (!pdfJsPromise) {
      pdfJsPromise = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.async = true;
        script.onload = function () {
          if (!window.pdfjsLib) {
            reject(new Error("PDF reader could not be loaded."));
            return;
          }
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(window.pdfjsLib);
        };
        script.onerror = function () {
          reject(new Error("Unable to load the PDF reader library."));
        };
        document.head.appendChild(script);
      });
    }

    return pdfJsPromise;
  }

  function collectPdfLines(items) {
    var rows = [];

    (Array.isArray(items) ? items : []).forEach(function (item) {
      var text = clean(item && item.str);
      if (!text) {
        return;
      }
      var transform = item.transform || [];
      var rowY = Math.round(Number(transform[5] || 0));
      var row = rows.find(function (entry) {
        return Math.abs(entry.y - rowY) <= 2;
      });
      if (!row) {
        row = { y: rowY, items: [] };
        rows.push(row);
      }
      row.items.push({
        x: Number(transform[4] || 0),
        text: text
      });
    });

    return rows.sort(function (left, right) {
      return right.y - left.y;
    }).map(function (row) {
      return row.items.sort(function (left, right) {
        return left.x - right.x;
      }).map(function (item) {
        return item.text;
      }).join(" ").replace(/\s+/g, " ").trim();
    }).filter(function (line) {
      var lower = line.toLowerCase();
      
      // Filter out Tamil lines (for bilingual PDFs)
      if (isTamilLine(line)) {
        return false;
      }
      
      // Filter out ONLY clear footer/header texts
      if (/^vision education academy/i.test(lower) ||
        /^contact no:/i.test(lower) ||
        /^udc\s*\/\s*ldc/i.test(lower) ||
        /^operation cauvery/i.test(lower) ||
        /^\s*?(?:paper|exam)\s*(?:[-–—:;]\s*)?(?:\d{1,2}|i{1,3}|[ivx]+)\s*?$/i.test(lower) ||
        /^date:\s*\d{1,2}/i.test(lower) ||
        /^time\s*:/i.test(lower) ||
        /^\**$/.test(lower) ||
        /^page\s+\d+/i.test(lower)) {
        return false;
      }
      return !!line;
    });
  }

  async function extractPdfLines(file) {
    var pdfjsLib = await loadPdfJs();
    var arrayBuffer = await file.arrayBuffer();
    var documentTask = pdfjsLib.getDocument({ data: arrayBuffer });
    var pdf = await documentTask.promise;
    var lines = [];
    var pageIndex;

    for (pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      var page = await pdf.getPage(pageIndex);
      var textContent = await page.getTextContent();
      lines = lines.concat(collectPdfLines(textContent.items));
    }

    return lines;
  }

  function extractInlineOptions(text) {
    var options = [];
    var matcher = /([A-D])\s*[\)\].:-]\s*(.*?)(?=(?:\s+[A-D]\s*[\)\].:-]\s)|$)/gi;
    var match;

    while ((match = matcher.exec(String(text || "")))) {
      options.push({
        id: String(match[1]).toLowerCase(),
        text: clean(match[2])
      });
    }

    // Fallback: if no letter options found, try numeric options (1,2,3,4) and convert to a,b,c,d
    if (!options.length) {
      var numTexts = String(text || "").match(/([1-4])\s*[\)\].:-]\s*([^\n\d]+?)(?=(?:[1-4]\s*[\)\].-]|$))/gi);
      if (Array.isArray(numTexts)) {
        numTexts.forEach(function (optionText) {
          var m = optionText.match(/([1-4])\s*[\)\].:-]\s*(.*)/i);
          if (m) {
            var numId = String(m[1]);
            var letterMap = { "1": "a", "2": "b", "3": "c", "4": "d" };
            options.push({
              id: letterMap[numId] || numId,
              text: clean(m[2])
            });
          }
        });
      }
    }

    return options.filter(function (option, index, list) {
      return option.text && list.findIndex(function (entry) {
        return entry.id === option.id;
      }) === index;
    });
  }

  function extractAnswerKeyMap(lines) {
    var answerMap = {};
    (Array.isArray(lines) ? lines : []).forEach(function (line) {
      var matcher = /((?:\d\s*){1,3})\s*[\)\].:-]?\s*(?:answer\s*[:\-]?\s*)?([A-D])(?=\b)/gi;
      var match;
      while ((match = matcher.exec(String(line || "")))) {
        answerMap[String(match[1]).replace(/\s+/g, "")] = String(match[2]).toLowerCase();
      }
    });
    return answerMap;
  }

  function extractQuestionNumberFromQuestion(question, fallbackIndex) {
    var match = clean(question && question.id).match(/(\d{1,3})$/);
    return clean(question && question.questionNumber) || (match ? match[1] : String(fallbackIndex + 1));
  }

  function applyAnswerMapToQuestions(questionList, answerMap) {
    var matchedCount = 0;
    var questions = (Array.isArray(questionList) ? questionList : []).map(function (question, index) {
      var questionNumber = extractQuestionNumberFromQuestion(question, index);
      var answer = clean(answerMap && answerMap[questionNumber]).toLowerCase();
      return {
        id: question.id || ("question_" + String(index + 1)),
        questionNumber: questionNumber,
        prompt: question.prompt,
        options: Array.isArray(question.options) ? question.options.map(function (option) {
          return {
            id: option.id,
            text: option.text
          };
        }) : [],
        correctOptionId: /^[a-d]$/.test(answer) ? answer : clean(question.correctOptionId).toLowerCase()
      }
    });
    questions.forEach(function (question) {
      if (/^[a-d]$/.test(question.correctOptionId)) {
        matchedCount += 1;
      }
    });
    return {
      questions: questions,
      matchedCount: matchedCount
    };
  }

  function parseQuestionBlock(blockLines, answerMap, fallbackIndex, requireAnswer) {
    var qIndex = (blockLines || []).findIndex(function (line) { return isQuestionStartLine(line); });
    if (qIndex < 0) qIndex = 0;

    var firstLine = normalizeQuestionStartLine(clean(blockLines[qIndex]));
    var firstMatch = firstLine.match(/^(?:q(?:uestion)?\s*)?(\d{1,3})[\)\].:-]\s*(.*)$/i);
    if (!firstMatch) {
      return null;
    }

    var questionNumber = String(firstMatch[1]);
    var rawLines = [];
    if (qIndex > 0) {
      rawLines.push(blockLines.slice(0, qIndex).join(" "));
    }
    if (clean(firstMatch[2])) {
      rawLines.push(clean(firstMatch[2]));
    }
    rawLines = rawLines.concat((Array.isArray(blockLines) ? blockLines.slice(qIndex + 1) : []).map(function (line) {
      return normalizeImportedLine(clean(line));
    }).filter(Boolean));

    var lines = [];
    rawLines.forEach(function (line) {
      String(line || "").split(/(?=(?:^|\s+)[A-D]\s*[\)\].:-](?:\s+|$))/i).forEach(function (part) {
        if (clean(part)) {
          lines.push(clean(part));
        }
      });
    });

    var promptParts = [];
    var options = [];
    var currentOption = null;
    var inlineAnswer = "";

    lines.forEach(function (line) {
      var sanitizedLine = clean(String(line || "").replace(/(?:answer|ans|correct(?: option)?)\s*[:\-]?\s*([A-D])/ig, function (_, answerLetter) {
        inlineAnswer = inlineAnswer || String(answerLetter).toLowerCase();
        return "";
      }));

      if (!sanitizedLine) {
        return;
      }

      var optionMatch = sanitizedLine.match(/^([A-D])[\)\].:-]\s*(.*)$/i);
      if (optionMatch) {
        if (currentOption && currentOption.text) {
          options.push(currentOption);
        }
        currentOption = {
          id: String(optionMatch[1]).toLowerCase(),
          text: clean(optionMatch[2])
        };
        return;
      }

      if (currentOption) {
        currentOption.text = clean(currentOption.text + " " + sanitizedLine);
        return;
      }

      promptParts.push(sanitizedLine);
    });

    if (currentOption && currentOption.text) {
      options.push(currentOption);
    }

    var prompt = clean(promptParts.join(" "));
    if (options.length < 2) {
      var joined = lines.join(" ");
      var promptMatch = joined.match(/^(.*?)(?=\s+[A-D][\)\].:-]\s+)/i);
      if (promptMatch && !prompt) {
        prompt = clean(promptMatch[1]);
      }
      options = extractInlineOptions(joined);
    }

    options = options.filter(function (option, index, list) {
      return option && option.id && option.text && list.findIndex(function (entry) {
        return entry.id === option.id;
      }) === index;
    });

    var correctOptionId = clean(inlineAnswer || answerMap[questionNumber] || answerMap[String(fallbackIndex + 1)]).toLowerCase();
    if (!prompt || options.length < 2 || (requireAnswer && !/^[a-d]$/.test(correctOptionId))) {
      return null;
    }

    return {
      id: "question_" + questionNumber + "_" + Math.random().toString(36).substr(2, 6),
      questionNumber: questionNumber,
      prompt: prompt,
      options: options,
      correctOptionId: /^[a-d]$/.test(correctOptionId) ? correctOptionId : ""
    };
  }

  function parseQuestionsFromPdfLines(lines) {
    var normalizedLines = (Array.isArray(lines) ? lines : []).map(function (line) {
      return normalizeImportedLine(clean(String(line || "").replace(/\s+/g, " ")));
    }).filter(Boolean);
    var answerSectionIndex = normalizedLines.findIndex(function (line) {
      return /^(?:answer\s*key|answers?)$/i.test(clean(line));
    });
    var answerMap = extractAnswerKeyMap(answerSectionIndex >= 0 ? normalizedLines.slice(answerSectionIndex) : []);
    var contentLines = answerSectionIndex >= 0 ? normalizedLines.slice(0, answerSectionIndex) : normalizedLines;
    var blocks = [];
    var currentBlock = [];
    var pendingPreamble = [];

    contentLines.forEach(function (line) {
      if (isQuestionStartLine(line)) {
        if (currentBlock.length) {
          blocks.push(currentBlock);
        }
        currentBlock = pendingPreamble.concat([line]);
        pendingPreamble = [];
      } else if (/^(?:read the|directions|instructions|note:|passage)\b/i.test(clean(line))) {
        pendingPreamble.push(line);
      } else if (pendingPreamble.length > 0) {
        pendingPreamble.push(line);
      } else if (currentBlock.length) {
        currentBlock.push(line);
      }
    });

    if (currentBlock.length) {
      blocks.push(currentBlock);
    }

    var parsedQuestions = blocks.map(function (block, index) {
      return parseQuestionBlock(block, answerMap, index, false);
    }).filter(Boolean);

    var byQuestionNumber = {};
    parsedQuestions.forEach(function (question) {
      var key = clean(question.questionNumber || question.id);
      var existing = byQuestionNumber[key];
      if (!existing) {
        byQuestionNumber[key] = question;
      } else {
        existing.prompt = clean(existing.prompt) + "\n\n" + clean(question.prompt);
        var mergedOptions = [];
        var maxOptionsCount = Math.max(existing.options.length, question.options.length);
        for (var i = 0; i < maxOptionsCount; i++) {
          var optA = existing.options[i];
          var optB = question.options[i];
          if (optA && optB) {
            mergedOptions.push({
              id: optA.id || optB.id,
              text: clean(optA.text) + " / " + clean(optB.text)
            });
          } else if (optA) {
            mergedOptions.push(optA);
          } else if (optB) {
            mergedOptions.push(optB);
          }
        }
        existing.options = mergedOptions;
        if (!existing.correctOptionId && question.correctOptionId) {
          existing.correctOptionId = question.correctOptionId;
        }
      }
    });

    return Object.keys(byQuestionNumber).sort(function (left, right) {
      return Number(left) - Number(right);
    }).map(function (key) {
      return byQuestionNumber[key];
    });
  }

  function parseAnswerKeyFromPdfLines(lines) {
    var normalizedLines = (Array.isArray(lines) ? lines : []).map(function (line) {
      return clean(String(line || "").replace(/\s+/g, " "));
    }).filter(Boolean);
    return extractAnswerKeyMap(normalizedLines);
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
    var resetBuilderButton = byId("resetTestBuilder");
    var testPdfInput = byId("testPdfInput");
    var answerKeyPdfInput = byId("answerKeyPdfInput");
    var testImportSummary = byId("testImportSummary");

    var registrations = [];
    var students = [];
    var tests = [];
    var attempts = [];
    var builderQuestions = [];
    var builderSourceName = "";
    var builderAnswerSourceName = "";
    var builderMatchedAnswerCount = 0;
    var builderSourceMode = "empty";

    function countQuestionsWithAnswers(questionList) {
      return (Array.isArray(questionList) ? questionList : []).filter(function (question) {
        return /^[a-d]$/.test(clean(question && question.correctOptionId).toLowerCase());
      }).length;
    }

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

    function renderBuilderSummary() {
      if (!testImportSummary) {
        return;
      }
      if (!builderQuestions.length) {
        testImportSummary.innerHTML = "<strong>" + escapeHtml(t("test_builder_pdf_empty")) + "</strong>";
        return;
      }

      var questionMessage = builderSourceMode === "draft"
        ? replaceTokens(t("test_builder_pdf_saved_summary"), {
          count: builderQuestions.length,
          name: builderSourceName || (testBuilderForm && clean(testBuilderForm.elements.title.value)) || t("test_builder_title")
        })
        : replaceTokens(t("test_builder_pdf_summary"), {
          count: builderQuestions.length,
          name: builderSourceName || "question-paper.pdf"
        });

      var answerMessage = builderMatchedAnswerCount
        ? replaceTokens(t("test_builder_answer_pdf_summary"), {
          count: builderMatchedAnswerCount,
          name: builderAnswerSourceName || builderSourceName || "answer-key.pdf"
        })
        : t("test_builder_answer_pdf_missing");

      testImportSummary.innerHTML =
        "<strong>" + escapeHtml(builderSourceName || (testBuilderForm && clean(testBuilderForm.elements.title.value)) || t("test_builder_title")) + "</strong>" +
        "<span>" + escapeHtml(questionMessage) + "</span>" +
        "<span>" + escapeHtml(answerMessage) + "</span>";
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
      if (byId("testBuilderId")) {
        byId("testBuilderId").value = "";
      }
      if (testPdfInput) {
        testPdfInput.value = "";
      }
      if (answerKeyPdfInput) {
        answerKeyPdfInput.value = "";
      }
      builderQuestions = [];
      builderSourceName = "";
      builderAnswerSourceName = "";
      builderMatchedAnswerCount = 0;
      builderSourceMode = "empty";
      renderBuilderSummary();
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
          questionNumber: extractQuestionNumberFromQuestion(question, index),
          prompt: question.prompt,
          options: (question.options || []).map(function (option) {
            return {
              id: option.id,
              text: option.text
            };
          }),
          correctOptionId: clean(question.correctOptionId).toLowerCase()
        };
      }).filter(function (question) {
        return clean(question.prompt) && Array.isArray(question.options) && question.options.length >= 2;
      });
      builderSourceName = test.title || "Saved draft";
      builderAnswerSourceName = test.title || "Saved draft";
      builderMatchedAnswerCount = countQuestionsWithAnswers(builderQuestions);
      builderSourceMode = "draft";
      renderBuilderSummary();
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

    if (resetBuilderButton) {
      resetBuilderButton.addEventListener("click", resetBuilder);
    }

    if (testPdfInput) {
      testPdfInput.addEventListener("change", async function () {
        var file = testPdfInput.files && testPdfInput.files[0];
        if (!file) {
          return;
        }
        try {
          setStatus("testBuilderStatus", t("test_builder_pdf_loading"), false);
          var lines = await extractPdfLines(file);
          builderQuestions = parseQuestionsFromPdfLines(lines).map(function (question, index) {
            return {
              id: question.id || ("question_" + String(index + 1)),
              questionNumber: extractQuestionNumberFromQuestion(question, index),
              prompt: question.prompt,
              options: Array.isArray(question.options) ? question.options.map(function (option) {
                return {
                  id: option.id,
                  text: option.text
                };
              }) : [],
              correctOptionId: ""
            };
          });
          if (!builderQuestions.length) {
            throw new Error(t("test_builder_pdf_invalid"));
          }
          builderSourceName = clean(file.name) || "question-paper.pdf";
          builderAnswerSourceName = "";
          builderMatchedAnswerCount = 0;
          builderSourceMode = "pdf";
          renderBuilderSummary();
          if (testBuilderForm && !clean(testBuilderForm.elements.title.value)) {
            testBuilderForm.elements.title.value = builderSourceName.replace(/\.[^.]+$/, "");
          }
          setStatus("testBuilderStatus", t("test_builder_pdf_ready"), false);
        } catch (error) {
          builderQuestions = [];
          builderSourceName = "";
          builderAnswerSourceName = "";
          builderMatchedAnswerCount = 0;
          builderSourceMode = "empty";
          renderBuilderSummary();
          setStatus("testBuilderStatus", error && error.message ? error.message : t("test_builder_pdf_invalid"), true);
        } finally {
          testPdfInput.value = "";
        }
      });
    }

    if (answerKeyPdfInput) {
      answerKeyPdfInput.addEventListener("change", async function () {
        var file = answerKeyPdfInput.files && answerKeyPdfInput.files[0];
        if (!file) {
          return;
        }
        try {
          if (!builderQuestions.length) {
            throw new Error(t("test_builder_answer_pdf_missing_questions"));
          }
          setStatus("testBuilderStatus", t("test_builder_answer_pdf_loading"), false);
          var lines = await extractPdfLines(file);
          var answerMap = parseAnswerKeyFromPdfLines(lines);
          if (!Object.keys(answerMap).length) {
            throw new Error(t("test_builder_answer_pdf_invalid"));
          }
          var applied = applyAnswerMapToQuestions(builderQuestions, answerMap);
          if (!applied.matchedCount) {
            throw new Error(t("test_builder_answer_pdf_invalid"));
          }
          builderQuestions = applied.questions;
          builderAnswerSourceName = clean(file.name) || "answer-key.pdf";
          builderMatchedAnswerCount = applied.matchedCount;
          renderBuilderSummary();
          setStatus("testBuilderStatus", t("test_builder_answer_pdf_ready"), false);
        } catch (error) {
          setStatus("testBuilderStatus", error && error.message ? error.message : t("test_builder_answer_pdf_invalid"), true);
        } finally {
          answerKeyPdfInput.value = "";
        }
      });
    }

    if (testBuilderForm) {
      testBuilderForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
          if (!builderQuestions.length) {
            throw new Error(t("test_builder_pdf_empty"));
          }
          var answerReadyCount = countQuestionsWithAnswers(builderQuestions);
          if (!answerReadyCount || answerReadyCount !== builderQuestions.length) {
            throw new Error(t("test_builder_answer_pdf_required"));
          }
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
                correctOptionId: clean(question.correctOptionId).toLowerCase()
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
      renderBuilderSummary();
    });

    resetBuilder();
  });
})();
