# Public Share Feedback States UI Smoke

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-feedback-states-ui`, a local browser smoke that expands public share feedback coverage beyond one happy-path reaction. The gate creates a disposable Trip Studio fixture, opens the public share page as a logged-out recipient, validates empty and invalid states, forces a recoverable one-time submit failure, submits seven realistic feedback variants, verifies readback and overflow handling after desktop reload, and cleans up all disposable data.

The local release-candidate gate now runs this feedback-states browser smoke whenever share feedback QA is enabled.

## Coverage

- Creates a disposable public Trip Studio fixture with no feedback.
- Verifies the public share feedback panel starts with `0 reactions` and useful empty-state guidance.
- Verifies invalid optional email is blocked in the rendered form and disables `Send feedback`.
- Forces a one-time feedback submission failure and verifies the failure copy, preserved comment, enabled retry state, and no overflow.
- Retries the same `Love it` reaction successfully.
- Submits seven total reactions across `Love it`, `Curious`, and `Practical note`.
- Covers duplicate author names, a long author name, and a 540-character practical note.
- Verifies each submitted reaction clears the textarea, appears in the public feedback API, and keeps the page free of app errors and horizontal overflow.
- Reloads the public share on desktop and verifies `7 reactions`, all sentiment buckets, the latest four visible feedback cards, a clear `Showing latest 4 of 7 reactions` overflow summary, and hidden older comments absent from the compact panel.
- Deletes the seven inserted feedback rows.
- Deletes the disposable trip, QA places, guest profile, and guest auth user.

## Verified Commands

- `npm run qa:share-feedback-states-ui` passed `21/21`.
- `node --check scripts/platform-share-feedback-states-ui-smoke.mjs` passed.
- `npm run qa:share-recovery` passed `4/4`.
- `git diff --check` passed.
- `npm run qa:auth-access` passed `15/15` after auth-next hydration and cleanup hardening.
- `npm run lint` passed.
- `npm run build` passed.
- `QA_RELEASE_INCLUDE_VISUAL=0 QA_RELEASE_INCLUDE_PROMPT_SUITE=0 QA_RELEASE_INCLUDE_SLOW_NETWORK=0 QA_RELEASE_ARTIFACT_NAME=release-candidate-share-feedback-states-2026-05-20 npm run qa:release-candidate` passed `25/25`.

## Smoke Details

Latest run:

- Trip id: `6038f13e-b015-4506-9a8a-82f9f1951ab1`
- Share slug: `oslk2482lz`
- Guest id: `1894463b-46be-4fbe-8585-e347a676d877`
- Feedback rows created and deleted:
  - `c325da14-f987-45c4-8b2b-16a9103badf1`
  - `c381151c-512e-4ea6-9a4a-426fb6d8cc16`
  - `010c9d67-572a-4acf-8831-64cfa997bf1a`
  - `6aab6ab1-b964-45d6-aa0a-60a59679b7a1`
  - `63c8a68e-ad96-41ee-b581-3901da2ae9b3`
  - `36923734-b4b7-438b-884d-fda30bee374d`
  - `560a1fa0-3181-49df-a7da-9f82ae8a07ed`

## In-App Browser Spot Check

Codex Browser also opened a separate disposable public-share fixture seeded with five feedback rows:

- Fixture run id: `2b931f3e`
- Trip id: `8760e7fa-bf2d-4db1-a85e-031081574e31`
- Share slug: `fyi2x9ensc`
- Guest id: `81d362c3-959e-4ff9-b1f6-5d02d9b62091`
- Browser verified the public page showed the trip title, `5 reactions`, the latest feedback row, `Showing latest 4 of 5 reactions`, no oldest-comment leak in the compact panel, `Start your own trip`, no app error, and no horizontal overflow.
- Browser screenshot capture timed out, so this spot check is DOM-visible state evidence rather than screenshot evidence.
- Cleanup deleted all five seeded feedback rows, the disposable trip, QA places, guest profile, and guest auth user.

Release-candidate run:

- Artifact: `qa/release-candidate-share-feedback-states-2026-05-20/`
- Checked tasks: `25`
- Passed tasks: `25`
- Failed tasks: `0`
- Public share feedback states browser smoke: `12/12`
- Auth and guest access smoke: `15/15`
- Trip Studio owner feedback browser UI smoke: `6/6`
- Stripe test-mode readiness: `11/11`
- Cleanup release-candidate Trip Studio fixture: passed

## Related Hardening

- Auth links now refresh their current search state on mount so guest and signup actions preserve protected `next` destinations after hydration.
- `npm run qa:auth-access` now waits for the hydrated protected-planner guest link before asserting it, retries local navigation to reduce unrelated Chromium navigation stalls, accepts already-absent guest auth users during cleanup, and accepts direct Trip Studio arrival when the protected planner prompt is preserved.

## Release Impact

This closes the Month 4 recipient feedback-state gap for empty, invalid, failure/retry, many-reaction, overflow-summary, multiple-sentiment, duplicate-author, long-author, long-comment, phone, and desktop reload conditions. Remaining Month 4 work is deeper owner-side mixed-feedback hierarchy and retry handling inside the organizer workflow.
