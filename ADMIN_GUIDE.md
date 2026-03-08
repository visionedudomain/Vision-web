# Vision Education Academy - Admin Guide

## How to Update Website Content and Deploy Changes

This guide explains how the admin can update website content and make those changes visible to all users, regardless of device.

---

## System Overview

Your website uses a **settings.json file** for all content. This file is the source of truth for all data displayed on your website. When the admin makes changes, those changes are saved in the browser. To make changes permanent across all devices, you need to:

1. **Make changes** in the Admin Dashboard
2. **Export settings** as JSON file
3. **Replace the file** in the repository
4. **Push to GitHub** (3 simple commands)

---

## Step-by-Step Process

### Step 1: Access Admin Dashboard

1. Go to: `https://visionedudomain.github.io/Vision-web/admin.html`
   - Or if working locally: `http://localhost:5500/admin.html`

2. Enter the admin password: **`VisionAdmin@123`**

3. You'll see the dashboard with all forms to edit:
   - Tagline
   - Hero Title & Text
   - Announcement
   - Address & Contact Info
   - Marquee Images
   - Programs
   - News & Updates
   - Instagram Posts

### Step 2: Make Your Changes

Edit any information you want on the website. For example:
- Update phone number
- Change announcement text
- Add new programs
- Update contact address
- Add Instagram posts
- Upload marquee images

**All changes are saved automatically in your browser!**

### Step 3: Export Settings

Once you've made all your changes:

1. Scroll to the bottom of the Admin Dashboard
2. Click the button: **"Export Settings as JSON"**
3. A file named `vision-settings-[DATE].json` will download to your computer
4. A success message will appear on the screen

### Step 4: Replace the File

Now you need to update the actual website file:

#### Option A: Using File Manager (Easy way)
1. Go to your workspace folder: `P:\Vision Web\`
2. Open folder: `assets` → `data`
3. You'll see: `settings.json` (the old file)
4. Delete the old `settings.json`
5. Rename your downloaded file to: `settings.json`
6. Move it into the `assets/data/` folder
7. Save the file

#### Option B: Using VS Code (If you know how)
1. Open VS Code
2. Open the file: `assets/data/settings.json`
3. Replace its entire content with your exported JSON
4. Save the file (Ctrl + S)

### Step 5: Push Changes to GitHub

Now you need to tell GitHub about the changes. Open PowerShell in your workspace folder and run:

```powershell
cd "p:\Vision Web"
git add .
git commit -m "Updated website content from admin"
git push
```

**That's it!** After these 3 commands, your changes will be live on:
**https://visionedudomain.github.io/Vision-web/**

The website will update within 1-2 minutes.

---

## What Gets Updated?

The settings.json file controls these website elements:

| Item | What It Controls |
|------|-----------------|
| **Academy Name** | Brand name displayed at top |
| **Tagline** | Subtitle under the name |
| **Hero Title** | Large title on home page |
| **Hero Text** | Description text on home page |
| **Announcement** | Important message banner |
| **Address** | Location displayed in contact section |
| **Phone** | Contact numbers |
| **Email** | Email displayed on site |
| **Marquee Images** | Carousel images on home page |
| **Programs** | Course/program listings |
| **News** | News & updates section |
| **Social Links** | Instagram & Facebook URLs |

---

## Troubleshooting

### Changes not appearing on website?

1. **Wait 1-2 minutes** - GitHub Pages needs time to rebuild
2. **Hard refresh the page** - Press: `Ctrl + F5`
3. **Check the push command** - Make sure the 3 commands ran successfully
4. **Verify file location** - File should be: `assets/data/settings.json`

### Downloaded JSON file missing?

1. Check your Downloads folder
2. Look for file name: `vision-settings-2026-03-XX.json`
3. If not found, try exporting again on the admin page

### Password not working?

- The default admin password is: **`VisionAdmin@123`**
- Passwords are case-sensitive!

### File replacement didn't work?

1. Make sure you're replacing the file at: `P:\Vision Web\assets\data\settings.json`
2. The new file must be named exactly: `settings.json` (lowercase)
3. Delete the old file first, then add the new one
4. Do NOT modify the file format

---

## Important Notes

⚠️ **DO NOT:**
- Change the JSON file structure
- Delete required fields
- Edit the JSON file manually (unless you know what you're doing)
- Skip the "git push" step (changes won't be live without it)

✅ **ALWAYS:**
- Use the Export button to get the JSON file
- Replace the entire file (don't merge)
- Push to GitHub after changes
- Wait for the website to rebuild (1-2 minutes)

---

## Quick Reference

**Access Admin:**
- https://visionedudomain.github.io/Vision-web/admin.html

**Admin Password:**
- `VisionAdmin@123`

**Push Commands (after file replacement):**
```powershell
cd "p:\Vision Web"
git add .
git commit -m "Updated website content"
git push
```

**Live Website:**
- https://visionedudomain.github.io/Vision-web/

---

## Questions?

If you encounter any issues:
1. Check this guide for solutions
2. Ensure all 3 steps (Edit → Export → Push) are completed
3. Always wait 1-2 minutes for changes to appear live
4. Hard refresh (Ctrl + F5) to see updates on your browser

---

**Your website is now fully manageable through the admin panel!** 🎉
