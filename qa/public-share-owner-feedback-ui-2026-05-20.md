# Public Share Owner Feedback UI Smoke

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-owner-feedback-ui`, a local browser smoke that proves the full feedback loop from logged-out public share recipients back to the Trip Studio owner surface.

The gate can create its own disposable Trip Studio fixture or reuse the release-candidate fixture. It seeds mixed feedback, submits one reaction through the rendered public share UI, keeps the inserted reactions long enough for owner readback, opens Trip Studio with the owning guest cookie, verifies the feedback hierarchy is useful to the organizer, forces one workflow failure, retries `Refresh plan from feedback`, then deletes the inserted feedback and any disposable fixture it created.

The local release-candidate gate now runs this owner-side browser smoke after the API owner feedback readback check whenever owner feedback QA is enabled.

## Coverage

- Creates or accepts a disposable guest-owned Trip Studio fixture with a public share slug.
- Seeds mixed `Love it`, `Curious`, and `Practical note` feedback for organizer review.
- Opens the public share page as a logged-out friend and submits a practical note through the rendered feedback form.
- Keeps inserted reactions for caller cleanup when `QA_KEEP_FEEDBACK=1`.
- Opens `/trips/[tripId]` with the owning `globe_travel_guest` cookie.
- Verifies the submitted author and comment are visible in Trip Studio.
- Verifies owner-side sentiment counts, mixed feedback cards, long-name wrapping, and `Showing latest 4 of 5 reviews` overflow copy.
- Verifies owner-side feedback readiness copy is present and the `Refresh plan from feedback` action is enabled.
- Forces a one-time planner workflow failure and verifies clear recovery copy plus an enabled retry.
- Retries the feedback refresh workflow and verifies the visible workflow output reaches `"status": "ready"`.
- Checks for app error text and horizontal overflow on the owner surface.
- Deletes the inserted feedback rows and cleans up disposable fixtures.

## Verified Commands

- `npm run qa:share-owner-feedback-ui` passed `11/11`.
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

The Codex in-app Browser then opened disposable owner fixture `159a4343-91e3-4b03-9b20-158256549647` through guest start URL `/api/guest/start?id=5e2cf993-2703-4c6d-9b12-8b362b3794ec&next=/trips/159a4343-91e3-4b03-9b20-158256549647?qaWorkflowFailure=once`. Browser verified `5 reviews`, `Love`, `Curious`, `Notes`, the visible latest-four owner feedback cards, `Showing latest 4 of 5 reviews`, `crew reacting`, and an enabled `Refresh plan from feedback` button with no app error text and no horizontal overflow. Browser clicked refresh once and verified `Could not start that trip option. Please try again.`, then clicked retry and verified the workflow output reached `"status": "ready"`. Fixture cleanup deleted all five feedback rows, the disposable trip, QA places, guest profile, and guest auth user.

## Latest Focused Run

- Run id: `50bece86`
- Trip id: `c297ce2f-290b-47b0-9a22-cbec41845298`
- Share slug: `e5zez6cdba`
- Guest owner id: `b10c9365-ecb2-46e9-a5c8-9ea33e721323`
- Feedback rows created and deleted:
  - `ce28c32e-5ed4-4b99-9689-53326f4b1e7a`
  - `f2e1e9be-3571-4a86-9236-443de9ad72b8`
  - `c1ebc6e2-72be-46ce-b230-d58f9bf83292`
  - `1f868e63-5a68-495a-81b4-fabbc4fb428f`
  - `4491a980-f85c-45a7-a604-e75ac3f8dc27`

The focused run verified owner mixed-feedback hierarchy, visible workflow failure recovery, retry to ready-state feedback refresh, feedback cleanup, and disposable fixture cleanup.

## Latest In-App Browser Spot Check

- Run id: `52bcf9d5`
- Trip id: `159a4343-91e3-4b03-9b20-158256549647`
- Share slug: `icpvolothw`
- Guest owner id: `5e2cf993-2703-4c6d-9b12-8b362b3794ec`
- Feedback rows created and deleted:
  - `2f602050-de08-479c-93cc-814432733d1d`
  - `ca684fa4-4e78-43e9-a3fb-2f4d5dd8c023`
  - `d226912f-f08d-4c58-b59f-34c1e8b02e96`
  - `0c99f9bc-4a5d-4963-b2f7-215dc3c21ec3`
  - `349280fd-c1c1-4f2d-b3a2-c3a0eec60b54`

Browser evidence matched the automated gate: mixed owner feedback hierarchy, overflow summary, recoverable failure copy, retry to ready workflow output, no app error, no horizontal overflow, and full disposable cleanup.
