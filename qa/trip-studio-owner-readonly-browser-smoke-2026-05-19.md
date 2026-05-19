# Trip Studio Owner And Read-Only Browser Smoke

Date: 2026-05-19
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:studio-owner-ui`, a Playwright/Chrome smoke test that creates a disposable guest-owned Trip Studio fixture, verifies the real browser owner UI, verifies read-only public behavior, and cleans up the fixture. The release-candidate gate now runs this check against its kept Trip Studio fixture between recovery QA and the remaining release tasks.

## Coverage

- Creates or accepts a disposable Trip Studio fixture with mapped itinerary items and a public share slug.
- Opens `/trips/[tripId]` with the owning `globe_travel_guest` cookie.
- Verifies owner controls remain visible: `Save trip`, map build/built state, `Share with friends`, `Planner chat`, `Rewrite day`, edit, swap, and delete controls.
- Verifies the owner view does not fall back to `View only` or `Shared preview`.
- Switches to Day 2 and verifies the itinerary/map context updates to the Piraeus ferry day.
- Opens `/trips/[tripId]` while logged out and verifies direct public Trip Studio access is clearly read-only.
- Opens `/t/[shareSlug]` while logged out and verifies the recipient CTA remains available without owner controls.
- Checks for app error text and horizontal overflow on the tested browser surfaces.
- Cleans up the disposable trip, QA places, guest profile, and guest auth user.

## Verified Commands

- `npm run qa:studio-owner-ui` passed `6/6`.
- `npm run qa:studio-actions` passed `23/23`.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.
- `QA_RELEASE_INCLUDE_VISUAL=0 QA_RELEASE_INCLUDE_PROMPT_SUITE=0 QA_RELEASE_INCLUDE_SHARE_FEEDBACK=0 QA_RELEASE_INCLUDE_OWNER_FEEDBACK=0 QA_RELEASE_INCLUDE_SLOW_NETWORK=0 npm run qa:release-candidate` passed `20/20`.

## Release Candidate Evidence

The release-candidate evidence is stored in `qa/release-candidate-2026-05-19/`.

- Trip Studio action smoke with kept fixture: `23/23`
- Trip Studio recovery smoke on kept fixture: `6/6`
- Trip Studio owner/read-only browser UI smoke on kept fixture: `6/6`
- Cleanup release-candidate Trip Studio fixture: passed
