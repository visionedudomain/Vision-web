# Vision Education Academy Website

Static bilingual (English + Tamil) website with:
- Public homepage (`index.html`)
- Application form (`apply.html`)
- Admin dashboard (`admin.html`)

## Local Run

1. Open the folder in VS Code: `P:\Vision Web`
2. Open `index.html`
3. Right click and select `Open with Live Server`
4. Use these URLs:
- `http://localhost:5500/index.html`
- `http://localhost:5500/apply.html`
- `http://localhost:5500/admin.html`

If you changed files and do not see updates, hard refresh: `Ctrl + F5`.

## Admin Login

- Page: `admin.html`
- Demo password: `vision123`

Use admin panel to update:
- Announcement
- Hero content
- Contact details
- Instagram and Facebook links
- News updates

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload all files from this folder.
3. In GitHub repository, open `Settings > Pages`.
4. Under `Build and deployment`:
- Source: `Deploy from a branch`
- Branch: `main` (or your default branch)
- Folder: `/ (root)`
5. Save and wait 1-2 minutes.
6. Open the generated website URL from GitHub Pages settings.

## Deploy to Netlify

Method 1 (easiest):
1. Go to `https://app.netlify.com/`
2. Drag and drop the `Vision Web` folder on the dashboard.
3. Netlify gives a live URL instantly.

Method 2 (Git-linked):
1. Push this folder to GitHub.
2. In Netlify, choose `Add new site > Import an existing project`.
3. Select the repo and deploy.

## Notes

- Data is stored in browser `localStorage`.
- If you open the site in a different browser/device, existing admin-entered data will not automatically appear there.
- For production shared data, connect to a backend/database in a later phase.
