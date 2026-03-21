(function () {
  "use strict";

  function t(key, fallback) {
    if (window.VisionI18n && typeof window.VisionI18n.t === "function") {
      return window.VisionI18n.t(key);
    }
    return fallback || key;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function clean(value) {
    return String(value || "").trim();
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
      window.alert(t("alert_no_applications", "No applications to export."));
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

    var unsubscribeSite = null;
    var unsubscribeNews = null;
    var unsubscribeApplications = null;
    var storeReadyPromise = VisionStore.ready();

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
      } else {
        stopDashboardSubscriptions();
      }
    });

    if (loginForm) {
      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var password = clean(byId("adminPassword").value);
        try {
          await storeReadyPromise;
          await VisionStore.loginAdmin(password);
          await VisionStore.bootstrapDefaultContent();
          setStatus("loginStatus", t("status_login_success", "Login successful."), false);
        } catch (error) {
          setStatus("loginStatus", error && error.message ? error.message : t("status_login_failed", "Incorrect password."), true);
        }
      });
    }

    await storeReadyPromise;

    if (logoutButton) {
      logoutButton.addEventListener("click", async function () {
        try {
          await VisionStore.logoutAdmin();
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
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var id = target.getAttribute("data-marquee-id");
        if (!id) {
          return;
        }
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
        } catch (error) {
          window.alert(error && error.message ? error.message : "Unable to add news.");
        }
      });
    }

    if (newsAdminList) {
      newsAdminList.addEventListener("click", async function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var id = target.getAttribute("data-news-id");
        if (!id) {
          return;
        }
        try {
          await VisionStore.deleteNews(id);
        } catch (error) {
          window.alert(error && error.message ? error.message : "Unable to delete news.");
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
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var id = target.getAttribute("data-ig-id");
        if (!id) {
          return;
        }
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

    window.addEventListener("beforeunload", stopDashboardSubscriptions);
  });
})();
