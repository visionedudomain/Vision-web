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
      academy_name_brand: "à®µà®¿à®·à®©à¯ à®•à®²à¯à®µà®¿ à®®à¯ˆà®¯à®®à¯",
      nav_home: "à®®à¯à®•à®ªà¯à®ªà¯",
      nav_apply: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®®à¯",
      nav_test: "ஆன்லைன் தேர்வு",
      nav_admin: "à®¨à®¿à®°à¯à®µà®¾à®•à®®à¯",
      hero_identity_title: "à®µà®¿à®·à®©à¯ à®•à®²à¯à®µà®¿ à®®à¯ˆà®¯à®®à¯",
      hero_identity_subtitle: "à®…à®°à®šà¯ à®ªà¯‹à®Ÿà¯à®Ÿà®¿à®¤à¯ à®¤à¯‡à®°à¯à®µà¯à®•à®³à¯à®•à¯à®•à®¾à®© à®®à¯ˆà®¯à®®à¯",
      hero_identity_address: "à®¨à®µà®¾ à®šà®©à¯à®©à®¤à®¿ à®¤à¯†à®°à¯, à®µà®¿à®²à¯à®²à®¿à®¯à®©à¯‚à®°à¯ - à®ªà¯à®¤à¯à®šà¯à®šà¯‡à®°à®¿",
      hero_identity_phone: "à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®Žà®£à¯: 9894382305 / 9994905624",
      home_apply_now: "à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯",
      home_latest_news: "à®šà®®à¯€à®ªà®¤à¯à®¤à®¿à®¯ à®šà¯†à®¯à¯à®¤à®¿à®•à®³à¯",
      home_announcement_title: "à®¤à®±à¯à®ªà¯‹à®¤à¯ˆà®¯ à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯",
      home_programs: "à®ªà®¾à®Ÿà®¤à¯à®¤à®¿à®Ÿà¯à®Ÿà®™à¯à®•à®³à¯",
      home_news_updates: "à®šà¯†à®¯à¯à®¤à®¿à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯",
      home_instagram_posts: "Instagram à®ªà®¤à®¿à®µà¯à®•à®³à¯",
      home_follow_instagram: "Instagram-à®²à¯ à®ªà®¿à®©à¯à®¤à¯Šà®Ÿà®°à®µà¯à®®à¯",
      home_follow_facebook: "Facebook à®ªà®•à¯à®•à®¤à¯à®¤à¯ˆ à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯",
      home_contact: "à®¤à¯Šà®Ÿà®°à¯à®ªà¯",
      home_address: "à®®à¯à®•à®µà®°à®¿:",
      home_phone: "à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿:",
      home_email: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯:",
      home_instagram: "Instagram:",
      home_facebook: "Facebook:",
      home_view_map: "à®µà®°à¯ˆà®ªà®Ÿà®¤à¯à®¤à®¿à®²à¯ à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯",
      home_map_title: "à®µà®¿à®·à®©à¯ à®•à®²à¯à®µà®¿ à®®à¯ˆà®¯à®®à¯ à®‡à®Ÿà®®à¯",
      footer_rights: "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯à®®à¯ à®ªà®¾à®¤à¯à®•à®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®µà¯ˆ.",
      home_empty_programs: "à®ªà®¾à®Ÿà®¤à¯à®¤à®¿à®Ÿà¯à®Ÿ à®µà®¿à®µà®°à®™à¯à®•à®³à¯ à®µà®¿à®°à¯ˆà®µà®¿à®²à¯ à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®®à¯.",
      home_empty_news: "à®¤à®±à¯à®ªà¯‹à®¤à¯ à®šà¯†à®¯à¯à®¤à®¿à®•à®³à¯ à®‡à®²à¯à®²à¯ˆ.",
      home_instagram_empty: "Instagram à®ªà®¤à®¿à®µà¯à®•à®³à¯ à®‡à®©à¯à®©à¯à®®à¯ à®‡à®²à¯à®²à¯ˆ. à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯à®•à¯à®•à¯ à®ªà®¿à®©à¯à®¤à¯Šà®Ÿà®°à®µà¯à®®à¯.",
      apply_title: "à®µà®¿à®£à¯à®£à®ªà¯à®ª à®ªà®Ÿà®¿à®µà®®à¯",
      apply_subtitle: "à®šà¯‡à®°à¯à®•à¯à®•à¯ˆà®•à¯à®•à®¾à®• à®‡à®¨à¯à®¤ à®ªà®Ÿà®¿à®µà®¤à¯à®¤à¯ˆ à®¨à®¿à®°à®ªà¯à®ªà®µà¯à®®à¯. à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®…à®©à¯ˆà®¤à¯à®¤à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®™à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®¨à®¿à®°à¯à®µà®¾à®•à®®à¯ à®ªà®¾à®°à¯à®•à¯à®•à®²à®¾à®®à¯.",
      apply_point_1: "à®¤à¯‡à®µà¯ˆà®¯à®¾à®© à®…à®©à¯ˆà®¤à¯à®¤à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®¨à®¿à®°à®ªà¯à®ªà®µà¯à®®à¯.",
      apply_point_2: "à®šà®°à®¿à®¯à®¾à®© à®®à¯Šà®ªà¯ˆà®²à¯ à®Žà®£à¯ à®®à®±à¯à®±à¯à®®à¯ à®¤à®©à®¿à®ªà¯à®ªà®Ÿà¯à®Ÿ à®µà®¿à®µà®°à®™à¯à®•à®³à¯ˆ à®µà®´à®™à¯à®•à®µà¯à®®à¯.",
      apply_point_3: "à®’à®°à¯à®®à¯à®±à¯ˆ à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯; à®¨à®¿à®°à¯à®µà®¾à®•à®®à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®•à¯Šà®³à¯à®•à®¿à®±à®¤à¯.",
      form_candidate_name: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¤à®¾à®°à®°à¯ à®ªà¯†à®¯à®°à¯",
      form_father_name: "à®¤à®¨à¯à®¤à¯ˆ à®ªà¯†à®¯à®°à¯",
      form_mother_name: "à®¤à®¾à®¯à¯ à®ªà¯†à®¯à®°à¯",
      form_dob: "à®ªà®¿à®±à®¨à¯à®¤ à®¤à¯‡à®¤à®¿",
      form_gender: "à®ªà®¾à®²à®¿à®©à®®à¯",
      gender_male: "à®†à®£à¯",
      gender_female: "à®ªà¯†à®£à¯",
      form_qualification: "à®•à®²à¯à®µà®¿à®¤à¯ à®¤à®•à¯à®¤à®¿",
      form_religion: "à®®à®¤à®®à¯",
      form_category: "à®ªà®¿à®°à®¿à®µà¯",
      form_address: "à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®®à¯à®•à®µà®°à®¿",
      form_mobile: "à®®à¯Šà®ªà¯ˆà®²à¯ à®Žà®£à¯",
      category_select: "à®ªà®¿à®°à®¿à®µà¯ˆ à®¤à¯‡à®°à¯à®µà¯ à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯",
      category_general: "à®ªà¯Šà®¤à¯",
      btn_submit_application: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¤à¯à®¤à¯ˆ à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯",
      apply_note: "à®‡à®¨à¯à®¤ à®Ÿà¯†à®®à¯‹à®µà®¿à®²à¯ à®¤à®°à®µà¯ à®‰à®²à®¾à®µà®¿ local storage-à®²à¯ à®šà¯‡à®®à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®•à®¿à®±à®¤à¯.",
      placeholder_candidate: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¤à®¾à®°à®°à¯ à®ªà¯†à®¯à®°à¯",
      placeholder_father: "à®¤à®¨à¯à®¤à¯ˆ à®ªà¯†à®¯à®°à¯",
      placeholder_mother: "à®¤à®¾à®¯à¯ à®ªà¯†à®¯à®°à¯",
      placeholder_qualification: "à®•à®²à¯à®µà®¿à®¤à¯ à®¤à®•à¯à®¤à®¿",
      placeholder_religion: "à®®à®¤à®®à¯",
      placeholder_mobile: "à®®à¯Šà®ªà¯ˆà®²à¯ à®Žà®£à¯",
      placeholder_address: "à®®à¯à®•à®µà®°à®¿à®¯à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯",
      status_fill_required: "à®¤à¯‡à®µà¯ˆà®¯à®¾à®© à®…à®©à¯ˆà®¤à¯à®¤à¯ à®ªà¯à®²à®™à¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®¨à®¿à®°à®ªà¯à®ªà®µà¯à®®à¯.",
      status_apply_success: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®®à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯. à®¨à®¿à®°à¯à®µà®¾à®•à®®à¯ à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®ªà®¾à®°à¯à®•à¯à®•à®²à®¾à®®à¯.",
      admin_title: "à®¨à®¿à®°à¯à®µà®¾à®• à®ªà®²à®•à¯ˆ",
      admin_demo_password: "à®Ÿà¯†à®®à¯‹ à®¨à®¿à®°à¯à®µà®¾à®• à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯:",
      admin_login_title: "à®¨à®¿à®°à¯à®µà®¾à®• à®‰à®³à¯à®¨à¯à®´à¯ˆà®µà¯",
      admin_password_placeholder: "à®¨à®¿à®°à¯à®µà®¾à®• à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯",
      btn_login: "à®‰à®³à¯à®¨à¯à®´à¯ˆà®µà¯",
      admin_update_title: "à®‡à®£à¯ˆà®¯à®¤à®³ à®¤à®•à®µà®²à¯ˆ à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯",
      label_tagline: "à®Ÿà¯‡à®•à¯à®²à¯ˆà®©à¯",
      label_hero_title: "à®®à¯à®•à¯à®•à®¿à®¯ à®¤à®²à¯ˆà®ªà¯à®ªà¯",
      label_hero_text: "à®®à¯à®•à¯à®•à®¿à®¯ à®‰à®°à¯ˆ",
      label_announcement: "à®…à®±à®¿à®µà®¿à®ªà¯à®ªà¯",
      label_address: "à®®à¯à®•à®µà®°à®¿",
      label_phone: "à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿",
      label_email: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯",
      label_instagram_url: "Instagram à®ªà¯à®°à¯Šà®ƒà®ªà¯ˆà®²à¯ URL",
      label_facebook_url: "Facebook à®ªà®•à¯à®•à®®à¯ URL / ID",
      label_marquee_images: "à®®à¯à®•à®ªà¯à®ªà¯ à®ªà®•à¯à®• à®ªà®Ÿà®™à¯à®•à®³à¯",
      label_marquee_upload: "à®®à®¾à®°à¯à®•à®¿ à®ªà®Ÿà®™à¯à®•à®³à¯ˆ à®ªà®¤à®¿à®µà¯‡à®±à¯à®±à¯",
      placeholder_marquee_images: "assets/images/photo-1.jpg\nassets/images/photo-2.jpg\nhttps://example.com/photo-3.jpg",
      admin_marquee_hint: "à®’à®µà¯à®µà¯Šà®°à¯ à®µà®°à®¿à®¯à®¿à®²à¯à®®à¯ à®’à®°à¯ à®ªà®Ÿ path à®…à®²à¯à®²à®¤à¯ URL à®•à¯Šà®Ÿà¯à®•à¯à®•à®µà¯à®®à¯. à®‰à®¤à®¾à®°à®£à®®à¯: assets/images/photo-1.jpg",
      admin_marquee_upload_hint: "à®ªà®Ÿà®™à¯à®•à®³à¯ˆ à®‡à®™à¯à®•à¯‡ à®ªà®¤à®¿à®µà¯‡à®±à¯à®±à®²à®¾à®®à¯. à®…à®µà¯ˆ à®®à¯à®•à®ªà¯à®ªà¯ à®ªà®•à¯à®• marquee-à®²à¯ à®•à®¾à®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà¯à®®à¯.",
      admin_marquee_empty: "à®‡à®©à¯à®©à¯à®®à¯ marquee à®ªà®Ÿà®™à¯à®•à®³à¯ à®šà¯‡à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ.",
      admin_marquee_uploaded_label: "à®ªà®¤à®¿à®µà¯‡à®±à¯à®±à®ªà¯à®ªà®Ÿà¯à®Ÿ à®ªà®Ÿà®®à¯",
      admin_marquee_link_label: "à®ªà®Ÿ à®‡à®£à¯ˆà®ªà¯à®ªà¯",
      admin_marquee_uploaded_note: "à®‡à®¨à¯à®¤ browser-à®²à¯ à®šà¯‡à®®à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯",
      btn_save_site: "à®‡à®£à¯ˆà®¯à®¤à®³ à®¤à®•à®µà®²à¯ˆ à®šà¯‡à®®à®¿à®•à¯à®•à®µà¯à®®à¯",
      status_content_saved: "à®‡à®£à¯ˆà®¯à®¤à®³ à®¤à®•à®µà®²à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯.",
      status_marquee_upload_saved: "Marquee à®ªà®Ÿà®™à¯à®•à®³à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®ªà®¤à®¿à®µà¯‡à®±à¯à®±à®ªà¯à®ªà®Ÿà¯à®Ÿà®©.",
      status_marquee_upload_failed: "Marquee à®ªà®Ÿà®™à¯à®•à®³à¯ˆ à®ªà®¤à®¿à®µà¯‡à®±à¯à®± à®®à¯à®Ÿà®¿à®¯à®µà®¿à®²à¯à®²à¯ˆ.",
      status_marquee_removed: "Marquee à®ªà®Ÿà®®à¯ à®¨à¯€à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯.",
      admin_news_title: "à®šà¯†à®¯à¯à®¤à®¿ à®®à¯‡à®²à®¾à®£à¯à®®à¯ˆ",
      label_news_title: "à®šà¯†à®¯à¯à®¤à®¿ à®¤à®²à¯ˆà®ªà¯à®ªà¯",
      label_news_date: "à®šà¯†à®¯à¯à®¤à®¿ à®¤à¯‡à®¤à®¿",
      label_summary: "à®šà¯à®°à¯à®•à¯à®•à®®à¯",
      btn_add_news: "à®šà¯†à®¯à¯à®¤à®¿ à®šà¯‡à®°à¯à®•à¯à®•à®µà¯à®®à¯",
      admin_news_empty: "à®‡à®©à¯à®©à¯à®®à¯ à®Žà®¨à¯à®¤ à®šà¯†à®¯à¯à®¤à®¿à®¯à¯à®®à¯ à®šà¯‡à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ.",
      admin_instagram_title: "Instagram à®ªà®¤à®¿à®µà¯à®•à®³à¯",
      label_instagram_post_url: "Instagram à®ªà®¤à®¿à®µà¯ URL à®…à®²à¯à®²à®¤à¯ Embed Code",
      btn_add_instagram_post: "Instagram à®ªà®¤à®¿à®µà¯ à®šà¯‡à®°à¯à®•à¯à®•à®µà¯à®®à¯",
      admin_instagram_hint: "Instagram à®ªà®¤à®¿à®µà¯ URL à®…à®²à¯à®²à®¤à¯ à®®à¯à®´à¯ embed code à® à®’à®Ÿà¯à®Ÿà®µà¯à®®à¯; à®…à®¤à¯ à®®à¯à®•à®ªà¯à®ªà¯ à®ªà®•à¯à®•à®¤à¯à®¤à®¿à®²à¯ à®•à®¾à®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà¯à®®à¯.",
      admin_instagram_empty: "à®‡à®©à¯à®©à¯à®®à¯ Instagram à®ªà®¤à®¿à®µà¯à®•à®³à¯ à®šà¯‡à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ.",
      admin_instagram_invalid: "à®šà®°à®¿à®¯à®¾à®© Instagram à®ªà®¤à®¿à®µà¯ URL à®…à®²à¯à®²à®¤à¯ embed code à® à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.",
      btn_delete: "à®¨à¯€à®•à¯à®•à¯",
      admin_applications_title: "à®µà®¿à®£à¯à®£à®ªà¯à®ª à®šà®®à®°à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯",
      btn_export_csv: "CSV à®à®±à¯à®±à¯à®®à®¤à®¿",
      btn_clear_submissions: "à®šà®®à®°à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯ˆ à®…à®´à®¿à®•à¯à®•à®µà¯à®®à¯",
      btn_export_settings: "à®…à®®à¯ˆà®ªà¯à®ªà¯à®•à®³à¯ˆ JSON à®†à®• à®à®±à¯à®±à¯à®®à®¤à®¿",
      status_exported: "à®…à®®à¯ˆà®ªà¯à®ªà¯à®•à®³à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®à®±à¯à®±à¯à®®à®¤à®¿ à®šà¯†à®¯à¯à®¯à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯! assets/data/settings.json à®‡à®²à¯ à®‰à®³à¯à®³ à®•à¯‹à®ªà¯à®ªà¯ˆ à®®à®¾à®±à¯à®±à®¿ GitHub à®•à¯à®•à¯ à®¤à®³à¯à®³à®µà¯à®®à¯.",
      status_csv_exported: "CSV à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®à®±à¯à®±à¯à®®à®¤à®¿ à®šà¯†à®¯à¯à®¯à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯.",
      confirm_clear_submissions: "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ª à®šà®®à®°à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯ˆà®¯à¯à®®à¯ à®¨à®¿à®°à¯à®µà®¾à®• à®…à®Ÿà¯à®Ÿà®µà®£à¯ˆà®¯à®¿à®²à¯ à®‡à®°à¯à®¨à¯à®¤à¯ à®¨à¯€à®•à¯à®•à®µà®¾? à®¤à¯‡à®µà¯ˆà®¯à®¾à®©à®¾à®²à¯ à®®à¯à®¤à®²à®¿à®²à¯ CSV à®à®±à¯à®±à¯à®®à®¤à®¿ à®šà¯†à®¯à¯à®¤à¯ à®µà¯ˆà®¤à¯à®¤à¯à®•à¯à®•à¯Šà®³à¯à®³à¯à®™à¯à®•à®³à¯.",
      status_submissions_cleared: "à®µà®¿à®£à¯à®£à®ªà¯à®ª à®šà®®à®°à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®…à®´à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®©.",
      status_submissions_clear_failed: "à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®šà®®à®°à¯à®ªà¯à®ªà®¿à®ªà¯à®ªà¯à®•à®³à¯ˆ à®…à®´à®¿à®•à¯à®• à®®à¯à®Ÿà®¿à®¯à®µà®¿à®²à¯à®²à¯ˆ.",
      th_candidate: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¤à®¾à®°à®°à¯",
      th_father: "à®¤à®¨à¯à®¤à¯ˆ",
      th_mobile: "à®®à¯Šà®ªà¯ˆà®²à¯",
      th_dob: "à®ªà®¿à®±à®¨à¯à®¤ à®¤à¯‡à®¤à®¿",
      th_category: "à®ªà®¿à®°à®¿à®µà¯",
      th_submitted: "à®šà®®à®°à¯à®ªà¯à®ªà®¿à®¤à¯à®¤ à®¤à¯‡à®¤à®¿",
      admin_applications_empty: "à®‡à®©à¯à®©à¯à®®à¯ à®Žà®¨à¯à®¤ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®®à¯à®®à¯ à®‡à®²à¯à®²à¯ˆ.",
      btn_logout: "à®µà¯†à®³à®¿à®¯à¯‡à®±à¯",
      status_login_failed: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®¤à®µà®±à¯.",
      status_login_success: "à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®‰à®³à¯à®¨à¯à®´à¯ˆà®¨à¯à®¤à¯€à®°à¯à®•à®³à¯.",
      alert_no_applications: "à®à®±à¯à®±à¯à®®à®¤à®¿ à®šà¯†à®¯à¯à®¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®™à¯à®•à®³à¯ à®‡à®²à¯à®²à¯ˆ."
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
      button.textContent = normalized === "en" ? "à®¤à®®à®¿à®´à¯" : "English";
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

