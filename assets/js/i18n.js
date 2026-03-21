(function () {
  "use strict";

  var LANGUAGE_KEY = "vision_academy_language_v1";
  var DEFAULT_LANGUAGE = "en";

  var translations = {
    en: {
      academy_name_brand: "VISION EDUCATION ACADEMY",
      nav_home: "Home",
      nav_apply: "Application",
      nav_test: "Online Test",
      nav_admin: "Admin",
      hero_identity_title: "VISION EDUCATION ACADEMY",
      hero_identity_subtitle: "Centre for All Govt Competitive Exams",
      hero_identity_address: "NAVA SANNATHI STREET, VILLIANUR - PUDUCHERRY",
      hero_identity_phone: "Contact No: 9894382305 / 9994905624",
      home_apply_now: "Apply Now",
      home_latest_news: "Latest News",
      home_announcement_title: "Current Announcement",
      home_programs: "Programs",
      home_news_updates: "News & Updates",
      home_instagram_posts: "Instagram Posts",
      home_follow_instagram: "Follow on Instagram",
      home_follow_facebook: "Visit Facebook Page",
      home_contact: "Contact",
      home_address: "Address:",
      home_phone: "Phone:",
      home_email: "Email:",
      home_instagram: "Instagram:",
      home_facebook: "Facebook:",
      home_view_map: "View on Map",
      home_map_title: "Vision Education Academy Location",
      footer_rights: "All rights reserved.",
      home_empty_programs: "Programs will be updated soon.",
      home_empty_news: "No news available right now.",
      home_instagram_empty: "No Instagram posts yet. Follow us for updates.",
      apply_title: "Application Form",
      apply_subtitle: "Fill this form to request admission. Admin can view all submitted applications from the Admin panel.",
      apply_point_1: "Complete all required details.",
      apply_point_2: "Use valid mobile number and personal details.",
      apply_point_3: "Submit once; admin will contact you.",
      form_candidate_name: "Name of the Candidate",
      form_father_name: "Father Name",
      form_mother_name: "Mother Name",
      form_dob: "Date of Birth",
      form_gender: "Gender",
      gender_male: "Male",
      gender_female: "Female",
      form_qualification: "Educational Qualification",
      form_religion: "Religion",
      form_category: "Category",
      form_address: "Address for Communication",
      form_mobile: "Mobile Number",
      category_select: "Select category",
      category_general: "General",
      btn_submit_application: "Submit Application",
      apply_note: "This demo stores data in browser local storage.",
      placeholder_candidate: "Enter candidate name",
      placeholder_father: "Enter father name",
      placeholder_mother: "Enter mother name",
      placeholder_qualification: "Enter qualification",
      placeholder_religion: "Enter religion",
      placeholder_mobile: "Enter mobile number",
      placeholder_address: "Enter address",
      status_fill_required: "Please fill all required fields.",
      status_apply_success: "Application submitted successfully. Admin can now view it.",
      admin_title: "Admin Dashboard",
      admin_demo_password: "Demo admin password:",
      admin_login_title: "Admin Login",
      admin_password_placeholder: "Enter admin password",
      btn_login: "Login",
      admin_update_title: "Update Website Information",
      label_tagline: "Tagline",
      label_hero_title: "Hero Title",
      label_hero_text: "Hero Text",
      label_announcement: "Announcement",
      label_address: "Address",
      label_phone: "Phone",
      label_email: "Email",
      label_instagram_url: "Instagram Profile URL",
      label_facebook_url: "Facebook Page URL / ID",
      label_marquee_images: "Hero Marquee Images",
      label_marquee_upload: "Marquee Image Links",
      placeholder_marquee_images: "assets/images/photo-1.jpg\nassets/images/photo-2.jpg\nhttps://example.com/photo-3.jpg",
      admin_marquee_hint: "Use one image path or image URL per line. Example: assets/images/photo-1.jpg",
      admin_marquee_upload_hint: "Paste one image link per line. These links will be shown on the home page marquee.",
      admin_marquee_empty: "No marquee images added yet.",
      admin_marquee_uploaded_label: "Image link",
      admin_marquee_link_label: "Image link",
      admin_marquee_uploaded_note: "Stored in this browser",
      btn_save_site: "Save Website Information",
      status_content_saved: "Website information updated successfully.",
      status_marquee_upload_saved: "Marquee images uploaded successfully.",
      status_marquee_upload_failed: "Unable to upload marquee images.",
      status_marquee_removed: "Marquee image removed.",
      admin_news_title: "News Management",
      label_news_title: "News Title",
      label_news_date: "News Date",
      label_summary: "Summary",
      btn_add_news: "Add News",
      admin_news_empty: "No news added yet.",
      admin_instagram_title: "Instagram Posts",
      label_instagram_post_url: "Instagram Post URL or Embed Code",
      btn_add_instagram_post: "Add Instagram Post",
      admin_instagram_hint: "Paste an Instagram post URL or full embed code; it will appear on the home page.",
      admin_instagram_empty: "No Instagram posts added yet.",
      admin_instagram_invalid: "Please enter a valid Instagram post URL or embed code.",
      btn_delete: "Delete",
      admin_applications_title: "Application Submissions",
      btn_export_csv: "Export CSV",
      btn_clear_submissions: "Clear Submissions",
      btn_export_settings: "Export Settings as JSON",
      status_exported: "Settings exported successfully! Replace the file in assets/data/settings.json and push to GitHub.",
      status_csv_exported: "CSV exported successfully.",
      confirm_clear_submissions: "Clear all submitted applications from the admin table? Make sure you already exported the CSV if you need a backup.",
      status_submissions_cleared: "Application submissions cleared successfully.",
      status_submissions_clear_failed: "Unable to clear submissions right now.",
      th_candidate: "Candidate",
      th_father: "Father",
      th_mobile: "Mobile",
      th_dob: "DOB",
      th_category: "Category",
      th_submitted: "Submitted",
      admin_applications_empty: "No applications submitted yet.",
      btn_logout: "Logout",
      status_login_failed: "Incorrect password.",
      status_login_success: "Login successful.",
      alert_no_applications: "No applications to export."
    },
    ta: {
      academy_name_brand: "விஷன் கல்வி மையம்",
      nav_home: "முகப்பு",
      nav_apply: "விண்ணப்பம்",
      nav_test: "ஆன்லைன் தேர்வு",
      nav_admin: "நிர்வாகம்",
      hero_identity_title: "விஷன் கல்வி மையம்",
      hero_identity_subtitle: "அரசு போட்டித் தேர்வுகளுக்கான மையம்",
      hero_identity_address: "நவா சன்னதி தெரு, வில்லியனூர் - புதுச்சேரி",
      hero_identity_phone: "தொடர்பு எண்: 9894382305 / 9994905624",
      home_apply_now: "இப்போது விண்ணப்பிக்கவும்",
      home_latest_news: "சமீபத்திய செய்திகள்",
      home_announcement_title: "தற்போதைய அறிவிப்பு",
      home_programs: "பாடத்திட்டங்கள்",
      home_news_updates: "செய்திகள் மற்றும் புதுப்பிப்புகள்",
      home_instagram_posts: "Instagram பதிவுகள்",
      home_follow_instagram: "Instagram-ல் பின்தொடரவும்",
      home_follow_facebook: "Facebook பக்கத்தை பார்க்கவும்",
      home_contact: "தொடர்பு",
      home_address: "முகவரி:",
      home_phone: "தொலைபேசி:",
      home_email: "மின்னஞ்சல்:",
      home_instagram: "Instagram:",
      home_facebook: "Facebook:",
      home_view_map: "வரைபடத்தில் பார்க்கவும்",
      home_map_title: "விஷன் கல்வி மையம் இடம்",
      footer_rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
      home_empty_programs: "பாடத்திட்ட விவரங்கள் விரைவில் புதுப்பிக்கப்படும்.",
      home_empty_news: "தற்போது செய்திகள் இல்லை.",
      home_instagram_empty: "Instagram பதிவுகள் இன்னும் இல்லை. புதுப்பிப்புகளுக்கு பின்தொடரவும்.",
      apply_title: "விண்ணப்ப படிவம்",
      apply_subtitle: "சேர்க்கைக்காக இந்த படிவத்தை நிரப்பவும். சமர்ப்பிக்கப்பட்ட அனைத்து விண்ணப்பங்களையும் நிர்வாகம் பார்க்கலாம்.",
      apply_point_1: "தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.",
      apply_point_2: "சரியான மொபைல் எண் மற்றும் தனிப்பட்ட விவரங்களை வழங்கவும்.",
      apply_point_3: "ஒருமுறை சமர்ப்பிக்கவும்; நிர்வாகம் தொடர்பு கொள்கிறது.",
      form_candidate_name: "விண்ணப்பதாரர் பெயர்",
      form_father_name: "தந்தை பெயர்",
      form_mother_name: "தாய் பெயர்",
      form_dob: "பிறந்த தேதி",
      form_gender: "பாலினம்",
      gender_male: "ஆண்",
      gender_female: "பெண்",
      form_qualification: "கல்வித் தகுதி",
      form_religion: "மதம்",
      form_category: "பிரிவு",
      form_address: "தொடர்பு முகவரி",
      form_mobile: "மொபைல் எண்",
      category_select: "பிரிவை தேர்வு செய்யவும்",
      category_general: "பொது",
      btn_submit_application: "விண்ணப்பத்தை சமர்ப்பிக்கவும்",
      apply_note: "இந்த டெமோவில் தரவு உலாவி local storage-ல் சேமிக்கப்படுகிறது.",
      placeholder_candidate: "விண்ணப்பதாரர் பெயர்",
      placeholder_father: "தந்தை பெயர்",
      placeholder_mother: "தாய் பெயர்",
      placeholder_qualification: "கல்வித் தகுதி",
      placeholder_religion: "மதம்",
      placeholder_mobile: "மொபைல் எண்",
      placeholder_address: "முகவரியை உள்ளிடவும்",
      status_fill_required: "தேவையான அனைத்து புலங்களையும் நிரப்பவும்.",
      status_apply_success: "விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. நிர்வாகம் இப்போது பார்க்கலாம்.",
      admin_title: "நிர்வாக பலகை",
      admin_demo_password: "டெமோ நிர்வாக கடவுச்சொல்:",
      admin_login_title: "நிர்வாக உள்நுழைவு",
      admin_password_placeholder: "நிர்வாக கடவுச்சொல்லை உள்ளிடவும்",
      btn_login: "உள்நுழைவு",
      admin_update_title: "இணையதள தகவலை புதுப்பிக்கவும்",
      label_tagline: "டேக்லைன்",
      label_hero_title: "முக்கிய தலைப்பு",
      label_hero_text: "முக்கிய உரை",
      label_announcement: "அறிவிப்பு",
      label_address: "முகவரி",
      label_phone: "தொலைபேசி",
      label_email: "மின்னஞ்சல்",
      label_instagram_url: "Instagram ப்ரொஃபைல் URL",
      label_facebook_url: "Facebook பக்கம் URL / ID",
      label_marquee_images: "முகப்பு பக்க படங்கள்",
      label_marquee_upload: "மார்கி படங்களை பதிவேற்று",
      placeholder_marquee_images: "assets/images/photo-1.jpg\nassets/images/photo-2.jpg\nhttps://example.com/photo-3.jpg",
      admin_marquee_hint: "ஒவ்வொரு வரியிலும் ஒரு பட path அல்லது URL கொடுக்கவும். உதாரணம்: assets/images/photo-1.jpg",
      admin_marquee_upload_hint: "படங்களை இங்கே பதிவேற்றலாம். அவை முகப்பு பக்க marquee-ல் காட்டப்படும்.",
      admin_marquee_empty: "இன்னும் marquee படங்கள் சேர்க்கப்படவில்லை.",
      admin_marquee_uploaded_label: "பதிவேற்றப்பட்ட படம்",
      admin_marquee_link_label: "பட இணைப்பு",
      admin_marquee_uploaded_note: "இந்த browser-ல் சேமிக்கப்பட்டது",
      btn_save_site: "இணையதள தகவலை சேமிக்கவும்",
      status_content_saved: "இணையதள தகவல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.",
      status_marquee_upload_saved: "Marquee படங்கள் வெற்றிகரமாக பதிவேற்றப்பட்டன.",
      status_marquee_upload_failed: "Marquee படங்களை பதிவேற்ற முடியவில்லை.",
      status_marquee_removed: "Marquee படம் நீக்கப்பட்டது.",
      admin_news_title: "செய்தி மேலாண்மை",
      label_news_title: "செய்தி தலைப்பு",
      label_news_date: "செய்தி தேதி",
      label_summary: "சுருக்கம்",
      btn_add_news: "செய்தி சேர்க்கவும்",
      admin_news_empty: "இன்னும் எந்த செய்தியும் சேர்க்கப்படவில்லை.",
      admin_instagram_title: "Instagram பதிவுகள்",
      label_instagram_post_url: "Instagram பதிவு URL அல்லது Embed Code",
      btn_add_instagram_post: "Instagram பதிவு சேர்க்கவும்",
      admin_instagram_hint: "Instagram பதிவு URL அல்லது முழு embed code ஐ ஒட்டவும்; அது முகப்பு பக்கத்தில் காட்டப்படும்.",
      admin_instagram_empty: "இன்னும் Instagram பதிவுகள் சேர்க்கப்படவில்லை.",
      admin_instagram_invalid: "சரியான Instagram பதிவு URL அல்லது embed code ஐ உள்ளிடவும்.",
      btn_delete: "நீக்கு",
      admin_applications_title: "விண்ணப்ப சமர்ப்பிப்புகள்",
      btn_export_csv: "CSV ஏற்றுமதி",
      btn_clear_submissions: "சமர்ப்பிப்புகளை அழிக்கவும்",
      btn_export_settings: "அமைப்புகளை JSON ஆக ஏற்றுமதி",
      status_exported: "அமைப்புகள் வெற்றிகரமாக ஏற்றுமதி செய்யப்பட்டது! assets/data/settings.json இல் உள்ள கோப்பை மாற்றி GitHub க்கு தள்ளவும்.",
      status_csv_exported: "CSV வெற்றிகரமாக ஏற்றுமதி செய்யப்பட்டது.",
      confirm_clear_submissions: "அனைத்து விண்ணப்ப சமர்ப்பிப்புகளையும் நிர்வாக அட்டவணையில் இருந்து நீக்கவா? தேவையானால் முதலில் CSV ஏற்றுமதி செய்து வைத்துக்கொள்ளுங்கள்.",
      status_submissions_cleared: "விண்ணப்ப சமர்ப்பிப்புகள் வெற்றிகரமாக அழிக்கப்பட்டன.",
      status_submissions_clear_failed: "இப்போது சமர்ப்பிப்புகளை அழிக்க முடியவில்லை.",
      th_candidate: "விண்ணப்பதாரர்",
      th_father: "தந்தை",
      th_mobile: "மொபைல்",
      th_dob: "பிறந்த தேதி",
      th_category: "பிரிவு",
      th_submitted: "சமர்ப்பித்த தேதி",
      admin_applications_empty: "இன்னும் எந்த விண்ணப்பமும் இல்லை.",
      btn_logout: "வெளியேறு",
      status_login_failed: "கடவுச்சொல் தவறு.",
      status_login_success: "வெற்றிகரமாக உள்நுழைந்தீர்கள்.",
      alert_no_applications: "ஏற்றுமதி செய்ய விண்ணப்பங்கள் இல்லை."
    }
  };

  function normalizeLanguage(language) {
    return language === "ta" ? "ta" : "en";
  }

  function getLanguage() {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE);
  }

  function t(key) {
    var language = getLanguage();
    return translations[language][key] || translations.en[key] || key;
  }

  function applyLanguage(language) {
    var normalized = normalizeLanguage(language);
    localStorage.setItem(LANGUAGE_KEY, normalized);
    document.documentElement.lang = normalized;

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      var key = element.getAttribute("data-i18n");
      element.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      var key = element.getAttribute("data-i18n-placeholder");
      element.setAttribute("placeholder", t(key));
    });

    document.querySelectorAll("[data-lang-toggle]").forEach(function (button) {
      button.textContent = normalized === "en" ? "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD" : "English";
    });

    window.dispatchEvent(new CustomEvent("vision-language-changed", {
      detail: { language: normalized }
    }));
  }

  function toggleLanguage() {
    applyLanguage(getLanguage() === "en" ? "ta" : "en");
  }

  function ensureHeaderLogos() {
    document.querySelectorAll(".brand .brand-mark").forEach(function (mark) {
      if (!mark.classList.contains("brand-mark-image")) {
        mark.classList.add("brand-mark-image");
      }

      var existingImage = mark.querySelector("img");
      if (!existingImage) {
        mark.textContent = "";
        existingImage = document.createElement("img");
        existingImage.alt = "Vision Education Academy logo";
        mark.appendChild(existingImage);
      }

      existingImage.src = "assets/images/new_logo.png?v=5";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureHeaderLogos();
    applyLanguage(getLanguage());

    document.querySelectorAll("[data-lang-toggle]").forEach(function (button) {
      button.addEventListener("click", toggleLanguage);
    });
  });

  window.VisionI18n = {
    getLanguage: getLanguage,
    setLanguage: applyLanguage,
    t: t
  };
})();

