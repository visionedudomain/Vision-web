# Vision Education Academy Website

Bilingual academy website with:
- public homepage: `index.html`
- academy application form: `apply.html`
- admin dashboard: `admin.html`
- online test registration: `test-register.html`
- student test portal: `test.html`
- Firebase live content updates
- secure online test backend through Netlify Functions

## Local Run

1. Open the folder in VS Code: `P:\Vision Web`
2. Start Live Server from the project root
3. Open:
- `http://localhost:5500/index.html`
- `http://localhost:5500/apply.html`
- `http://localhost:5500/admin.html`
- `http://localhost:5500/test-register.html`
- `http://localhost:5500/test.html`

If you change files and do not see updates, use `Ctrl + F5`.

## Architecture

### Frontend
- GitHub Pages or Netlify can host the HTML/CSS/JS files.

### Firebase
- Firebase Authentication:
  - admin login
- Firestore:
  - shared site content
  - news
  - academy applications
  - online test registrations
  - approved test students
  - test definitions
  - test attempt results

### Netlify Functions
- secure student registration handling
- password hashing
- student login session creation
- one-attempt test control
- secure test submission
- admin bulk approval by CSV

Important:
- the online test portal is not fully secure if hosted as static-only frontend.
- for the test portal, deploy the backend functions on Netlify.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web App in Firebase Console.
3. Enable:
- Authentication -> Email/Password
- Cloud Firestore
4. Create the admin user in Firebase Authentication using the same email used in `assets/js/firebase-config.js`.
5. Open `assets/js/firebase-config.js` and set:
- `apiKey`
- `authDomain`
- `projectId`
- `messagingSenderId`
- `appId`
- `adminEmail`
- `backendBaseUrl`

Example:

```js
window.VisionFirebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "...",
  backendBaseUrl: "https://your-netlify-site.netlify.app",
  adminEmail: "visionedudomain@gmail.com"
};
```

Notes:
- if the whole site is hosted on the same Netlify site as the functions, `backendBaseUrl` can stay empty.
- if the frontend stays on GitHub Pages, set `backendBaseUrl` to your Netlify site URL.

## Firestore Rules

Paste this in `Firestore Database -> Rules` and publish it.
Replace the admin email if needed.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == "visionedudomain@gmail.com";
    }

    match /site/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /news/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /applications/{document} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    match /test_registrations/{document} {
      allow read, write: if isAdmin();
    }

    match /students/{document} {
      allow read, write: if isAdmin();
    }

    match /tests/{document} {
      allow read, write: if isAdmin();
    }

    match /attempts/{document} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Netlify Backend Setup

This is required for the online test portal.

### 1. Create a Netlify site

Connect this GitHub repository to Netlify.

### 2. Netlify will use
- `netlify.toml`
- `package.json`
- `netlify/functions/`

### 3. Add Netlify environment variables

In `Netlify -> Site configuration -> Environment variables`, add:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
  - paste the full Firebase service account JSON in one line
  - or use `FIREBASE_SERVICE_ACCOUNT_BASE64` instead
- `TEST_SESSION_SECRET`
  - long random secret string
- `VISION_ADMIN_EMAIL`
  - `visionedudomain@gmail.com`

### 4. Get Firebase service account JSON

Firebase Console -> Project settings -> Service accounts -> Generate new private key

Use that JSON in Netlify environment variables.

### 5. Deploy Netlify

After deployment:
- note the Netlify site URL
- put that URL in `backendBaseUrl` if your frontend is not hosted on the same Netlify site

## Online Test Workflow

### Student Flow

1. Open `test-register.html`
2. Submit online test registration
3. Wait for offline fee verification by academy
4. After admin approval, open `test.html`
5. Log in with login name + password
6. Start the active test inside the allowed time window
7. Submit once
8. View score summary immediately

### Admin Flow

1. Open `admin.html`
2. Log in with Firebase admin password
3. In `Online Test Registrations`
- export registrations CSV
- verify payment offline
- upload approval CSV or approve manually
4. In `Test Student Access`
- reset password if needed
- activate/deactivate students
5. In `Online Test Builder`
- create draft test
- import questions by CSV if needed
- publish one test
6. In `Test Results`
- watch attempts live
- export results CSV

## Approval CSV Format

Use this format:

```csv
loginName,status,language,batchName,examName
student-login,approved,en,morning,LDC 2026
student-two,inactive,ta,evening,SI 2026
```

Meaning:
- `loginName` = student login name
- `status` = `approved` or `inactive`
- `language` = `en` or `ta`
- `batchName` = optional
- `examName` = optional

## Question CSV Format

Use this format:

```csv
question,optionA,optionB,optionC,optionD,correctOption
Sample question,Option A,Option B,Option C,Option D,A
```

Rules:
- `correctOption` must be `A`, `B`, `C`, or `D`
- each row is one MCQ

## Deployment Commands

After code changes:

```bash
git add .
git commit -m "your message"
git push
```

For normal admin content changes:
- no code edit needed
- no Git push needed

For new local images used on the public site:
- add the image to the project or host it on a public URL

## Owner Checklist

Use this final checklist:

1. Firebase Auth enabled
2. Firebase Firestore created
3. Firestore rules published
4. Admin Firebase user created
5. Netlify site created
6. Netlify environment variables added
7. `backendBaseUrl` filled if frontend is on GitHub Pages
8. GitHub or Netlify frontend deployed
9. Test registration page opens
10. Student login works after approval
