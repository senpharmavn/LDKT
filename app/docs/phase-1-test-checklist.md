# Phase 1 Test Checklist

Use this checklist before sharing a build with learners.

## Local App

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Local URL opens: `http://127.0.0.1:3000?token=demo-token`.
- [ ] Bottom navigation works: Home, Workshop, Challenge, Learning, Profile.
- [ ] Sync strip shows Google Sheet synced when Apps Script is reachable.
- [ ] Refresh button reloads dashboard data without browser refresh.

## Google Sheet

- [ ] Sheet names exist exactly:
  - `Users`
  - `Workshops`
  - `Mini_Challenges`
  - `Checkins`
  - `Evaluations`
- [ ] `Users.Token` contains `demo-token` for test user.
- [ ] Vietnamese text displays correctly in Google Sheet.
- [ ] `Checkins` headers match `docs/sheet-templates/Checkins.csv`.
- [ ] `Evaluations` headers match `docs/sheet-templates/Evaluations.csv`.

## Apps Script

- [ ] `CONFIG.SPREADSHEET_ID` is the Google Sheet ID, not the Apps Script URL.
- [ ] Web App deployment access is available to anyone with the link.
- [ ] `GET ?action=getDashboard&token=demo-token` returns `{ "ok": true }`.
- [ ] `saveCheckin` creates a row the first time.
- [ ] `saveCheckin` updates the same row when sent again for the same `UserID + ChallengeID`.
- [ ] `saveEvaluation` updates the same row when sent again for the same `UserID + WorkshopID`.

## Learner Flow

- [ ] Home shows the learner name from Google Sheet.
- [ ] Home shows the current mini challenge from `Mini_Challenges`.
- [ ] Check-in cannot submit when both reflection fields are empty.
- [ ] Check-in submit writes to Google Sheet and returns to Home.
- [ ] Evaluation cannot submit when feedback is empty.
- [ ] Evaluation submit writes to Google Sheet and returns to Home.
- [ ] Home task cards navigate to the correct screens.
- [ ] Learning screen opens and shows resource placeholders.
- [ ] Challenge list marks completed days based on `Checkins`.

## Not In Phase 1

- [ ] Email notification is intentionally not active.
- [ ] Push notification is intentionally not active.
- [ ] Leaderboard, streak, XP, and badges are intentionally deferred.
