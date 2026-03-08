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

  function setYear() {
    var yearElement = byId("year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }
  }

  function setStatus(id, message, isError) {
    var element = byId(id);
    if (!element) {
      return;
    }
    element.textContent = message;
    element.classList.remove("status-success", "status-error");
    element.classList.add(isError ? "status-error" : "status-success");
  }

  function clean(value) {
    return (value || "").toString().trim();
  }

  function isDataImageSource(value) {
    return /^data:image\//i.test(String(value || "").trim());
  }

  function getUploadedMarqueeEntries(items) {
    return (Array.isArray(items) ? items : []).filter(function (item) {
      return item && typeof item === "object" && isDataImageSource(item.src);
    });
  }

  function readFileAsMarqueeItem(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve({
          name: file && file.name ? String(file.name) : ("uploaded-image-" + Date.now()),
          src: String(reader.result || "")
        });
      };
      reader.onerror = function () {
        reject(new Error("Failed to read file."));
      };
      reader.readAsDataURL(file);
    });
  }

  function readFilesAsMarqueeItems(fileList) {
    return Promise.all(Array.prototype.map.call(fileList || [], readFileAsMarqueeItem));
  }

  function getInstagramEmbedUrl(postUrl) {
    var text = String(postUrl || "").trim();
    var match = text.match(/^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
    if (!match) {
      return "";
    }
    return "https://www.instagram.com/" + match[1].toLowerCase() + "/" + match[2] + "/embed";
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

  function sortByLatest(newsItems) {
    return newsItems.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  function populateSiteForm() {
    var form = byId("siteContentForm");
    if (!form) {
      return;
    }

    var siteData = VisionStore.getSiteData();
    form.elements.tagline.value = siteData.tagline || "";
    form.elements.heroTitle.value = siteData.heroTitle || "";
    form.elements.heroText.value = siteData.heroText || "";
    form.elements.announcement.value = siteData.announcement || "";
    form.elements.address.value = siteData.address || "";
    form.elements.phone.value = siteData.phone || "";
    form.elements.email.value = siteData.email || "";
    form.elements.instagramProfileUrl.value = siteData.instagramProfileUrl || "";
    form.elements.facebookProfileUrl.value = siteData.facebookProfileUrl || "";
    syncMarqueeInputs();

    renderMarqueeAdminList();
  }

  function renderMarqueeAdminList() {
    var container = byId("marqueeAdminList");
    if (!container) {
      return;
    }

    var siteData = VisionStore.getSiteData();
    var images = getUploadedMarqueeEntries(siteData.marqueeImages);
    container.innerHTML = "";

    if (!images.length) {
      container.innerHTML = "<p class='empty-text'>" + t("admin_marquee_empty", "No marquee images added yet.") + "</p>";
      return;
    }

    (siteData.marqueeImages || []).forEach(function (item, index) {
      if (!item || typeof item !== "object" || !isDataImageSource(item.src)) {
        return;
      }

      var row = document.createElement("div");
      row.className = "marquee-upload-item";

      var name = document.createElement("p");
      name.className = "marquee-upload-name";
      name.textContent = item.name || t("admin_marquee_uploaded_label", "Uploaded image");

      var removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "btn btn-danger";
      removeButton.textContent = t("btn_delete", "Delete");
      removeButton.setAttribute("data-marquee-index", String(index));

      row.appendChild(name);
      row.appendChild(removeButton);
      container.appendChild(row);
    });
  }

  function syncMarqueeInputs() {
    var uploadInput = byId("marqueeImageFiles");
    if (uploadInput) {
      uploadInput.value = "";
    }
  }

  function renderNewsAdminList() {
    var container = byId("newsAdminList");
    if (!container) {
      return;
    }

    var siteData = VisionStore.getSiteData();
    var newsList = Array.isArray(siteData.news) ? siteData.news : [];

    container.innerHTML = "";

    if (newsList.length === 0) {
      container.innerHTML = "<p class='empty-text'>" + t("admin_news_empty", "No news added yet.") + "</p>";
      return;
    }

    sortByLatest(newsList).forEach(function (item) {
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

  function renderApplicationsTable() {
    var body = byId("applicationsTableBody");
    if (!body) {
      return;
    }

    var applications = VisionStore.getApplications();
    body.innerHTML = "";

    if (!applications.length) {
      body.innerHTML = "<tr><td colspan='6'>" + t("admin_applications_empty", "No applications submitted yet.") + "</td></tr>";
      return;
    }

    applications.forEach(function (app) {
      var tr = document.createElement("tr");
      var cells = [
        app.candidateName || app.studentName || "-",
        app.fatherName || "-",
        app.mobile || app.phone || "-",
        app.dob ? VisionStore.formatDisplayDate(app.dob) : "-",
        app.category || "-",
        VisionStore.formatDisplayDate(app.submittedAt)
      ];

      cells.forEach(function (value) {
        var td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      body.appendChild(tr);
    });
  }

  function renderInstagramAdminList() {
    var container = byId("instagramAdminList");
    if (!container) {
      return;
    }

    var siteData = VisionStore.getSiteData();
    var postList = Array.isArray(siteData.instagramPosts) ? siteData.instagramPosts : [];
    container.innerHTML = "";

    if (!postList.length) {
      container.innerHTML = "<p class='empty-text'>" + t("admin_instagram_empty", "No Instagram posts added yet.") + "</p>";
      return;
    }

    postList.forEach(function (entry, index) {
      var url = typeof entry === "string" ? entry : entry && entry.url;
      var id = entry && entry.id ? entry.id : "";
      if (!url) {
        return;
      }

      var article = document.createElement("article");
      article.className = "news-item";

      var header = document.createElement("div");
      header.className = "news-item-header";

      var link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "text-link";
      link.textContent = url;

      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger";
      deleteButton.textContent = t("btn_delete", "Delete");
      deleteButton.setAttribute("data-ig-id", id);
      deleteButton.setAttribute("data-ig-index", String(index));

      header.appendChild(link);
      header.appendChild(deleteButton);
      article.appendChild(header);

      container.appendChild(article);
    });
  }

  function initializeDashboard() {
    populateSiteForm();
    renderNewsAdminList();
    renderInstagramAdminList();
    renderApplicationsTable();

    var newsDateInput = byId("newsForm") && byId("newsForm").elements.date;
    if (newsDateInput && !newsDateInput.value) {
      newsDateInput.value = VisionStore.todayISO();
    }
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
        app.candidateName || app.studentName || "",
        app.fatherName || "",
        app.motherName || "",
        app.dob || "",
        app.gender || "",
        app.qualification || "",
        app.religion || "",
        app.category || "",
        app.mobile || app.phone || "",
        app.address || "",
        app.submittedAt || ""
      ];
    });

    function csvCell(value) {
      var text = String(value || "");
      if (/[",\n]/.test(text)) {
        return "\"" + text.replace(/"/g, "\"\"") + "\"";
      }
      return text;
    }

    var csv = [headers.join(",")]
      .concat(rows.map(function (row) {
        return row.map(csvCell).join(",");
      }))
      .join("\n");

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

  document.addEventListener("DOMContentLoaded", function () {
    setYear();

    var loginForm = byId("loginForm");
    var logoutButton = byId("logoutButton");
    var siteContentForm = byId("siteContentForm");
    var newsForm = byId("newsForm");
    var newsAdminList = byId("newsAdminList");
    var instagramForm = byId("instagramPostForm");
    var instagramAdminList = byId("instagramAdminList");
    var marqueeImageFiles = byId("marqueeImageFiles");
    var marqueeAdminList = byId("marqueeAdminList");
    var exportButton = byId("exportApplications");

    toggleDashboard(VisionStore.getAdminSession());
    if (VisionStore.getAdminSession()) {
      initializeDashboard();
    }

    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var password = clean(byId("adminPassword").value);

        if (password !== VisionStore.ADMIN_PASSWORD) {
          setStatus("loginStatus", t("status_login_failed", "Incorrect password."), true);
          VisionStore.setAdminSession(false);
          toggleDashboard(false);
          return;
        }

        VisionStore.setAdminSession(true);
        setStatus("loginStatus", t("status_login_success", "Login successful."), false);
        toggleDashboard(true);
        initializeDashboard();
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", function () {
        VisionStore.setAdminSession(false);
        toggleDashboard(false);
        setStatus("loginStatus", "");
      });
    }

    if (siteContentForm) {
      siteContentForm.addEventListener("submit", function (event) {
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

        VisionStore.saveSiteData(siteData);
        renderMarqueeAdminList();
        setStatus("contentStatus", t("status_content_saved", "Website information updated successfully."), false);
      });
    }

    if (marqueeImageFiles) {
      marqueeImageFiles.addEventListener("change", function () {
        var files = marqueeImageFiles.files;
        if (!files || !files.length) {
          return;
        }

        readFilesAsMarqueeItems(files)
          .then(function (items) {
            var siteData = VisionStore.getSiteData();
            siteData.marqueeImages = getUploadedMarqueeEntries(siteData.marqueeImages).concat(items);
            VisionStore.saveSiteData(siteData);
            syncMarqueeInputs();
            renderMarqueeAdminList();
            setStatus("contentStatus", t("status_marquee_upload_saved", "Marquee images uploaded successfully."), false);
          })
          .catch(function () {
            setStatus("contentStatus", t("status_marquee_upload_failed", "Unable to upload marquee images."), true);
          });
      });
    }

    if (marqueeAdminList) {
      marqueeAdminList.addEventListener("click", function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        var indexText = target.getAttribute("data-marquee-index");
        if (indexText === null) {
          return;
        }

        var siteData = VisionStore.getSiteData();
        var index = Number(indexText);
        siteData.marqueeImages = (siteData.marqueeImages || []).filter(function (_item, itemIndex) {
          return itemIndex !== index;
        });
        VisionStore.saveSiteData(siteData);
        renderMarqueeAdminList();
        setStatus("contentStatus", t("status_marquee_removed", "Marquee image removed."), false);
      });
    }

    if (newsForm) {
      newsForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var title = clean(newsForm.elements.title.value);
        var date = clean(newsForm.elements.date.value);
        var summary = clean(newsForm.elements.summary.value);

        if (!title || !date || !summary) {
          return;
        }

        var siteData = VisionStore.getSiteData();
        var item = {
          id: "news_" + Date.now(),
          title: title,
          date: date,
          summary: summary
        };

        siteData.news = Array.isArray(siteData.news) ? siteData.news : [];
        siteData.news.unshift(item);
        VisionStore.saveSiteData(siteData);
        newsForm.reset();
        newsForm.elements.date.value = VisionStore.todayISO();
        renderNewsAdminList();
      });
    }

    if (newsAdminList) {
      newsAdminList.addEventListener("click", function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var id = target.getAttribute("data-news-id");
        if (!id) {
          return;
        }

        var siteData = VisionStore.getSiteData();
        siteData.news = (siteData.news || []).filter(function (item) {
          return String(item.id) !== String(id);
        });

        VisionStore.saveSiteData(siteData);
        renderNewsAdminList();
      });
    }

    if (instagramForm) {
      instagramForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var rawInput = clean(instagramForm.elements.postUrl.value);
        var postUrl = extractInstagramPostUrl(rawInput);
        if (!postUrl || !getInstagramEmbedUrl(postUrl)) {
          window.alert(t("admin_instagram_invalid", "Please enter a valid Instagram post URL or embed code."));
          return;
        }

        var siteData = VisionStore.getSiteData();
        siteData.instagramPosts = Array.isArray(siteData.instagramPosts) ? siteData.instagramPosts : [];
        siteData.instagramPosts.unshift({
          id: "ig_" + Date.now(),
          url: postUrl
        });
        VisionStore.saveSiteData(siteData);
        instagramForm.reset();
        renderInstagramAdminList();
      });
    }

    if (instagramAdminList) {
      instagramAdminList.addEventListener("click", function (event) {
        var target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        var id = target.getAttribute("data-ig-id");
        var indexText = target.getAttribute("data-ig-index");
        if (!id && indexText === null) {
          return;
        }
        var indexNumber = Number(indexText);

        var siteData = VisionStore.getSiteData();
        siteData.instagramPosts = (siteData.instagramPosts || []).filter(function (entry, index) {
          if (id) {
            return String(entry.id) !== String(id);
          }
          return index !== indexNumber;
        });
        VisionStore.saveSiteData(siteData);
        renderInstagramAdminList();
      });
    }

    if (exportButton) {
      exportButton.addEventListener("click", exportApplicationsCSV);
    }

    window.addEventListener("vision-language-changed", function () {
      renderMarqueeAdminList();
      renderNewsAdminList();
      renderInstagramAdminList();
      renderApplicationsTable();
    });
  });
})();
