# Vision Education Academy - Admin Guide

## What Changed

The website no longer needs JSON export and Git push for normal content changes.

Admin updates now happen through Firebase:
- website information updates are shared live
- news updates are shared live
- marquee image links are shared live
- application submissions are visible in the admin dashboard

## Daily Admin Steps

1. Open the admin page:
- `https://visionedudomain.github.io/Vision-web/admin.html`

2. Enter the admin account password.

3. Update any of these sections:
- website information
- announcement
- contact details
- Instagram and Facebook links
- marquee image links
- news updates
- Instagram posts

4. Save or add the item.

That is all. Changes are visible to everyone automatically.

## What Admin Does Not Need To Do

Admin does not need to:
- edit code
- export JSON
- replace files
- run Git commands
- push to GitHub

## If Login Fails

Ask the website owner to check:
- Firebase config in `assets/js/firebase-config.js`
- admin email in Firebase Auth
- Firestore rules

## If Changes Do Not Appear

1. Wait a few seconds.
2. Refresh the page once.
3. If the issue continues, ask the owner to check Firebase rules and internet connection.

## For the Website Owner

The one-time technical setup is documented in [README.md](P:\Vision Web\README.md).
After that setup, the admin can manage the site without coding.
