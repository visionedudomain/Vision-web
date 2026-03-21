(function () {
  "use strict";

  var LANGUAGE_KEY = "vision_academy_language_v1";
  var FIREBASE_VERSION = "12.7.0";
  var SITE_COLLECTION = "site";
  var SITE_DOCUMENT = "profile";
  var NEWS_COLLECTION = "news";
  var APPLICATIONS_COLLECTION = "applications";
  var DEFAULT_SITE_DATA = {
    profileVersion: 11,
    academyName: "VISION EDUCATION ACADEMY",
    tagline: "Coaching for Entrance Success",
    heroTitle: "Build your future with guided preparation.",
    heroText: "Vision Academy helps students with expert faculty, weekly tests, and personal mentoring.",
    announcement: "Admissions open for LDC / UDC / GALLARY ASSISTANT / JUNIOR LIBRARY ASSISTANT.",
    address: "NAVA SANNATHI STREET, VILLIANUR - PUDUCHERRY",
    phone: "9894382305 / 9994905624",
    email: "visionedudomain@gmail.com",
    instagramProfileUrl: "https://www.instagram.com/visioneduacademy/",
    facebookProfileUrl: "https://www.facebook.com/visioneducacademy",
    mapUrl: "https://maps.app.goo.gl/K3Fg2R2XbR58NR3i9",
    marqueeImages: [
      { id: "marquee_default_001", name: "WhatsApp Image 2026-03-05 at 11.35.05 AM.jpeg", src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.05 AM.jpeg" },
      { id: "marquee_default_002", name: "WhatsApp Image 2026-03-05 at 11.35.03 AM.jpeg", src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.03 AM.jpeg" },
      { id: "marquee_default_003", name: "WhatsApp Image 2026-03-05 at 11.35.06 AM.jpeg", src: "assets/images/WhatsApp Image 2026-03-05 at 11.35.06 AM.jpeg" }
    ],
    instagramPosts: [
      { id: "ig_default_001", url: "https://www.instagram.com/p/DVfjAxWgcoH/" }
    ]
  };

  var DEFAULT_NEWS = [
    { id: "news_001", title: "Admissions Open for 2026 Session", date: "2026-03-01", summary: "New classroom and hybrid batches are open for board and entrance preparation." },
    { id: "news_002", title: "Sunday Mock Test Series Started", date: "2026-02-25", summary: "Weekly offline and online mock tests are available for enrolled students." }
  ];

  var firebaseState = {
    configured: false,
    error: null,
    app: null,
    auth: null,
    db: null,
    api: null,
    unsubscribeAuth: null
  };

  var currentSiteData = sanitizeSiteData(DEFAULT_SITE_DATA);
  var currentNews = cloneRecords(DEFAULT_NEWS);
  var currentApplications = [];
  var currentUser = null;
  var siteDocumentExists = false;

  var listeners = {
    site: new Set(),
    news: new Set(),
    applications: new Set(),
    auth: new Set()
  };

  var unsubscribeSite = null;
  var unsubscribeNews = null;
  var unsubscribeApplications = null;
  var authReadyResolve;
  var authReadyPromise = new Promise(function (resolve) {
    authReadyResolve = resolve;
  });
  var readyPromise = initializeStore();

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function cloneRecords(list) {
    return (Array.isArray(list) ? list : []).map(function (item) {
      return Object.assign({}, item);
    });
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeAdminEmail(value) {
    return clean(value).toLowerCase();
  }

  function getConfiguredAdminEmail() {
    return normalizeAdminEmail((window.VisionFirebaseConfig || {}).adminEmail || "");
  }

  function hasRequiredFirebaseConfig(config) {
    var required = ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"];
    return required.every(function (key) {
      return clean(config && config[key]);
    });
  }

  function getFirebaseModuleUrl(fileName) {
    return "https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/" + fileName;
  }

  async function loadFirebaseApi() {
    if (firebaseState.api) {
      return firebaseState.api;
    }

    var modules = await Promise.all([
      import(getFirebaseModuleUrl("firebase-app.js")),
      import(getFirebaseModuleUrl("firebase-auth.js")),
      import(getFirebaseModuleUrl("firebase-firestore.js"))
    ]);

    firebaseState.api = {
      initializeApp: modules[0].initializeApp,
      getApp: modules[0].getApp,
      getApps: modules[0].getApps,
      getAuth: modules[1].getAuth,
      signInWithEmailAndPassword: modules[1].signInWithEmailAndPassword,
      signOut: modules[1].signOut,
      onAuthStateChanged: modules[1].onAuthStateChanged,
      getFirestore: modules[2].getFirestore,
      doc: modules[2].doc,
      getDoc: modules[2].getDoc,
      setDoc: modules[2].setDoc,
      collection: modules[2].collection,
      getDocs: modules[2].getDocs,
      query: modules[2].query,
      orderBy: modules[2].orderBy,
      addDoc: modules[2].addDoc,
      deleteDoc: modules[2].deleteDoc,
      serverTimestamp: modules[2].serverTimestamp,
      onSnapshot: modules[2].onSnapshot,
      limit: modules[2].limit
    };

    return firebaseState.api;
  }

  function toDateValue(value) {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return new Date(value.getTime());
    }
    if (typeof value.toDate === "function") {
      return value.toDate();
    }
    if (typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
    if (typeof value === "number") {
      return new Date(value);
    }
    if (typeof value === "string") {
      var parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  function formatDisplayDate(value) {
    if (!value) {
      return "-";
    }
    var date = toDateValue(value);
    if (!date) {
      return typeof value === "string" ? value : "-";
    }
    var language = localStorage.getItem(LANGUAGE_KEY) === "ta" ? "ta-IN" : "en-IN";
    return date.toLocaleDateString(language, { day: "2-digit", month: "short", year: "numeric" });
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function getMarqueeNameFromSource(src, index) {
    var text = clean(src);
    if (!text) {
      return "image-" + String(index);
    }
    try {
      var url = new URL(text, window.location.origin);
      var parts = url.pathname.split("/").filter(Boolean);
      if (parts.length) {
        return decodeURIComponent(parts[parts.length - 1]);
      }
    } catch (error) {
      // ignore and fall back
    }
    var localName = text.split(/[?#]/)[0].split("/").filter(Boolean).pop();
    return localName || ("image-" + String(index));
  }

  function sanitizeMarqueeItems(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    return list.map(function (item, index) {
      if (!item || typeof item !== "object") {
        return null;
      }
      var source = clean(item.src || item.url);
      if (!source) {
        return null;
      }
      return {
        id: clean(item.id) || createId("marquee"),
        name: clean(item.name) || getMarqueeNameFromSource(source, index + 1),
        src: source
      };
    }).filter(Boolean);
  }

  function sanitizeInstagramPosts(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    return list.map(function (item) {
      var url = typeof item === "string" ? clean(item) : clean(item && item.url);
      if (!url) {
        return null;
      }
      return {
        id: clean(item && item.id) || createId("ig"),
        url: url
      };
    }).filter(Boolean);
  }

  function sanitizeSiteData(siteData) {
    var safe = siteData && typeof siteData === "object" ? siteData : {};
    var defaults = DEFAULT_SITE_DATA;
    return {
      profileVersion: 11,
      academyName: clean(safe.academyName) || defaults.academyName,
      tagline: clean(safe.tagline) || defaults.tagline,
      heroTitle: clean(safe.heroTitle) || defaults.heroTitle,
      heroText: clean(safe.heroText) || defaults.heroText,
      announcement: clean(safe.announcement) || defaults.announcement,
      address: clean(safe.address) || defaults.address,
      phone: clean(safe.phone) || defaults.phone,
      email: clean(safe.email) || defaults.email,
      instagramProfileUrl: clean(safe.instagramProfileUrl) || defaults.instagramProfileUrl,
      facebookProfileUrl: clean(safe.facebookProfileUrl) || defaults.facebookProfileUrl,
      mapUrl: clean(safe.mapUrl) || defaults.mapUrl,
      marqueeImages: Array.isArray(safe.marqueeImages) ? sanitizeMarqueeItems(safe.marqueeImages) : deepCopy(defaults.marqueeImages),
      instagramPosts: Array.isArray(safe.instagramPosts) ? sanitizeInstagramPosts(safe.instagramPosts) : deepCopy(defaults.instagramPosts)
    };
  }

  function sanitizeNewsItem(item, id) {
    var safe = item && typeof item === "object" ? item : {};
    return {
      id: clean(id || safe.id) || createId("news"),
      title: clean(safe.title) || "Update",
      date: clean(safe.date),
      summary: clean(safe.summary)
    };
  }

  function sanitizeApplicationInput(application) {
    var safe = application && typeof application === "object" ? application : {};
    return {
      candidateName: clean(safe.candidateName || safe.studentName),
      fatherName: clean(safe.fatherName),
      motherName: clean(safe.motherName),
      dob: clean(safe.dob),
      gender: clean(safe.gender),
      qualification: clean(safe.qualification),
      religion: clean(safe.religion),
      category: clean(safe.category),
      mobile: clean(safe.mobile || safe.phone),
      address: clean(safe.address)
    };
  }

  function mapNewsDocument(snapshot) {
    return sanitizeNewsItem(snapshot.data(), snapshot.id);
  }

  function mapApplicationDocument(snapshot) {
    var data = snapshot.data() || {};
    return {
      id: snapshot.id,
      candidateName: clean(data.candidateName || data.studentName),
      fatherName: clean(data.fatherName),
      motherName: clean(data.motherName),
      dob: data.dob || "",
      gender: clean(data.gender),
      qualification: clean(data.qualification),
      religion: clean(data.religion),
      category: clean(data.category),
      mobile: clean(data.mobile || data.phone),
      address: clean(data.address),
      submittedAt: data.submittedAt || ""
    };
  }

  function getSiteData() {
    return deepCopy(currentSiteData);
  }

  function getNews() {
    return cloneRecords(currentNews);
  }

  function getApplications() {
    return cloneRecords(currentApplications);
  }

  function emitSiteData() {
    var payload = getSiteData();
    listeners.site.forEach(function (callback) {
      try {
        callback(payload);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function emitNews() {
    var payload = getNews();
    listeners.news.forEach(function (callback) {
      try {
        callback(payload);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function emitApplications() {
    var payload = getApplications();
    listeners.applications.forEach(function (callback) {
      try {
        callback(payload);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function emitAuth() {
    listeners.auth.forEach(function (callback) {
      try {
        callback(currentUser);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function subscribeTo(setName, getter, callback) {
    listeners[setName].add(callback);
    callback(getter());
    return function () {
      listeners[setName].delete(callback);
    };
  }

  function subscribeSiteData(callback) {
    return subscribeTo("site", getSiteData, callback);
  }

  function subscribeNews(callback) {
    return subscribeTo("news", getNews, callback);
  }

  function subscribeApplications(callback) {
    return subscribeTo("applications", getApplications, callback);
  }

  function subscribeAdminSession(callback) {
    listeners.auth.add(callback);
    callback(currentUser);
    return function () {
      listeners.auth.delete(callback);
    };
  }

  function isAdminUser(user) {
    return Boolean(user && normalizeAdminEmail(user.email) && normalizeAdminEmail(user.email) === getConfiguredAdminEmail());
  }

  function getAdminSession() {
    return isAdminUser(currentUser);
  }

  function getConfigStatus() {
    return {
      configured: firebaseState.configured,
      adminEmail: getConfiguredAdminEmail(),
      error: firebaseState.error ? firebaseState.error.message : ""
    };
  }

  function assertFirebaseConfigured() {
    if (!firebaseState.configured) {
      throw new Error("Firebase is not configured. Update assets/js/firebase-config.js first.");
    }
  }

  function resolveAuthReady() {
    if (typeof authReadyResolve === "function") {
      authReadyResolve();
      authReadyResolve = null;
    }
  }

  function assertAdminSession() {
    if (!getAdminSession()) {
      throw new Error("Admin login is required.");
    }
  }

  function getSiteDocumentRef() {
    return firebaseState.api.doc(firebaseState.db, SITE_COLLECTION, SITE_DOCUMENT);
  }

  function serializeSiteData(siteData) {
    var safe = sanitizeSiteData(siteData);
    return {
      profileVersion: safe.profileVersion,
      academyName: safe.academyName,
      tagline: safe.tagline,
      heroTitle: safe.heroTitle,
      heroText: safe.heroText,
      announcement: safe.announcement,
      address: safe.address,
      phone: safe.phone,
      email: safe.email,
      instagramProfileUrl: safe.instagramProfileUrl,
      facebookProfileUrl: safe.facebookProfileUrl,
      mapUrl: safe.mapUrl,
      marqueeImages: safe.marqueeImages.map(function (item) {
        return { id: item.id, name: item.name, src: item.src };
      }),
      instagramPosts: safe.instagramPosts.map(function (item) {
        return { id: item.id, url: item.url };
      }),
      updatedAt: firebaseState.api.serverTimestamp()
    };
  }

  async function loadSiteDataOnce() {
    var snapshot = await firebaseState.api.getDoc(getSiteDocumentRef());
    siteDocumentExists = snapshot.exists();
    if (!siteDocumentExists) {
      return sanitizeSiteData(DEFAULT_SITE_DATA);
    }
    return sanitizeSiteData(snapshot.data());
  }

  async function loadNewsOnce() {
    var queryRef = firebaseState.api.query(firebaseState.api.collection(firebaseState.db, NEWS_COLLECTION), firebaseState.api.orderBy("date", "desc"));
    var snapshot = await firebaseState.api.getDocs(queryRef);
    if (snapshot.empty) {
      return siteDocumentExists ? [] : cloneRecords(DEFAULT_NEWS);
    }
    return snapshot.docs.map(mapNewsDocument);
  }

  function startSiteSubscription() {
    if (!firebaseState.configured || unsubscribeSite) {
      return;
    }
    unsubscribeSite = firebaseState.api.onSnapshot(getSiteDocumentRef(), function (snapshot) {
      siteDocumentExists = snapshot.exists();
      currentSiteData = snapshot.exists() ? sanitizeSiteData(snapshot.data()) : sanitizeSiteData(DEFAULT_SITE_DATA);
      emitSiteData();
    }, function (error) {
      console.error("Site data subscription error", error);
    });
  }

  function startNewsSubscription() {
    if (!firebaseState.configured || unsubscribeNews) {
      return;
    }
    var queryRef = firebaseState.api.query(firebaseState.api.collection(firebaseState.db, NEWS_COLLECTION), firebaseState.api.orderBy("date", "desc"));
    unsubscribeNews = firebaseState.api.onSnapshot(queryRef, function (snapshot) {
      currentNews = snapshot.empty ? (siteDocumentExists ? [] : cloneRecords(DEFAULT_NEWS)) : snapshot.docs.map(mapNewsDocument);
      emitNews();
    }, function (error) {
      console.error("News subscription error", error);
    });
  }

  function stopApplicationsSubscription() {
    if (unsubscribeApplications) {
      unsubscribeApplications();
      unsubscribeApplications = null;
    }
    currentApplications = [];
    emitApplications();
  }

  function startApplicationsSubscription() {
    if (!firebaseState.configured || !getAdminSession() || unsubscribeApplications) {
      return;
    }
    var queryRef = firebaseState.api.query(firebaseState.api.collection(firebaseState.db, APPLICATIONS_COLLECTION), firebaseState.api.orderBy("submittedAt", "desc"));
    unsubscribeApplications = firebaseState.api.onSnapshot(queryRef, function (snapshot) {
      currentApplications = snapshot.docs.map(mapApplicationDocument);
      emitApplications();
    }, function (error) {
      console.error("Applications subscription error", error);
      currentApplications = [];
      emitApplications();
    });
  }

  async function waitForInitialAuthState() {
    return new Promise(function (resolve) {
      firebaseState.unsubscribeAuth = firebaseState.api.onAuthStateChanged(firebaseState.auth, function (user) {
        if (user && !isAdminUser(user)) {
          firebaseState.api.signOut(firebaseState.auth);
          currentUser = null;
        } else {
          currentUser = user || null;
        }
        if (getAdminSession()) {
          startApplicationsSubscription();
        } else {
          stopApplicationsSubscription();
        }
        emitAuth();
        resolve();
      }, function (error) {
        console.error("Auth state error", error);
        currentUser = null;
        emitAuth();
        resolve();
      });
    });
  }

  async function initializeStore() {
    var config = window.VisionFirebaseConfig || {};
    if (!hasRequiredFirebaseConfig(config)) {
      firebaseState.error = new Error("Firebase is not configured. Update assets/js/firebase-config.js first.");
      resolveAuthReady();
      return;
    }
    try {
      firebaseState.api = await loadFirebaseApi();
      firebaseState.app = firebaseState.api.getApps().length ? firebaseState.api.getApp() : firebaseState.api.initializeApp(config);
      firebaseState.auth = firebaseState.api.getAuth(firebaseState.app);
      firebaseState.db = firebaseState.api.getFirestore(firebaseState.app);
      firebaseState.configured = true;
      resolveAuthReady();

      try {
        currentSiteData = await loadSiteDataOnce();
      } catch (error) {
        console.warn("Using built-in site defaults.", error);
        currentSiteData = sanitizeSiteData(DEFAULT_SITE_DATA);
      }

      try {
        currentNews = await loadNewsOnce();
      } catch (error) {
        console.warn("Using built-in news defaults.", error);
        currentNews = cloneRecords(DEFAULT_NEWS);
      }

      emitSiteData();
      emitNews();
      await waitForInitialAuthState();
      startSiteSubscription();
      startNewsSubscription();
    } catch (error) {
      firebaseState.configured = false;
      firebaseState.error = error;
      resolveAuthReady();
      console.error("Firebase initialization failed", error);
    }
  }

  async function loginAdmin(password) {
    assertFirebaseConfigured();
    var email = getConfiguredAdminEmail();
    if (!email) {
      throw new Error("Admin email is missing in assets/js/firebase-config.js.");
    }
    var credentials = await firebaseState.api.signInWithEmailAndPassword(firebaseState.auth, email, clean(password));
    if (!isAdminUser(credentials.user)) {
      await firebaseState.api.signOut(firebaseState.auth);
      throw new Error("This account does not have admin access.");
    }
    currentUser = credentials.user;
    startApplicationsSubscription();
    emitAuth();
    return credentials.user;
  }

  async function logoutAdmin() {
    if (!firebaseState.configured) {
      return;
    }
    await firebaseState.api.signOut(firebaseState.auth);
  }

  async function saveSiteData(siteData) {
    assertFirebaseConfigured();
    assertAdminSession();
    var safe = sanitizeSiteData(siteData);
    await firebaseState.api.setDoc(getSiteDocumentRef(), serializeSiteData(safe), { merge: true });
    siteDocumentExists = true;
    currentSiteData = safe;
    emitSiteData();
    return getSiteData();
  }

  async function deleteMarqueeImage(id) {
    assertFirebaseConfigured();
    assertAdminSession();
    var nextSiteData = getSiteData();
    nextSiteData.marqueeImages = nextSiteData.marqueeImages.filter(function (item) {
      return String(item.id) !== String(id);
    });
    return saveSiteData(nextSiteData);
  }

  async function addInstagramPost(url) {
    assertFirebaseConfigured();
    assertAdminSession();
    var cleanUrl = clean(url);
    if (!cleanUrl) {
      throw new Error("Instagram post URL is required.");
    }
    var nextSiteData = getSiteData();
    nextSiteData.instagramPosts = [{ id: createId("ig"), url: cleanUrl }].concat(nextSiteData.instagramPosts || []);
    return saveSiteData(nextSiteData);
  }

  async function deleteInstagramPost(id) {
    assertFirebaseConfigured();
    assertAdminSession();
    var nextSiteData = getSiteData();
    nextSiteData.instagramPosts = (nextSiteData.instagramPosts || []).filter(function (item) {
      return String(item.id) !== String(id);
    });
    return saveSiteData(nextSiteData);
  }

  async function addNews(item) {
    assertFirebaseConfigured();
    assertAdminSession();
    var safeItem = sanitizeNewsItem(item);
    if (!safeItem.title || !safeItem.date || !safeItem.summary) {
      throw new Error("News title, date, and summary are required.");
    }
    await firebaseState.api.addDoc(firebaseState.api.collection(firebaseState.db, NEWS_COLLECTION), {
      title: safeItem.title,
      date: safeItem.date,
      summary: safeItem.summary,
      createdAt: firebaseState.api.serverTimestamp()
    });
  }

  async function deleteNews(id) {
    assertFirebaseConfigured();
    assertAdminSession();
    await firebaseState.api.deleteDoc(firebaseState.api.doc(firebaseState.db, NEWS_COLLECTION, String(id)));
  }

  async function addApplication(application) {
    assertFirebaseConfigured();
    var safeApplication = sanitizeApplicationInput(application);
    await firebaseState.api.addDoc(firebaseState.api.collection(firebaseState.db, APPLICATIONS_COLLECTION), {
      candidateName: safeApplication.candidateName,
      fatherName: safeApplication.fatherName,
      motherName: safeApplication.motherName,
      dob: safeApplication.dob,
      gender: safeApplication.gender,
      qualification: safeApplication.qualification,
      religion: safeApplication.religion,
      category: safeApplication.category,
      mobile: safeApplication.mobile,
      address: safeApplication.address,
      submittedAt: firebaseState.api.serverTimestamp()
    });
  }

  async function bootstrapDefaultContent() {
    assertFirebaseConfigured();
    assertAdminSession();
    if (!siteDocumentExists) {
      await saveSiteData(DEFAULT_SITE_DATA);
      var snapshot = await firebaseState.api.getDocs(firebaseState.api.query(firebaseState.api.collection(firebaseState.db, NEWS_COLLECTION), firebaseState.api.limit(1)));
      if (snapshot.empty) {
        for (var index = 0; index < DEFAULT_NEWS.length; index += 1) {
          await addNews(DEFAULT_NEWS[index]);
        }
      }
      return true;
    }
    return false;
  }

  window.VisionStore = {
    ready: function () { return readyPromise; },
    readyForAuth: function () { return authReadyPromise; },
    getConfigStatus: getConfigStatus,
    getSiteData: getSiteData,
    subscribeSiteData: subscribeSiteData,
    saveSiteData: saveSiteData,
    deleteMarqueeImage: deleteMarqueeImage,
    addInstagramPost: addInstagramPost,
    deleteInstagramPost: deleteInstagramPost,
    getNews: getNews,
    subscribeNews: subscribeNews,
    addNews: addNews,
    deleteNews: deleteNews,
    getApplications: getApplications,
    subscribeApplications: subscribeApplications,
    addApplication: addApplication,
    loginAdmin: loginAdmin,
    logoutAdmin: logoutAdmin,
    getAdminSession: getAdminSession,
    subscribeAdminSession: subscribeAdminSession,
    bootstrapDefaultContent: bootstrapDefaultContent,
    formatDisplayDate: formatDisplayDate,
    todayISO: todayISO,
    getAdminEmail: getConfiguredAdminEmail
  };
})();

