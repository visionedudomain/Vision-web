(function () {
  "use strict";

  function t(key, fallback) {
    if (window.VisionI18n && typeof window.VisionI18n.t === "function") {
      return window.VisionI18n.t(key);
    }
    return fallback || key;
  }

  var DEFAULT_HOME_CONTENT = {
    tagline: "Coaching for Entrance Success",
    heroTitle: "Build your future with guided preparation.",
    heroText: "Vision Academy helps students with expert faculty, weekly tests, and personal mentoring.",
    announcement: "Admissions open for LDC / UDC / GALLARY ASSISTANT / JUNIOR LIBRARY ASSISTANT."
  };

  var DEFAULT_HOME_CONTENT_TA = {
    tagline: "\u0baa\u0bcb\u0b9f\u0bcd\u0b9f\u0bbf\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1 \u0bb5\u0bc6\u0bb1\u0bcd\u0bb1\u0bbf\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf",
    heroTitle: "\u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bb2\u0bc1\u0b9f\u0ba9\u0bcd \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b8e\u0ba4\u0bbf\u0bb0\u0bcd\u0b95\u0bbe\u0bb2\u0ba4\u0bcd\u0ba4\u0bc8 \u0b89\u0bb0\u0bc1\u0bb5\u0bbe\u0b95\u0bcd\u0b95\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd.",
    heroText: "\u0bb5\u0bbf\u0bb7\u0ba9\u0bcd \u0b95\u0bb2\u0bcd\u0bb5\u0bbf \u0bae\u0bc8\u0baf\u0bae\u0bcd \u0ba4\u0bbf\u0bb1\u0bae\u0bc8\u0baf\u0bbe\u0ba9 \u0b86\u0b9a\u0bbf\u0bb0\u0bbf\u0baf\u0bb0\u0bcd\u0b95\u0bb3\u0bcd, \u0bb5\u0bbe\u0bb0\u0bbe\u0ba8\u0bcd\u0ba4\u0bbf\u0bb0 \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0ba4\u0ba9\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bc1\u0ba4\u0bb2\u0bc1\u0b9f\u0ba9\u0bcd \u0bae\u0bbe\u0ba3\u0bb5\u0bb0\u0bcd\u0b95\u0bb3\u0bc8 \u0bae\u0bc1\u0ba9\u0bcd\u0ba9\u0bc7\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",
    announcement: "\u0b9a\u0bc7\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bc8\u0b95\u0bb3\u0bcd LDC / UDC / GALLARY ASSISTANT / JUNIOR LIBRARY ASSISTANT \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bbe\u0b95 \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95\u0bbf\u0baf\u0bc1\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1."
  };

  var ACADEMY_HIGHLIGHTS = {
    en: {
      title: "Why Vision Education Academy?",
      subtitle: "Key strengths that make our coaching different.",
      points: [
        "Lowest Fees with the highest quality education and guidance",
        "Covers all Subjects in both Tamil and English",
        "Total 20 Tests - Paper I & Paper II (Combined)",
        "Question Papers in Tamil & English",
        "2 Batches (Morning & Evening)",
        "Both online and offline model test",
        "Question Paper discussion sessions",
        "Special notes for all subjects"
      ]
    },
    ta: {
      title: "\u0bb5\u0bbf\u0bb7\u0ba9\u0bcd \u0b95\u0bb2\u0bcd\u0bb5\u0bbf \u0bae\u0bc8\u0baf\u0bae\u0bcd \u0b8f\u0ba9\u0bcd?",
      subtitle: "\u0b8e\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf \u0bae\u0bc8\u0baf\u0ba4\u0bcd\u0ba4\u0bbf\u0ba9\u0bcd \u0ba4\u0ba9\u0bbf\u0b9a\u0bcd\u0b9a\u0bbf\u0bb1\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd.",
      points: [
        "\u0b95\u0bc1\u0bb1\u0bc8\u0ba8\u0bcd\u0ba4 \u0b95\u0b9f\u0bcd\u0b9f\u0ba3\u0ba4\u0bcd\u0ba4\u0bbf\u0bb2\u0bcd \u0b89\u0baf\u0bb0\u0bcd\u0ba4\u0bb0 \u0b95\u0bb2\u0bcd\u0bb5\u0bbf \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bc1\u0ba4\u0bb2\u0bcd",
        "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b86\u0b99\u0bcd\u0b95\u0bbf\u0bb2\u0bae\u0bcd \u0b86\u0b95\u0bbf\u0baf \u0b87\u0bb0\u0bc1 \u0bae\u0bca\u0bb4\u0bbf\u0b95\u0bb3\u0bbf\u0bb2\u0bc1\u0bae\u0bcd \u0b85\u0ba9\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1 \u0baa\u0bbe\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bcd",
        "\u0bae\u0bca\u0ba4\u0bcd\u0ba4\u0bae\u0bcd 20 \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bcd - \u0baa\u0bc7\u0baa\u0bcd\u0baa\u0bb0\u0bcd I & \u0baa\u0bc7\u0baa\u0bcd\u0baa\u0bb0\u0bcd II (\u0b87\u0ba3\u0bc8\u0ba8\u0bcd\u0ba4\u0bc1)",
        "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd & \u0b86\u0b99\u0bcd\u0b95\u0bbf\u0bb2\u0bae\u0bcd \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf\u0ba4\u0bcd\u0ba4\u0bbe\u0bb3\u0bcd\u0b95\u0bb3\u0bcd",
        "2 \u0baa\u0bc7\u0b9f\u0bcd\u0b9a\u0bcd\u0b95\u0bb3\u0bcd (\u0b95\u0bbe\u0bb2\u0bc8 & \u0bae\u0bbe\u0bb2\u0bc8)",
        "\u0b86\u0ba9\u0bcd\u0bb2\u0bc8\u0ba9\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b86\u0b83\u0baa\u0bcd\u0bb2\u0bc8\u0ba9\u0bcd \u0bae\u0bbe\u0b9f\u0bb2\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bcd",
        "\u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf\u0ba4\u0bcd\u0ba4\u0bbe\u0bb3\u0bcd \u0bb5\u0bbf\u0bb5\u0bbe\u0ba4 \u0b85\u0bae\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bcd",
        "\u0b85\u0ba9\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1 \u0baa\u0bbe\u0b9f\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd \u0b9a\u0bbf\u0bb1\u0baa\u0bcd\u0baa\u0bc1 \u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bcd"
      ]
    }
  };

  var marqueeTimerId = null;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isDefaultText(value, defaultValue) {
    return normalizeText(value) === normalizeText(defaultValue);
  }

  function getCurrentLanguage() {
    if (window.VisionI18n && typeof window.VisionI18n.getLanguage === "function") {
      return window.VisionI18n.getLanguage() === "ta" ? "ta" : "en";
    }
    return "en";
  }

  function getLocalizedDefaultText(value, defaultValue, key) {
    var language = getCurrentLanguage();
    if (isDefaultText(value, defaultValue) && language === "ta" && DEFAULT_HOME_CONTENT_TA[key]) {
      return DEFAULT_HOME_CONTENT_TA[key];
    }
    return value || defaultValue || "";
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) {
      element.textContent = value || "";
    }
  }

  function setLink(id, href, label) {
    var element = document.getElementById(id);
    if (!element) {
      return;
    }
    element.href = href || "#";
    if (label !== undefined) {
      element.textContent = label;
    }
  }

  function setFrameSource(id, src, title) {
    var element = document.getElementById(id);
    if (!element) {
      return;
    }
    element.src = src || "";
    if (title) {
      element.title = title;
    }
  }

  function extractInstagramHandle(profileUrl) {
    var text = String(profileUrl || "").trim();
    var match = text.match(/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?/i);
    if (!match) {
      return "@visioneduacademy";
    }
    return "@" + match[1].toLowerCase();
  }

  function getInstagramEmbedUrl(postUrl) {
    var text = String(postUrl || "").trim();
    var match = text.match(/^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
    if (!match) {
      return "";
    }
    return "https://www.instagram.com/" + match[1].toLowerCase() + "/" + match[2] + "/embed";
  }

  function getMapEmbedUrl(address, mapUrl) {
    var cleanAddress = String(address || "").trim();
    var cleanMapUrl = String(mapUrl || "").trim();
    if (cleanAddress) {
      return "https://www.google.com/maps?q=" + encodeURIComponent(cleanAddress) + "&output=embed";
    }
    if (cleanMapUrl && /^https?:\/\//i.test(cleanMapUrl)) {
      return cleanMapUrl.indexOf("output=embed") !== -1
        ? cleanMapUrl
        : cleanMapUrl + (cleanMapUrl.indexOf("?") === -1 ? "?output=embed" : "&output=embed");
    }
    return "https://www.google.com/maps?q=" + encodeURIComponent("Vision Education Academy Villianur Puducherry") + "&output=embed";
  }

  function extractFacebookPageName(profileUrl) {
    var text = String(profileUrl || "").trim();
    var match = text.match(/^https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9.\-_%]+)/i);
    if (!match) {
      return text || "Vision Education Academy";
    }
    return decodeURIComponent(match[1]).replace(/[._-]+/g, " ").replace(/\//g, "").trim() || "Vision Education Academy";
  }

  function normalizeFacebookUrl(input) {
    var text = String(input || "").trim();
    if (!text) {
      return "https://www.facebook.com/visioneducacademy";
    }
    if (/^https?:\/\//i.test(text)) {
      return text;
    }
    if (/\s/.test(text)) {
      return "https://www.facebook.com/search/top/?q=" + encodeURIComponent(text);
    }
    return "https://www.facebook.com/" + text.replace(/^\/+|\/+$/g, "") + "/";
  }

  function sortByLatest(newsItems) {
    return (Array.isArray(newsItems) ? newsItems : []).slice().sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function normalizeMarqueeItem(item, index) {
    if (!item || typeof item !== "object") {
      return null;
    }
    var source = String(item.src || item.url || "").trim();
    if (!source) {
      return null;
    }
    return {
      id: String(item.id || ("marquee_" + index)),
      name: String(item.name || ("highlight-image-" + String(index))).trim(),
      src: source
    };
  }

  function getMarqueeImages(imageItems) {
    if (!Array.isArray(imageItems)) {
      return [];
    }
    return imageItems.map(function (item, index) {
      return normalizeMarqueeItem(item, index + 1);
    }).filter(Boolean);
  }

  function clearMarqueeTimer() {
    if (marqueeTimerId) {
      window.clearInterval(marqueeTimerId);
      marqueeTimerId = null;
    }
  }

  function renderHeroMarquee(imageItems) {
    var track = document.getElementById("heroMarqueeTrack");
    if (!track) {
      return;
    }

    clearMarqueeTimer();
    track.innerHTML = "";

    var images = getMarqueeImages(imageItems);
    if (!images.length) {
      return;
    }

    var altPrefix = t("academy_name_brand", "Vision Education Academy") + " ";

    images.forEach(function (item, index) {
      var figure = document.createElement("figure");
      figure.className = "hero-marquee-item";
      if (index === 0) {
        figure.classList.add("is-active");
      }

      var image = document.createElement("img");
      image.src = item.src;
      image.alt = altPrefix + (item.name || ("highlight image " + String(index + 1)));
      image.loading = "lazy";

      figure.appendChild(image);
      track.appendChild(figure);
    });

    if (images.length <= 1) {
      return;
    }

    var slides = Array.prototype.slice.call(track.querySelectorAll(".hero-marquee-item"));
    var activeIndex = 0;

    marqueeTimerId = window.setInterval(function () {
      var currentSlide = slides[activeIndex];
      var nextIndex = (activeIndex + 1) % slides.length;
      var nextSlide = slides[nextIndex];
      if (!currentSlide || !nextSlide) {
        return;
      }

      currentSlide.classList.remove("is-active");
      currentSlide.classList.add("is-exit");

      nextSlide.classList.remove("is-exit");
      nextSlide.classList.add("is-enter");
      void nextSlide.offsetWidth;
      nextSlide.classList.add("is-active");
      nextSlide.classList.remove("is-enter");

      window.setTimeout(function () {
        currentSlide.classList.remove("is-exit");
      }, 720);

      activeIndex = nextIndex;
    }, 3400);
  }

  function renderAcademyHighlights() {
    var list = document.getElementById("academyHighlightsList");
    if (!list) {
      return;
    }

    var content = getCurrentLanguage() === "ta" ? ACADEMY_HIGHLIGHTS.ta : ACADEMY_HIGHLIGHTS.en;
    setText("academyHighlightsTitle", content.title);
    setText("academyHighlightsSubtitle", content.subtitle);

    list.innerHTML = "";
    content.points.forEach(function (point) {
      var item = document.createElement("li");
      item.textContent = point;
      list.appendChild(item);
    });
  }

  function renderNews(newsItems) {
    var container = document.getElementById("newsList");
    if (!container) {
      return;
    }
    container.innerHTML = "";

    var items = sortByLatest(newsItems);
    if (!items.length) {
      container.innerHTML = "<p class='empty-text'>" + t("home_empty_news", "No news available right now.") + "</p>";
      return;
    }

    items.forEach(function (item) {
      var article = document.createElement("article");
      article.className = "news-item";

      var title = document.createElement("h3");
      title.textContent = item.title || "Update";

      var date = document.createElement("p");
      date.className = "news-date";
      date.textContent = VisionStore.formatDisplayDate(item.date);

      var summary = document.createElement("p");
      summary.textContent = item.summary || "";

      article.appendChild(title);
      article.appendChild(date);
      article.appendChild(summary);
      container.appendChild(article);
    });
  }

  function renderInstagramPosts(postItems) {
    var container = document.getElementById("instagramPosts");
    if (!container) {
      return;
    }

    container.innerHTML = "";
    var validPosts = (Array.isArray(postItems) ? postItems : []).map(function (entry) {
      return {
        id: entry && entry.id ? entry.id : "ig_" + Math.random().toString(36).slice(2, 10),
        embedUrl: getInstagramEmbedUrl(entry && entry.url)
      };
    }).filter(function (entry) {
      return Boolean(entry.embedUrl);
    });

    if (!validPosts.length) {
      container.innerHTML = "<p class='empty-text'>" + t("home_instagram_empty", "No Instagram posts yet. Follow us for updates.") + "</p>";
      return;
    }

    validPosts.forEach(function (post) {
      var card = document.createElement("article");
      card.className = "instagram-card";

      var frame = document.createElement("iframe");
      frame.className = "instagram-embed";
      frame.src = post.embedUrl;
      frame.loading = "lazy";
      frame.allowTransparency = "true";
      frame.frameBorder = "0";
      frame.scrolling = "no";
      frame.title = "Instagram Post";

      card.appendChild(frame);
      container.appendChild(card);
    });
  }

  function renderPage(siteData, newsItems) {
    var safeSiteData = siteData || VisionStore.getSiteData();
    var brandLabel = t("academy_name_brand", safeSiteData.academyName);

    setText("year", String(new Date().getFullYear()));
    setText("academyName", brandLabel);
    setText("academyNameFooter", brandLabel);
    setText("tagline", getLocalizedDefaultText(safeSiteData.tagline, DEFAULT_HOME_CONTENT.tagline, "tagline"));
    setText("heroTitle", getLocalizedDefaultText(safeSiteData.heroTitle, DEFAULT_HOME_CONTENT.heroTitle, "heroTitle"));
    setText("heroText", getLocalizedDefaultText(safeSiteData.heroText, DEFAULT_HOME_CONTENT.heroText, "heroText"));
    setText("announcement", getLocalizedDefaultText(safeSiteData.announcement, DEFAULT_HOME_CONTENT.announcement, "announcement"));
    setText("address", safeSiteData.address);
    setText("phone", safeSiteData.phone);
    setText("email", safeSiteData.email);

    var mapUrl = safeSiteData.mapUrl || "https://maps.app.goo.gl/K3Fg2R2XbR58NR3i9";
    setLink("addressLink", mapUrl);
    setLink("mapOverlayLink", mapUrl);
    setFrameSource("mapEmbed", getMapEmbedUrl(safeSiteData.address, mapUrl), t("home_map_title", "Vision Education Academy Location"));

    var emailAddress = safeSiteData.email || "visionedudomain@gmail.com";
    setLink("emailLink", "mailto:" + emailAddress);

    var instagramUrl = safeSiteData.instagramProfileUrl || "https://www.instagram.com/visioneduacademy/";
    setLink("instagramProfileLink", instagramUrl, extractInstagramHandle(instagramUrl));
    setLink("instagramFollowBtn", instagramUrl);

    var facebookUrl = normalizeFacebookUrl(safeSiteData.facebookProfileUrl);
    setLink("facebookProfileLink", facebookUrl, extractFacebookPageName(safeSiteData.facebookProfileUrl));
    setLink("facebookFollowBtn", facebookUrl);

    renderHeroMarquee(safeSiteData.marqueeImages);
    renderAcademyHighlights();
    renderNews(newsItems || VisionStore.getNews());
    renderInstagramPosts(safeSiteData.instagramPosts);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await VisionStore.ready();

    renderPage(VisionStore.getSiteData(), VisionStore.getNews());

    var stopSiteSubscription = VisionStore.subscribeSiteData(function (siteData) {
      renderPage(siteData, VisionStore.getNews());
    });

    var stopNewsSubscription = VisionStore.subscribeNews(function (newsItems) {
      renderNews(newsItems);
    });

    window.addEventListener("vision-language-changed", function () {
      renderPage(VisionStore.getSiteData(), VisionStore.getNews());
    });

    window.addEventListener("beforeunload", function () {
      stopSiteSubscription();
      stopNewsSubscription();
      clearMarqueeTimer();
    });
  });
})();
