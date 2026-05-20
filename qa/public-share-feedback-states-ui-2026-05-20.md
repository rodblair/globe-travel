# Public Share Feedback States UI Smoke

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-feedback-states-ui`, a local browser smoke that expands public share feedback coverage beyond one happy-path reaction. The gate creates a disposable Trip Studio fixture, opens the public share page as a logged-out recipient, validates empty and invalid states, submits several realistic feedback variants, verifies readback after desktop reload, and cleans up all disposable data.

The local release-candidate gate now runs this feedback-states browser smoke whenever share feedback QA is enabled.

## Coverage

- Creates a disposable public Trip Studio fixture with no feedback.
- Verifies the public share feedback panel starts with `0 reactions` and useful empty-state guidance.
- Verifies invalid optional email is blocked in the rendered form and disables `Send feedback`.
- Submits a `Love it` reaction.
- Submits a `Curious` reaction.
- Submits a `Practical note` reaction with a duplicate author name and a 540-character comment.
- Verifies each submitted reaction clears the textarea, appears in the public feedback API, and keeps the page free of app errors and horizontal overflow.
- Reloads the public share on desktop and verifies `3 reactions`, all sentiment buckets, duplicate-name feedback, and the long comment remain visible.
- Deletes the three inserted feedback rows.
- Deletes the disposable trip, QA places, guest profile, and guest auth user.

## Verified Commands

- `npm run qa:share-feedback-states-ui` passed `12/12`.
- `node --check scripts/platform-share-feedback-states-ui-smoke.mjs` passed.
- `git diff --check` passed.
- `npm run qa:auth-access` passed `15/15` after auth-next hydration and cleanup hardening.
- `npm run lint` passed.
- `npm run build` passed.
- `QA_RELEASE_INCLUDE_VISUAL=0 QA_RELEASE_INCLUDE_PROMPT_SUITE=0 QA_RELEASE_INCLUDE_SLOW_NETWORK=0 QA_RELEASE_ARTIFACT_NAME=release-candidate-share-feedback-states-2026-05-20 npm run qa:release-candidate` passed `25/25`.

## Smoke Details

Latest run:

- Trip id: `bd04da60-6014-45dc-a2ab-6672c423e428`
- Share slug: `dlthp4xgvo`
- Guest id: `bdc29f38-ffe6-4fab-8efc-c31124358e33`
- Feedback rows created and deleted:
  - `0c255662-d759-4270-9b76-e9a21c48fe81`
  - `7f5c8a2a-edec-4370-bd98-c47270cc6597`
  - `12c84b5f-3380-4f36-aed8-1f57e5c98988`

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

This closes part of the Month 4 share-loop gap: recipient feedback states are now Browser-tested across empty, invalid, multiple-sentiment, duplicate-author, long-comment, phone, and desktop reload conditions. Remaining Month 4 work is to expand this across multiple stable public itinerary shapes and add social-card image assertions beyond basic render status.
