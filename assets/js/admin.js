(function () {
  "use strict";

  function t(key, fallback) {
    var translated = "";
    if (window.VisionTestI18n && typeof window.VisionTestI18n.t === "function") {
      translated = String(window.VisionTestI18n.t(key, "") || "");
      if (translated && translated !== key) {
        return translated;
      }
    }
    if (window.VisionI18n && typeof window.VisionI18n.t === "function") {
      translated = String(window.VisionI18n.t(key) || "");
      if (translated && translated !== key) {
        return translated;
      }
    }
    return fallback || key;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function getClosestActionButton(target, attributeName) {
    if (!(target instanceof Element)) {
      return null;
    }
    return target.closest("button[" + attributeName + "]");
  }

  function clean(value) {
    return String(value || "").trim();
  }

  var ADMIN_VIEW_KEY = "vision_admin_view_v1";

  function normalizeAdminView(value) {
    var safe = clean(value).toLowerCase();
    return safe === "tests" || safe === "fees" ? safe : "overview";
  }

  function parseMarqueeLinks(input) {
    return String(input || "").split(/\r?\n/).map(function (line) {
      return clean(line);
    }).filter(Boolean).map(function (src, index) {
      var fileName = src.split(/[?#]/)[0].split("/").filter(Boolean).pop();
      return {
        id: "marquee_link_" + Date.now() + "_" + String(index + 1),
        name: clean(fileName) || ("image-link-" + String(index + 1)),
        src: src
      };
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

  function setYear() {
    var yearElement = byId("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }
  }

  function clearLoginForm() {
    var loginForm = byId("loginForm");
    var passwordInput = byId("adminPassword");
    if (loginForm) {
      loginForm.reset();
    }
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.type = "password";
    }
    var toggleButton = byId("toggleAdminPassword");
    if (toggleButton) {
      toggleButton.setAttribute("aria-label", "Show password");
      toggleButton.setAttribute("title", "Show password");
      toggleButton.setAttribute("aria-pressed", "false");
      var showIcon = toggleButton.querySelector(".password-eye-show");
      var hideIcon = toggleButton.querySelector(".password-eye-hide");
      if (showIcon) showIcon.classList.remove("hidden");
      if (hideIcon) hideIcon.classList.add("hidden");
    }
  }

  function setLoginPending(isPending) {
    var loginForm = byId("loginForm");
    var passwordInput = byId("adminPassword");
    var submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    var toggleButton = byId("toggleAdminPassword");
    if (passwordInput) {
      passwordInput.disabled = Boolean(isPending);
    }
    if (submitButton) {
      submitButton.disabled = Boolean(isPending);
      submitButton.textContent = isPending ? "Logging in..." : t("btn_login", "Login");
    }
    if (toggleButton) {
      toggleButton.disabled = Boolean(isPending);
    }
  }

  function toggleDashboard(isLoggedIn) {
    var loginSection = byId("loginSection");
    var dashboardSection = byId("dashboardSection");
    if (loginSection) {
      loginSection.classList.toggle("hidden", isLoggedIn);
    }
    if (dashboardSection) {
      dashboardSection.classList.toggle("hidden", !isLoggedIn);
    }
  }

  function extractInstagramPostUrl(input) {
    var text = String(input || "").trim();
    if (!text) {
      return "";
    }
    var match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+\/?/i);
    if (!match) {
      return "";
    }
    var url = match[0].replace(/^http:\/\//i, "https://");
    if (url.charAt(url.length - 1) !== "/") {
      url += "/";
    }
    return url;
  }

  function getInstagramEmbedUrl(postUrl) {
    return /^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/i.test(String(postUrl || "").trim()) ? postUrl : "";
  }

  function populateSiteForm(siteData) {
    var form = byId("siteContentForm");
    if (!form || !siteData) {
      return;
    }
    form.elements.tagline.value = siteData.tagline || "";
    form.elements.heroTitle.value = siteData.heroTitle || "";
    form.elements.heroText.value = siteData.heroText || "";
    form.elements.announcement.value = siteData.announcement || "";
    form.elements.address.value = siteData.address || "";
    form.elements.phone.value = siteData.phone || "";
    form.elements.email.value = siteData.email || "";
    form.elements.instagramProfileUrl.value = siteData.instagramProfileUrl || "";
    form.elements.facebookProfileUrl.value = siteData.facebookProfileUrl || "";

    var marqueeLinks = byId("marqueeImageLinks");
    if (marqueeLinks) {
      marqueeLinks.value = (siteData.marqueeImages || []).map(function (item) {
        return item.src || "";
      }).filter(Boolean).join("\n");
    }
  }

  function renderMarqueeAdminList(siteData) {
    var container = byId("marqueeAdminList");
    if (!container) {
      return;
    }

    var images = siteData && Array.isArray(siteData.marqueeImages) ? siteData.marqueeImages : [];
    container.innerHTML = "";

    if (!images.length) {
      container.innerHTML = "<p class='empty-text'>" + t("admin_marquee_empty", "No marquee images added yet.") + "</p>";
      return;
    }

    images.forEach(function (item, index) {
      var row = document.createElement("div");
      row.className = "marquee-upload-item";
      row.setAttribute("data-marquee-row-id", item.id);

      var dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = "marquee-drag-handle";
      dragHandle.draggable = true;
      dragHandle.setAttribute("data-marquee-drag-handle", "");
      dragHandle.setAttribute("aria-label", t("admin_marquee_drag", "Drag to reorder"));
      dragHandle.title = t("admin_marquee_drag", "Drag to reorder");
      dragHandle.textContent = "⠿";

      var preview = document.createElement("img");
      preview.className = "marquee-upload-preview";
      preview.src = item.src || "";
      preview.alt = "";
      preview.loading = "lazy";
      preview.addEventListener("error", function () { preview.classList.add("hidden"); });

      var name = document.createElement("p");
      name.className = "marquee-upload-name";
      name.textContent = item.name || t("admin_marquee_uploaded_label", "Uploaded image");

      var sourceLink = document.createElement("a");
      sourceLink.href = item.src || "#";
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener";
      sourceLink.className = "text-link";
      sourceLink.textContent = item.src || "";

      var removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "btn btn-danger";
      removeButton.textContent = t("btn_delete", "Delete");
      removeButton.setAttribute("data-marquee-id", item.id);

      var actions = document.createElement("div");
      actions.className = "marquee-upload-actions";
      var moveUpButton = document.createElement("button");
      moveUpButton.type = "button";
      moveUpButton.className = "btn btn-outline marquee-order-button";
      moveUpButton.textContent = "↑";
      moveUpButton.setAttribute("data-marquee-move", "up");
      moveUpButton.setAttribute("data-marquee-id", item.id);
      moveUpButton.setAttribute("aria-label", t("admin_marquee_move_up", "Move image up"));
      moveUpButton.title = t("admin_marquee_move_up", "Move image up");
      moveUpButton.disabled = index === 0;
      var moveDownButton = document.createElement("button");
      moveDownButton.type = "button";
      moveDownButton.className = "btn btn-outline marquee-order-button";
      moveDownButton.textContent = "↓";
      moveDownButton.setAttribute("data-marquee-move", "down");
      moveDownButton.setAttribute("data-marquee-id", item.id);
      moveDownButton.setAttribute("aria-label", t("admin_marquee_move_down", "Move image down"));
      moveDownButton.title = t("admin_marquee_move_down", "Move image down");
      moveDownButton.disabled = index === images.length - 1;
      actions.appendChild(moveUpButton);
      actions.appendChild(moveDownButton);
      actions.appendChild(removeButton);

      row.appendChild(dragHandle);
      row.appendChild(preview);
      row.appendChild(name);
      row.appendChild(sourceLink);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  function sortByLatest(newsItems) {
    return (Array.isArray(newsItems) ? newsItems : []).slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function renderNewsAdminList(newsItems) {
    var container = byId("newsAdminList");
    if (!container) {
      return;
    }

    container.innerHTML = "";
    var list = sortByLatest(newsItems);

    if (!list.length) {
      container.innerHTML = "<p class='empty-text'>" + t("admin_news_empty", "No news added yet.") + "</p>";
      return;
    }

    list.forEach(function (item) {
      var article = document.createElement("article");
      article.className = "news-item";

      var header = document.createElement("div");
      header.className = "news-item-header";

      var title = document.createElement("h3");
      title.textContent = item.title || "Update";

      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger";
      deleteButton.textContent = t("btn_delete", "Delete");
      deleteButton.setAttribute("data-news-id", item.id);

      header.appendChild(title);
      header.appendChild(deleteButton);

      var date = document.createElement("p");
      date.className = "news-date";
      date.textContent = VisionStore.formatDisplayDate(item.date);

      var summary = document.createElement("p");
      summary.textContent = item.summary || "";

      article.appendChild(header);
      article.appendChild(date);
      article.appendChild(summary);
      container.appendChild(article);
    });
  }

  function renderInstagramAdminList(siteData) {
    var container = byId("instagramAdminList");
    if (!container) {
      return;
    }

    var postList = siteData && Array.isArray(siteData.instagramPosts) ? siteData.instagramPosts : [];
    container.innerHTML = "";

    if (!postList.length) {
      container.innerHTML = "<p class='empty-text'>" + t("admin_instagram_empty", "No Instagram posts added yet.") + "</p>";
      return;
    }

    postList.forEach(function (entry) {
      var article = document.createElement("article");
      article.className = "news-item";

      var header = document.createElement("div");
      header.className = "news-item-header";

      var link = document.createElement("a");
      link.href = entry.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "text-link";
      link.textContent = entry.url;

      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger";
      deleteButton.textContent = t("btn_delete", "Delete");
      deleteButton.setAttribute("data-ig-id", entry.id);

      header.appendChild(link);
      header.appendChild(deleteButton);
      article.appendChild(header);
      container.appendChild(article);
    });
  }

  function renderApplicationsTable(applications) {
    var body = byId("applicationsTableBody");
    if (!body) {
      return;
    }

    body.innerHTML = "";
    var list = Array.isArray(applications) ? applications : [];

    if (!list.length) {
      body.innerHTML = "<tr><td colspan='6'>" + t("admin_applications_empty", "No applications submitted yet.") + "</td></tr>";
      return;
    }

    list.forEach(function (app) {
      var tr = document.createElement("tr");
      [
        app.candidateName || "-",
        app.fatherName || "-",
        app.mobile || "-",
        app.dob ? VisionStore.formatDisplayDate(app.dob) : "-",
        app.category || "-",
        VisionStore.formatDisplayDate(app.submittedAt)
      ].forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  function exportApplicationsCSV() {
    var applications = VisionStore.getApplications();
    if (!applications.length) {
      setStatus("applicationsStatus", t("alert_no_applications", "No applications to export."), true);
      return;
    }

    var headers = ["CandidateName", "FatherName", "MotherName", "DOB", "Gender", "Qualification", "Religion", "Category", "Mobile", "Address", "Submitted"];
    var rows = applications.map(function (app) {
      return [
        app.candidateName || "",
        app.fatherName || "",
        app.motherName || "",
        app.dob || "",
        app.gender || "",
        app.qualification || "",
        app.religion || "",
        app.category || "",
        app.mobile || "",
        app.address || "",
        VisionStore.formatDisplayDate(app.submittedAt)
      ];
    });

    function csvCell(value) {
      var text = String(value || "");
      return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }

    var csv = [headers.join(",")].concat(rows.map(function (row) {
      return row.map(csvCell).join(",");
    })).join("\n");

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "vision-applications-" + VisionStore.todayISO() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("applicationsStatus", t("status_csv_exported", "CSV exported successfully."), false);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    setYear();

    var loginForm = byId("loginForm");
    var logoutButton = byId("logoutButton");
    var siteContentForm = byId("siteContentForm");
    var newsForm = byId("newsForm");
    var newsAdminList = byId("newsAdminList");
    var instagramForm = byId("instagramPostForm");
    var instagramAdminList = byId("instagramAdminList");
    var marqueeAdminList = byId("marqueeAdminList");
    var exportButton = byId("exportApplications");
    var clearApplicationsButton = byId("clearApplications");
    var adminWorkspaceTitle = byId("adminWorkspaceTitle");
    var adminWorkspaceIntro = byId("adminWorkspaceIntro");
    var adminViewButtons = document.querySelectorAll("[data-admin-view-target]");

    var unsubscribeSite = null;
    var unsubscribeNews = null;
    var unsubscribeApplications = null;
    var authReadyPromise = typeof VisionStore.readyForAuth === "function" ? VisionStore.readyForAuth() : Promise.resolve();
    var storeReadyPromise = VisionStore.ready();
    var isLoggingIn = false;

    var adminViewCopy = {
      overview: {
        titleKey: "admin_workspace_overview_title",
        titleFallback: "Website & Applications",
        introKey: "admin_workspace_overview_intro",
        introFallback: "Manage public content, homepage updates, and admission form submissions."
      },
      tests: {
        titleKey: "admin_workspace_tests_title",
        titleFallback: "Test Management",
        introKey: "admin_workspace_tests_intro",
        introFallback: "Handle registrations, student access, retest approvals, test builder, and results in one place."
      },
      fees: {
        titleKey: "admin_workspace_fees_title",
        titleFallback: "Fees Management",
        introKey: "admin_workspace_fees_intro",
        introFallback: "Track fee collection, due balances, and payment notes for approved students."
      }
    };

    function updateWorkspaceCopy(viewName) {
      var copy = adminViewCopy[normalizeAdminView(viewName)];
      if (adminWorkspaceTitle) {
        adminWorkspaceTitle.setAttribute("data-i18n", copy.titleKey);
        adminWorkspaceTitle.textContent = t(copy.titleKey, copy.titleFallback);
      }
      if (adminWorkspaceIntro) {
        adminWorkspaceIntro.setAttribute("data-i18n", copy.introKey);
        adminWorkspaceIntro.textContent = t(copy.introKey, copy.introFallback);
      }
    }

    function setActiveAdminView(nextView) {
      var viewName = normalizeAdminView(nextView);
      localStorage.setItem(ADMIN_VIEW_KEY, viewName);
      if (window.location.hash !== "#" + viewName) {
        window.history.replaceState(null, "", "#" + viewName);
      }
      document.querySelectorAll("[id^='adminView']").forEach(function (panel) {
        panel.classList.add("hidden");
      });
      adminViewButtons.forEach(function (button) {
        var isActive = button.getAttribute("data-admin-view-target") === viewName;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      var activePanel = byId("adminView" + viewName.charAt(0).toUpperCase() + viewName.slice(1));
      if (activePanel) {
        activePanel.classList.remove("hidden");
      }
      updateWorkspaceCopy(viewName);
    }

    function getPreferredAdminView() {
      return normalizeAdminView(clean(window.location.hash).replace(/^#/, "") || localStorage.getItem(ADMIN_VIEW_KEY));
    }

    function stopDashboardSubscriptions() {
      if (unsubscribeSite) {
        unsubscribeSite();
        unsubscribeSite = null;
      }
      if (unsubscribeNews) {
        unsubscribeNews();
        unsubscribeNews = null;
      }
      if (unsubscribeApplications) {
        unsubscribeApplications();
        unsubscribeApplications = null;
      }
    }

    function startDashboardSubscriptions() {
      stopDashboardSubscriptions();
      unsubscribeSite = VisionStore.subscribeSiteData(function (siteData) {
        populateSiteForm(siteData);
        renderMarqueeAdminList(siteData);
        renderInstagramAdminList(siteData);
      });
      unsubscribeNews = VisionStore.subscribeNews(renderNewsAdminList);
      unsubscribeApplications = VisionStore.subscribeApplications(renderApplicationsTable);
    }

    var configStatus = VisionStore.getConfigStatus();
    if (!configStatus.configured) {
      setStatus("loginStatus", configStatus.error || "Firebase is not configured yet.", true);
    }

    VisionStore.subscribeAdminSession(function (user) {
      var loggedIn = Boolean(user);
      toggleDashboard(loggedIn);
      if (loggedIn) {
        startDashboardSubscriptions();
        setActiveAdminView(getPreferredAdminView());
        VisionStore.bootstrapDefaultContent().catch(function (error) {
          console.error("Unable to apply site content updates.", error);
          setStatus("contentStatus", error && error.message ? error.message : "Unable to apply site content updates.", true);
        });
      } else {
        stopDashboardSubscriptions();
        clearLoginForm();
      }
    });

    var passwordInput = byId("adminPassword");
    var togglePasswordButton = byId("toggleAdminPassword");
    if (passwordInput && togglePasswordButton) {
      togglePasswordButton.addEventListener("click", function () {
        var shouldShow = passwordInput.type === "password";
        passwordInput.type = shouldShow ? "text" : "password";
        togglePasswordButton.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
        togglePasswordButton.setAttribute("title", shouldShow ? "Hide password" : "Show password");
        togglePasswordButton.setAttribute("aria-pressed", shouldShow ? "true" : "false");
        var showIcon = togglePasswordButton.querySelector(".password-eye-show");
        var hideIcon = togglePasswordButton.querySelector(".password-eye-hide");
        if (showIcon) showIcon.classList.toggle("hidden", shouldShow);
        if (hideIcon) hideIcon.classList.toggle("hidden", !shouldShow);
        passwordInput.focus();
      });
    }

    if (loginForm) {
      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (isLoggingIn) {
          return;
        }
        var password = clean(byId("adminPassword").value);
        isLoggingIn = true;
        setLoginPending(true);
        setStatus("loginStatus", "Checking admin login...", false);
        try {
          await authReadyPromise;
          await VisionStore.loginAdmin(password);
          clearLoginForm();
          setStatus("loginStatus", t("status_login_success", "Login successful."), false);
        } catch (error) {
          setStatus("loginStatus", error && error.message ? error.message : t("status_login_failed", "Incorrect password."), true);
        } finally {
          isLoggingIn = false;
          setLoginPending(false);
        }
      });
    }

    await storeReadyPromise;

    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        try {
          await VisionStore.logoutAdmin();
          clearLoginForm();
          setStatus("loginStatus", "", false);
        } catch (error) {
          setStatus("loginStatus", error && error.message ? error.message : "Logout failed.", true);
        }
      });
    }

    if (siteContentForm) {
      siteContentForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var saveButton = siteContentForm.querySelector('button[type="submit"]');
        if (saveButton) saveButton.disabled = true;
        var siteData = VisionStore.getSiteData();
        siteData.tagline = clean(siteContentForm.elements.tagline.value) || siteData.tagline;
        siteData.heroTitle = clean(siteContentForm.elements.heroTitle.value) || siteData.heroTitle;
        siteData.heroText = clean(siteContentForm.elements.heroText.value) || siteData.heroText;
        siteData.announcement = clean(siteContentForm.elements.announcement.value) || siteData.announcement;
        siteData.address = clean(siteContentForm.elements.address.value) || siteData.address;
        siteData.phone = clean(siteContentForm.elements.phone.value) || siteData.phone;
        siteData.email = clean(siteContentForm.elements.email.value) || siteData.email;
        siteData.instagramProfileUrl = clean(siteContentForm.elements.instagramProfileUrl.value) || siteData.instagramProfileUrl;
        siteData.facebookProfileUrl = clean(siteContentForm.elements.facebookProfileUrl.value) || siteData.facebookProfileUrl;
        var existingMarqueeImages = siteData.marqueeImages || [];
        siteData.marqueeImages = parseMarqueeLinks(siteContentForm.elements.marqueeImageLinks.value).map(function (entry) {
          var existing = existingMarqueeImages.filter(function (item) {
            return item.src === entry.src;
          })[0];
          return existing || entry;
        });
        var emailInput = siteContentForm.elements.email;
        var instagramInput = siteContentForm.elements.instagramProfileUrl;
        if (emailInput.validity.typeMismatch || instagramInput.validity.typeMismatch) {
          setStatus("contentStatus", "Please enter a valid email address and Instagram profile URL.", true);
          siteContentForm.reportValidity();
          if (saveButton) saveButton.disabled = false;
          return;
        }
        try {
          await VisionStore.saveSiteData(siteData);
          setStatus("contentStatus", t("status_content_saved", "Website information updated successfully."), false);
        } catch (error) {
          setStatus("contentStatus", error && error.message ? error.message : "Unable to save website information.", true);
        } finally {
          if (saveButton) saveButton.disabled = false;
        }
      });
    }

    if (marqueeAdminList) {
      var draggedMarqueeId = "";

      async function saveMarqueeOrder(images) {
        var siteData = VisionStore.getSiteData();
        siteData.marqueeImages = images;
        setStatus("contentStatus", t("admin_marquee_saving_order", "Saving marquee order..."), false);
        try {
          await VisionStore.saveSiteData(siteData);
          setStatus("contentStatus", t("admin_marquee_order_saved", "Marquee order saved."), false);
        } catch (error) {
          setStatus("contentStatus", error && error.message ? error.message : "Unable to save marquee order.", true);
        }
      }

      function moveMarqueeImage(id, offset) {
        var images = VisionStore.getSiteData().marqueeImages || [];
        var fromIndex = images.findIndex(function (item) { return String(item.id) === String(id); });
        var toIndex = fromIndex + offset;
        if (fromIndex < 0 || toIndex < 0 || toIndex >= images.length) return;
        var moved = images.splice(fromIndex, 1)[0];
        images.splice(toIndex, 0, moved);
        saveMarqueeOrder(images);
      }

      marqueeAdminList.addEventListener("click", async function (event) {
        var moveButton = event.target instanceof Element ? event.target.closest("button[data-marquee-move]") : null;
        if (moveButton) {
          event.preventDefault();
          moveMarqueeImage(moveButton.getAttribute("data-marquee-id"), moveButton.getAttribute("data-marquee-move") === "up" ? -1 : 1);
          return;
        }
        var button = getClosestActionButton(event.target, "data-marquee-id");
        if (!button) {
          return;
        }
        event.preventDefault();
        var id = button.getAttribute("data-marquee-id");
        try {
          await VisionStore.deleteMarqueeImage(id);
          setStatus("contentStatus", t("status_marquee_removed", "Marquee image removed."), false);
        } catch (error) {
          setStatus("contentStatus", error && error.message ? error.message : "Unable to remove marquee image.", true);
        }
      });

      marqueeAdminList.addEventListener("dragstart", function (event) {
        var handle = event.target instanceof Element ? event.target.closest("[data-marquee-drag-handle]") : null;
        var row = handle && handle.closest("[data-marquee-row-id]");
        if (!row || !event.dataTransfer) return;
        draggedMarqueeId = row.getAttribute("data-marquee-row-id");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedMarqueeId);
        row.classList.add("is-dragging");
      });

      marqueeAdminList.addEventListener("dragover", function (event) {
        var row = event.target instanceof Element ? event.target.closest("[data-marquee-row-id]") : null;
        if (!row || !draggedMarqueeId || row.getAttribute("data-marquee-row-id") === draggedMarqueeId) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        marqueeAdminList.querySelectorAll(".is-drop-target").forEach(function (item) { item.classList.remove("is-drop-target"); });
        row.classList.add("is-drop-target");
      });

      marqueeAdminList.addEventListener("drop", function (event) {
        var row = event.target instanceof Element ? event.target.closest("[data-marquee-row-id]") : null;
        var targetId = row && row.getAttribute("data-marquee-row-id");
        var sourceId = event.dataTransfer && event.dataTransfer.getData("text/plain") || draggedMarqueeId;
        if (!row || !sourceId || !targetId || sourceId === targetId) return;
        event.preventDefault();
        var images = VisionStore.getSiteData().marqueeImages || [];
        var fromIndex = images.findIndex(function (item) { return String(item.id) === String(sourceId); });
        var toIndex = images.findIndex(function (item) { return String(item.id) === String(targetId); });
        if (fromIndex < 0 || toIndex < 0) return;
        var moved = images.splice(fromIndex, 1)[0];
        if (fromIndex < toIndex) toIndex -= 1;
        images.splice(toIndex, 0, moved);
        saveMarqueeOrder(images);
      });

      marqueeAdminList.addEventListener("dragend", function () {
        draggedMarqueeId = "";
        marqueeAdminList.querySelectorAll(".is-dragging, .is-drop-target").forEach(function (item) {
          item.classList.remove("is-dragging", "is-drop-target");
        });
      });
    }

    if (newsForm) {
      var newsDateInput = newsForm.elements.date;
      if (newsDateInput && !newsDateInput.value) {
        newsDateInput.value = VisionStore.todayISO();
      }

      newsForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var title = clean(newsForm.elements.title.value);
        var date = clean(newsForm.elements.date.value);
        var summary = clean(newsForm.elements.summary.value);
        if (!title || !date || !summary) {
          return;
        }
        try {
          await VisionStore.addNews({ title: title, date: date, summary: summary });
          newsForm.reset();
          newsForm.elements.date.value = VisionStore.todayISO();
          setStatus("newsStatus", "News added successfully.", false);
        } catch (error) {
          setStatus("newsStatus", error && error.message ? error.message : "Unable to add news.", true);
        }
      });
    }

    if (newsAdminList) {
      newsAdminList.addEventListener("click", async function (event) {
        var button = getClosestActionButton(event.target, "data-news-id");
        if (!button) {
          return;
        }
        event.preventDefault();
        var id = button.getAttribute("data-news-id");
        try {
          await VisionStore.deleteNews(id);
          setStatus("newsStatus", "News deleted successfully.", false);
        } catch (error) {
          setStatus("newsStatus", error && error.message ? error.message : "Unable to delete news.", true);
        }
      });
    }

    if (instagramForm) {
      instagramForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var rawInput = clean(instagramForm.elements.postUrl.value);
        var postUrl = extractInstagramPostUrl(rawInput);
        if (!postUrl || !getInstagramEmbedUrl(postUrl)) {
          window.alert(t("admin_instagram_invalid", "Please enter a valid Instagram post URL or embed code."));
          return;
        }
        try {
          await VisionStore.addInstagramPost(postUrl);
          instagramForm.reset();
        } catch (error) {
          window.alert(error && error.message ? error.message : "Unable to add Instagram post.");
        }
      });
    }

    if (instagramAdminList) {
      instagramAdminList.addEventListener("click", async function (event) {
        var button = getClosestActionButton(event.target, "data-ig-id");
        if (!button) {
          return;
        }
        event.preventDefault();
        var id = button.getAttribute("data-ig-id");
        try {
          await VisionStore.deleteInstagramPost(id);
        } catch (error) {
          window.alert(error && error.message ? error.message : "Unable to delete Instagram post.");
        }
      });
    }

    if (exportButton) {
      exportButton.addEventListener("click", exportApplicationsCSV);
    }

    if (clearApplicationsButton) {
      clearApplicationsButton.addEventListener("click", async function () {
        if (!VisionStore.getApplications().length) {
          setStatus("applicationsStatus", t("alert_no_applications", "No applications to export."), true);
          return;
        }
        if (!window.confirm(t("confirm_clear_submissions", "Clear all submitted applications from the admin table? Make sure you already exported the CSV if you need a backup."))) {
          return;
        }
        try {
          var removedCount = await VisionStore.clearApplications();
          setStatus("applicationsStatus", t("status_submissions_cleared", "Application submissions cleared successfully.").replace("{count}", String(removedCount)), false);
        } catch (error) {
          setStatus("applicationsStatus", error && error.message ? error.message : t("status_submissions_clear_failed", "Unable to clear submissions right now."), true);
        }
      });
    }

    adminViewButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setActiveAdminView(button.getAttribute("data-admin-view-target"));
      });
    });

    window.addEventListener("hashchange", function () {
      setActiveAdminView(getPreferredAdminView());
    });

    window.addEventListener("vision-language-changed", function () {
      setActiveAdminView(getPreferredAdminView());
    });

    updateWorkspaceCopy(getPreferredAdminView());

    window.addEventListener("beforeunload", stopDashboardSubscriptions);
  });
})();
