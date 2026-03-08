(function () {
  "use strict";

  var STORAGE_KEYS = {
    siteData: "vision_academy_site_data_v1",
    applications: "vision_academy_applications_v1",
    adminSession: "vision_academy_admin_session_v1",
    language: "vision_academy_language_v1"
  };

  var DEFAULT_SITE_DATA = {
    profileVersion: 10,
    academyName: "VISION EDUCATION ACADEMY",
    tagline: "Coaching for School, Board, and Entrance Success",
    heroTitle: "Build your future with guided preparation.",
    heroText: "Vision Academy helps students with expert faculty, weekly tests, and personal mentoring.",
    announcement: "Admissions open for 2026 batch. Free counseling session every Saturday.",
    address: "NAVA SANNATHI STREET, VILLIANUR - PUDUCHERRY",
    phone: "9894382305 / 9994905624",
    email: "visionedudomain@gmail.com",
    instagramProfileUrl: "https://www.instagram.com/visioneduacademy/",
    facebookProfileUrl: "https://www.facebook.com/visioneducacademy",
    mapUrl: "https://maps.app.goo.gl/K3Fg2R2XbR58NR3i9",
    marqueeImages: [
      {
        name: "WhatsApp Image 2026-03-05 at 11.35.05 AM.jpeg",
        src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.05 AM.jpeg"
      },
      {
        name: "WhatsApp Image 2026-03-05 at 11.35.03 AM.jpeg",
        src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.03 AM.jpeg"
      },
      {
        name: "WhatsApp Image 2026-03-05 at 11.35.06 AM.jpeg",
        src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.06 AM.jpeg"
      }
    ],
    instagramPosts: [
      {
        id: "ig_default_001",
        url: "https://www.instagram.com/p/DVfjAxWgcoH/"
      }
    ],
    programs: [
      {
        title: "Foundation Program",
        description: "For Class 9 and 10 students with concept-level preparation in Maths and Science."
      },
      {
        title: "Board Preparation",
        description: "Focused support for Class 10 and 12 board exams with regular tests and revision."
      },
      {
        title: "JEE / NEET Entrance",
        description: "Subject-wise coaching with structured practice and performance tracking."
      }
    ],
    news: [
      {
        id: "news_001",
        title: "Admissions Open for 2026 Session",
        date: "2026-03-01",
        summary: "New classroom and hybrid batches are open for board and entrance preparation."
      },
      {
        id: "news_002",
        title: "Sunday Mock Test Series Started",
        date: "2026-02-25",
        summary: "Weekly offline and online mock tests are available for enrolled students."
      }
    ]
  };

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJSON(key, fallbackValue) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return deepCopy(fallbackValue);
      }
      var parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) {
        return deepCopy(fallbackValue);
      }
      return parsed;
    } catch (error) {
      return deepCopy(fallbackValue);
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getMarqueeNameFromSource(src, index) {
    var text = String(src || "").trim();
    if (!text) {
      return "image-" + String(index);
    }

    if (/^data:image\//i.test(text)) {
      return "uploaded-image-" + String(index);
    }

    if (/^https?:\/\//i.test(text)) {
      try {
        var url = new URL(text);
        var remoteName = url.pathname.split("/").filter(Boolean).pop();
        if (remoteName) {
          return decodeURIComponent(remoteName);
        }
      } catch (error) {
        // ignore malformed remote url and fallback below
      }
    }

    var localName = text.split(/[?#]/)[0].split("/").filter(Boolean).pop();
    return localName || "image-" + String(index);
  }

  function sanitizeMarqueeItems(list) {
    if (!Array.isArray(list)) {
      return deepCopy(DEFAULT_SITE_DATA.marqueeImages);
    }

    var safeItems = list
      .map(function (item, index) {
        if (typeof item === "string") {
          var stringSource = item.trim();
          if (!stringSource) {
            return null;
          }
          return {
            name: getMarqueeNameFromSource(stringSource, index + 1),
            src: stringSource
          };
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        var source = String(item.src || item.url || "").trim();
        if (!source) {
          return null;
        }

        return {
          name: String(item.name || "").trim() || getMarqueeNameFromSource(source, index + 1),
          src: source
        };
      })
      .filter(Boolean);

    return safeItems.length ? safeItems : deepCopy(DEFAULT_SITE_DATA.marqueeImages);
  }

  function sanitizeSiteData(siteData) {
    var safe = siteData && typeof siteData === "object" ? siteData : {};
    var defaults = DEFAULT_SITE_DATA;

    return {
      profileVersion: defaults.profileVersion,
      academyName: safe.academyName || defaults.academyName,
      tagline: safe.tagline || defaults.tagline,
      heroTitle: safe.heroTitle || defaults.heroTitle,
      heroText: safe.heroText || defaults.heroText,
      announcement: safe.announcement || defaults.announcement,
      address: safe.address || defaults.address,
      phone: safe.phone || defaults.phone,
      email: safe.email || defaults.email,
      instagramProfileUrl: safe.instagramProfileUrl || defaults.instagramProfileUrl,
      facebookProfileUrl: safe.facebookProfileUrl || defaults.facebookProfileUrl,
      mapUrl: safe.mapUrl || defaults.mapUrl,
      marqueeImages: sanitizeMarqueeItems(safe.marqueeImages),
      instagramPosts: Array.isArray(safe.instagramPosts) ? safe.instagramPosts : deepCopy(defaults.instagramPosts),
      programs: Array.isArray(safe.programs) && safe.programs.length ? safe.programs : deepCopy(defaults.programs),
      news: Array.isArray(safe.news) ? safe.news : deepCopy(defaults.news)
    };
  }

  function getSiteData() {
    var saved = readJSON(STORAGE_KEYS.siteData, DEFAULT_SITE_DATA);
    return sanitizeSiteData(saved);
  }

  function saveSiteData(siteData) {
    writeJSON(STORAGE_KEYS.siteData, sanitizeSiteData(siteData));
  }

  function getApplications() {
    var saved = readJSON(STORAGE_KEYS.applications, []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveApplications(applications) {
    writeJSON(STORAGE_KEYS.applications, Array.isArray(applications) ? applications : []);
  }

  function addApplication(application) {
    var apps = getApplications();
    apps.unshift(application);
    saveApplications(apps);
  }

  function setAdminSession(isLoggedIn) {
    if (isLoggedIn) {
      sessionStorage.setItem(STORAGE_KEYS.adminSession, "1");
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.adminSession);
    }
  }

  function getAdminSession() {
    return sessionStorage.getItem(STORAGE_KEYS.adminSession) === "1";
  }

  function formatDisplayDate(dateText) {
    if (!dateText) {
      return "-";
    }
    var date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return dateText;
    }
    var lang = localStorage.getItem(STORAGE_KEYS.language) === "ta" ? "ta-IN" : "en-IN";
    return date.toLocaleDateString(lang, {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function todayISO() {
    var now = new Date();
    return now.toISOString().slice(0, 10);
  }

  if (!localStorage.getItem(STORAGE_KEYS.siteData)) {
    writeJSON(STORAGE_KEYS.siteData, DEFAULT_SITE_DATA);
  } else {
    var savedSiteData = readJSON(STORAGE_KEYS.siteData, DEFAULT_SITE_DATA);
    if (!savedSiteData.profileVersion || savedSiteData.profileVersion < 2) {
      savedSiteData.profileVersion = 2;
      savedSiteData.academyName = "VISION EDUCATION ACADEMY";
      savedSiteData.address = "NAVA SANATHI STREET, VILLIANUR - PUDUCHERRY";
      savedSiteData.phone = "9894382305 / 9994905624";
    }
    if (savedSiteData.profileVersion < 3) {
      savedSiteData.profileVersion = 3;
      savedSiteData.email = savedSiteData.email || "visionedudomain@gmail.com";
      savedSiteData.instagramProfileUrl = savedSiteData.instagramProfileUrl || "https://www.instagram.com/visioneduacademy/";
      savedSiteData.instagramPosts = Array.isArray(savedSiteData.instagramPosts) ? savedSiteData.instagramPosts : [];
    }
    if (savedSiteData.profileVersion < 4) {
      savedSiteData.profileVersion = 4;
      if (!Array.isArray(savedSiteData.instagramPosts) || savedSiteData.instagramPosts.length === 0) {
        savedSiteData.instagramPosts = [
          {
            id: "ig_default_001",
            url: "https://www.instagram.com/p/DVfjAxWgcoH/"
          }
        ];
      }
    }
    if (savedSiteData.profileVersion < 5) {
      savedSiteData.profileVersion = 5;
      savedSiteData.facebookProfileUrl = savedSiteData.facebookProfileUrl || "https://www.facebook.com/VisionEducationAcademy/";
    }
    if (savedSiteData.profileVersion < 6) {
      savedSiteData.profileVersion = 6;
      savedSiteData.facebookProfileUrl = "https://www.facebook.com/visioneducacademy";
    }
    if (savedSiteData.profileVersion < 7) {
      savedSiteData.profileVersion = 7;
      var currentAddress = String(savedSiteData.address || "");
      if (!currentAddress) {
        savedSiteData.address = "NAVA SANNATHI STREET, VILLIANUR - PUDUCHERRY";
      } else {
        savedSiteData.address = currentAddress.replace(/sanathi/ig, "sannathi");
      }
      savedSiteData.mapUrl = "https://maps.app.goo.gl/jXyqexjjzim8nyAb8";
    }
    if (savedSiteData.profileVersion < 8) {
      savedSiteData.profileVersion = 8;
      savedSiteData.mapUrl = "https://maps.app.goo.gl/K3Fg2R2XbR58NR3i9";
    }
    if (savedSiteData.profileVersion < 9) {
      savedSiteData.profileVersion = 9;
      if (!Array.isArray(savedSiteData.marqueeImages) || !savedSiteData.marqueeImages.length) {
        savedSiteData.marqueeImages = [
          {
            name: "WhatsApp Image 2026-03-05 at 11.35.05 AM.jpeg",
            src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.05 AM.jpeg"
          },
          {
            name: "WhatsApp Image 2026-03-05 at 11.35.03 AM.jpeg",
            src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.03 AM.jpeg"
          },
          {
            name: "WhatsApp Image 2026-03-05 at 11.35.06 AM.jpeg",
            src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.06 AM.jpeg"
          }
        ];
      }
    }
    if (savedSiteData.profileVersion < 10) {
      savedSiteData.profileVersion = 10;
    }
    writeJSON(STORAGE_KEYS.siteData, sanitizeSiteData(savedSiteData));
  }

  if (!localStorage.getItem(STORAGE_KEYS.applications)) {
    writeJSON(STORAGE_KEYS.applications, []);
  }

  window.VisionStore = {
    ADMIN_PASSWORD: "VisionAdmin@123",
    getSiteData: getSiteData,
    saveSiteData: saveSiteData,
    getApplications: getApplications,
    saveApplications: saveApplications,
    addApplication: addApplication,
    setAdminSession: setAdminSession,
    getAdminSession: getAdminSession,
    formatDisplayDate: formatDisplayDate,
    todayISO: todayISO
  };
})();
