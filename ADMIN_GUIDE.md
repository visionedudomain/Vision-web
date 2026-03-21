# Vision Education Academy - Admin Guide

## What You Can Manage

From `admin.html`, the admin can now manage:
- website information
- current announcement
- news updates
- Instagram posts
- academy application submissions
- online test registrations
- approved online test students
- online tests
- test results

Normal admin work does not require:
- coding
- editing JSON
- Git commands
- GitHub push

## Daily Website Update Steps

1. Open the admin page.
2. Enter the admin password.
3. Update:
- hero text
- contact details
- marquee image links
- news
- Instagram posts
4. Click save or add.

Changes become visible automatically.

## Academy Application Submissions

In `Application Submissions`, admin can:
- view submitted applications
- export them as CSV
- clear them after export if needed

Recommended flow:
1. export CSV
2. save the file safely
3. clear submissions if you want a fresh list

## Online Test Registration Workflow

### Step 1. Students register

Students use `test-register.html` and submit:
- student name
- login name
- password
- mobile number
- language
- batch
- exam/course

This creates a pending test registration.

### Step 2. Export pending registrations

In `Online Test Registrations`:
- click `Export Registrations CSV`

Use that file to verify offline payment and approval outside the website.

### Step 3. Approve students

There are 2 ways.

#### Option A: Approve manually

1. choose the registration
2. check login name / language / batch / exam
3. click `Approve Student`

#### Option B: Bulk approve by CSV

1. click `Download Approval CSV Template`
2. fill the CSV
3. upload the CSV using `Upload Approval CSV`

CSV format:

```csv
loginName,status,language,batchName,examName
student-login,approved,en,morning,LDC 2026
student-two,inactive,ta,evening,SI 2026
```

Allowed status values:
- `approved`
- `inactive`

## Test Student Access

In `Test Student Access`, admin can:
- see approved students
- reset a student password
- activate or deactivate a student

Use this when:
- a student forgot the password
- a student should be blocked temporarily

## Online Test Builder

In `Online Test Builder`, admin can:
- create a new test
- import questions by CSV
- save draft
- publish one active test
- close a test
- delete a draft

### Question CSV format

```csv
question,optionA,optionB,optionC,optionD,correctOption
Sample question,Option A,Option B,Option C,Option D,A
```

Rules:
- one row = one question
- correct option must be `A`, `B`, `C`, or `D`

## Test Results

In `Test Results`, admin can:
- view submitted attempts live
- export results CSV

The result export contains:
- student name
- login name
- test title
- language
- started time
- submitted time
- score
- correct count
- answered count
- total questions
- attempt status

## Important Notes

- Payment is handled outside the website.
- Only approved students can log in to the test portal.
- A student gets only one attempt per published test.
- The timer starts only after the student clicks `Start Test`.
- If time ends, the test is auto-submitted.

## If Admin Login Fails

Ask the website owner to check:
- Firebase config in `assets/js/firebase-config.js`
- admin email in Firebase Authentication
- Firestore rules

## If Online Test Registration Fails

Ask the website owner to check:
- Netlify backend deployment
- `backendBaseUrl` in `assets/js/firebase-config.js`
- Netlify environment variables

## If Changes Do Not Appear

1. wait a few seconds
2. refresh once
3. if needed, use `Ctrl + F5`

## For the Website Owner

One-time technical setup is documented in `README.md`.
