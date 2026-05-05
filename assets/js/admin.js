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
    }
  }

  function setLoginPending(isPending) {
    var loginForm = byId("loginForm");
    var passwordInput = byId("adminPassword");
    var submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    if (passwordInput) {
      passwordInput.disabled = Boolean(isPending);
    }
    if (submitButton) {
      submitButton.disabled = Boolean(isPending);
      submitButton.textContent = isPending ? "Logging in..." : t("btn_login", "Login");
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

    images.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "marquee-upload-item";

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

      row.appendChild(name);
      row.appendChild(sourceLink);
      row.appendChild(removeButton);
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
      } else {
        stopDashboardSubscriptions();
        clearLoginForm();
      }
    });

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
          await VisionStore.bootstrapDefaultContent();
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
        var siteData = VisionStore.getSiteData();
        siteData.tagline = clean(siteContentForm.elements.tagline.value);
        siteData.heroTitle = clean(siteContentForm.elements.heroTitle.value);
        siteData.heroText = clean(siteContentForm.elements.heroText.value);
        siteData.announcement = clean(siteContentForm.elements.announcement.value);
        siteData.address = clean(siteContentForm.elements.address.value);
        siteData.phone = clean(siteContentForm.elements.phone.value);
        siteData.email = clean(siteContentForm.elements.email.value);
        siteData.instagramProfileUrl = clean(siteContentForm.elements.instagramProfileUrl.value);
        siteData.facebookProfileUrl = clean(siteContentForm.elements.facebookProfileUrl.value);
        siteData.marqueeImages = parseMarqueeLinks(siteContentForm.elements.marqueeImageLinks.value);

        try {
          await VisionStore.saveSiteData(siteData);
          setStatus("contentStatus", t("status_content_saved", "Website information updated successfully."), false);
        } catch (error) {
          setStatus("contentStatus", error && error.message ? error.message : "Unable to save website information.", true);
        }
      });
    }

    if (marqueeAdminList) {
      marqueeAdminList.addEventListener("click", async function (event) {
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
