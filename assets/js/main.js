(function () {
  "use strict";

  function t(key, fallback) {
    if (window.VisionI18n && typeof window.VisionI18n.t === "function") {
      return window.VisionI18n.t(key);
    }
    return fallback || key;
  }

  var DEFAULT_HOME_CONTENT = {
    tagline: "Coaching for School, Board, and Entrance Success",
    heroTitle: "Build your future with guided preparation.",
    heroText: "Vision Academy helps students with expert faculty, weekly tests, and personal mentoring.",
    announcement: "Admissions open for 2026 batch. Free counseling session every Saturday."
  };

  var DEFAULT_HOME_CONTENT_TA = {
    tagline: "\u0baa\u0bb3\u0bcd\u0bb3\u0bbf, \u0baa\u0bcb\u0bb0\u0bcd\u0b9f\u0bcd\u0b9f\u0bc1 \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0ba8\u0bc1\u0bb4\u0bc8\u0bb5\u0bc1\u0ba4\u0bcd \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0baa\u0baf\u0bbf\u0bb1\u0bcd\u0b9a\u0bbf",
    heroTitle: "\u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bb2\u0bc1\u0b9f\u0ba9\u0bcd \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b8e\u0ba4\u0bbf\u0bb0\u0bcd\u0b95\u0bbe\u0bb2\u0ba4\u0bcd\u0ba4\u0bc8 \u0b89\u0bb0\u0bc1\u0bb5\u0bbe\u0b95\u0bcd\u0b95\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd.",
    heroText: "\u0bb5\u0bbf\u0bb7\u0ba9\u0bcd \u0b95\u0bb2\u0bcd\u0bb5\u0bbf \u0bae\u0bc8\u0baf\u0bae\u0bcd \u0ba4\u0bbf\u0bb1\u0bae\u0bc8\u0baf\u0bbe\u0ba9 \u0b86\u0b9a\u0bbf\u0bb0\u0bbf\u0baf\u0bb0\u0bcd\u0b95\u0bb3\u0bcd, \u0bb5\u0bbe\u0bb0\u0bbe\u0ba8\u0bcd\u0ba4\u0bbf\u0bb0 \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1\u0b95\u0bb3\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0ba4\u0ba9\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bc1\u0ba4\u0bb2\u0bc1\u0b9f\u0ba9\u0bcd \u0bae\u0bbe\u0ba3\u0bb5\u0bb0\u0bcd\u0b95\u0bb3\u0bc8 \u0bae\u0bc1\u0ba9\u0bcd\u0ba9\u0bc7\u0bb1\u0bcd\u0bb1\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",
    announcement: "2026 \u0ba4\u0bca\u0b95\u0bc1\u0ba4\u0bbf\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0b9a\u0bc7\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bc8 \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95\u0bbf\u0baf\u0bc1\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1. \u0b92\u0bb5\u0bcd\u0bb5\u0bcb\u0bb0\u0bcd \u0b9a\u0ba9\u0bbf\u0b95\u0bcd\u0b95\u0bbf\u0bb4\u0bae\u0bc8\u0baf\u0bc1\u0bae\u0bcd \u0b87\u0bb2\u0bb5\u0b9a \u0b86\u0bb2\u0bcb\u0b9a\u0ba9\u0bc8."
  };

  var DEFAULT_MARQUEE_IMAGES = [
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

  var marqueeTimerId = null;

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

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isDefaultText(value, defaultValue) {
    return normalizeText(value) === normalizeText(defaultValue);
  }

  function getLocalizedDefaultText(value, defaultValue, i18nKey) {
    var language = getCurrentLanguage();
    if (isDefaultText(value, defaultValue)) {
      if (language === "ta" && DEFAULT_HOME_CONTENT_TA[i18nKey]) {
        return DEFAULT_HOME_CONTENT_TA[i18nKey];
      }
      return defaultValue;
    }
    return value || "";
  }

  function getCurrentLanguage() {
    if (window.VisionI18n && typeof window.VisionI18n.getLanguage === "function") {
      return window.VisionI18n.getLanguage() === "ta" ? "ta" : "en";
    }
    return "en";
  }

  function renderAcademyHighlights() {
    var list = document.getElementById("academyHighlightsList");
    if (!list) {
      return;
    }

    var language = getCurrentLanguage();
    var content = language === "ta" ? ACADEMY_HIGHLIGHTS.ta : ACADEMY_HIGHLIGHTS.en;

    var title = document.getElementById("academyHighlightsTitle");
    if (title) {
      title.textContent = content.title;
    }

    var subtitle = document.getElementById("academyHighlightsSubtitle");
    if (subtitle) {
      subtitle.textContent = content.subtitle;
    }

    list.innerHTML = "";
    content.points.forEach(function (point) {
      var item = document.createElement("li");
      item.textContent = point;
      list.appendChild(item);
    });
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
    var username = match[1].toLowerCase();
    if (username === "p" || username === "reel" || username === "tv" || username === "explore") {
      return "@visioneduacademy";
    }
    return "@" + username;
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
      if (cleanMapUrl.indexOf("output=embed") !== -1) {
        return cleanMapUrl;
      }
      if (cleanMapUrl.indexOf("?") !== -1) {
        return cleanMapUrl + "&output=embed";
      }
      return cleanMapUrl + "?output=embed";
    }

    return "https://www.google.com/maps?q=" + encodeURIComponent("Vision Education Academy Villianur Puducherry") + "&output=embed";
  }

  function extractFacebookPageName(profileUrl) {
    var text = String(profileUrl || "").trim();
    var match = text.match(/^https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9.\-_%]+)/i);
    if (!match) {
      return text || "Vision Education Academy";
    }
    var slug = decodeURIComponent(match[1]).replace(/\//g, "");
    if (!slug || slug.toLowerCase() === "pages" || slug.toLowerCase() === "profile.php") {
      return "Vision Education Academy";
    }
    var readable = slug
      .replace(/[._-]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .trim();
    return readable || "Vision Education Academy";
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
    return newsItems.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  function normalizeMarqueeItem(item, index) {
    if (typeof item === "string") {
      var stringSource = item.trim();
      if (!stringSource) {
        return null;
      }
      return {
        name: "highlight-image-" + String(index),
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
      name: String(item.name || "").trim() || ("highlight-image-" + String(index)),
      src: source
    };
  }

  function getMarqueeImages(imageItems) {
    var images = Array.isArray(imageItems)
      ? imageItems
        .map(function (item, index) {
          return normalizeMarqueeItem(item, index + 1);
        })
        .filter(Boolean)
      : [];

    return images.length ? images : DEFAULT_MARQUEE_IMAGES.slice();
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

    var images = getMarqueeImages(imageItems);
    var altPrefix = t("academy_name_brand", "Vision Education Academy") + " ";

    track.innerHTML = "";

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

  function renderNews(newsItems) {
    var container = document.getElementById("newsList");
    if (!container) {
      return;
    }
    container.innerHTML = "";

    if (!Array.isArray(newsItems) || newsItems.length === 0) {
      container.innerHTML = "<p class='empty-text'>" + t("home_empty_news", "No news available right now.") + "</p>";
      return;
    }

    sortByLatest(newsItems).forEach(function (item) {
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
    var items = Array.isArray(postItems) ? postItems : [];

    var validPosts = items
      .map(function (entry) {
        var url = typeof entry === "string" ? entry : entry && entry.url;
        return {
          id: entry && entry.id ? entry.id : "ig_" + Math.random().toString(36).slice(2, 10),
          embedUrl: getInstagramEmbedUrl(url)
        };
      })
      .filter(function (entry) {
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

  document.addEventListener("DOMContentLoaded", function () {
    setText("year", String(new Date().getFullYear()));

    function renderPageData() {
      var siteData = VisionStore.getSiteData();
      var brandLabel = t("academy_name_brand", siteData.academyName);

      setText("academyName", brandLabel);
      setText("academyNameFooter", brandLabel);
      setText("tagline", getLocalizedDefaultText(siteData.tagline, DEFAULT_HOME_CONTENT.tagline, "tagline"));
      setText("heroTitle", getLocalizedDefaultText(siteData.heroTitle, DEFAULT_HOME_CONTENT.heroTitle, "heroTitle"));
      setText("heroText", getLocalizedDefaultText(siteData.heroText, DEFAULT_HOME_CONTENT.heroText, "heroText"));
      setText("announcement", getLocalizedDefaultText(siteData.announcement, DEFAULT_HOME_CONTENT.announcement, "announcement"));
      setText("address", siteData.address);
      setText("phone", siteData.phone);
      setText("email", siteData.email);

      var mapUrl = siteData.mapUrl || "https://maps.app.goo.gl/K3Fg2R2XbR58NR3i9";
      setLink("addressLink", mapUrl);
      setLink("mapOverlayLink", mapUrl);
      setFrameSource("mapEmbed", getMapEmbedUrl(siteData.address, mapUrl), t("home_map_title", "Vision Education Academy Location"));

      var emailAddress = siteData.email || "visionedudomain@gmail.com";
      setLink("emailLink", "mailto:" + emailAddress);

      var instagramUrl = siteData.instagramProfileUrl || "https://www.instagram.com/visioneduacademy/";
      var instagramHandle = extractInstagramHandle(instagramUrl);
      setLink("instagramProfileLink", instagramUrl, instagramHandle);
      setLink("instagramFollowBtn", instagramUrl);

      var facebookInput = siteData.facebookProfileUrl || "https://www.facebook.com/visioneducacademy";
      var facebookUrl = normalizeFacebookUrl(facebookInput);
      var facebookName = extractFacebookPageName(facebookInput);
      setLink("facebookProfileLink", facebookUrl, facebookName);
      setLink("facebookFollowBtn", facebookUrl);

      renderHeroMarquee(siteData.marqueeImages);
      renderAcademyHighlights();
      renderNews(siteData.news);
      renderInstagramPosts(siteData.instagramPosts);
    }

    renderPageData();
    window.addEventListener("vision-language-changed", renderPageData);
  });
})();
