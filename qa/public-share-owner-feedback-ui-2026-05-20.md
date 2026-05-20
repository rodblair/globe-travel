# Public Share Owner Feedback UI Smoke

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-owner-feedback-ui`, a local browser smoke that proves the full feedback loop from a logged-out public share recipient back to the Trip Studio owner surface.

The gate can create its own disposable Trip Studio fixture or reuse the release-candidate fixture. It submits feedback through the rendered public share UI, keeps the inserted reaction long enough for owner readback, opens Trip Studio with the owning guest cookie, verifies the feedback is visible to the organizer, triggers `Refresh plan from feedback`, then deletes the inserted feedback and any disposable fixture it created.

The local release-candidate gate now runs this owner-side browser smoke after the API owner feedback readback check whenever owner feedback QA is enabled.

## Coverage

- Creates or accepts a disposable guest-owned Trip Studio fixture with a public share slug.
- Opens the public share page as a logged-out friend and submits a practical note through the rendered feedback form.
- Keeps the inserted reaction for caller cleanup when `QA_KEEP_FEEDBACK=1`.
- Opens `/trips/[tripId]` with the owning `globe_travel_guest` cookie.
- Verifies the submitted author and comment are visible in Trip Studio.
- Verifies owner-side feedback readiness copy is present and the `Refresh plan from feedback` action is enabled.
- Runs the feedback refresh workflow and verifies the visible workflow output reaches `"status": "ready"`.
- Checks for app error text and horizontal overflow on the owner surface.
- Deletes the inserted feedback row and cleans up disposable fixtures.

## Verified Commands

- `npm run qa:share-owner-feedback-ui` passed `6/6`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recipient-ui` passed `5/5`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback` passed `5/5`.
- `node --check scripts/platform-share-owner-feedback-ui-smoke.mjs` passed.
- `node --check scripts/platform-share-recipient-ui-smoke.mjs` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Release Candidate Evidence

The focused release-candidate evidence is stored in `qa/release-candidate-owner-feedback-ui-2026-05-19/`.

- Checked tasks: `24`
- Passed tasks: `24`
- Failed tasks: `0`
- Public share recipient browser feedback smoke: `5/5`
- Trip Studio owner feedback readback smoke: `6/6`
- Trip Studio owner feedback browser UI smoke: `6/6`
- Stripe test-mode readiness: `11/11`
- Cleanup release-candidate Trip Studio fixture: passed

## In-App Browser Sanity Check

The Codex in-app Browser opened `http://localhost:3000/trips/15591fa6-01d1-4412-a54c-c08f7279d0de` on localhost and verified the Trip Studio route rendered without app error text or horizontal overflow. Screenshot capture timed out in the in-app Browser runtime, so durable visual evidence for this slice remains the existing Chrome visual QA artifacts and release-candidate report.
