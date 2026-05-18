# Saved And Account Returning-User Smoke

Date: 2026-05-18
Status: Passed

## What Changed

- Added `npm run qa:saved-account`.
- Integrated `qa:saved-account` into `npm run qa:release-candidate`.
- Updated journal and profile API routes to use the same guest-aware user helper as trip routes.
- Updated account profile saving to use `/api/profile`, so profile edits flow through the same authenticated/guest-aware API contract.

## Why This Matters

Saved/account had visual and auth checks, but not enough proof that a returning user can actually find work, reopen it, manage trip notes, and keep account/profile state from dead-ending. This gate creates disposable saved/account data, checks it in the UI, and cleans it up.

## Verification

Standalone saved/account gate:

```bash
npm run qa:saved-account
```

Result: `10/10` passed.

Covered:

- Disposable guest saved trip creation.
- Saved trips API readback.
- Guest trip-note creation.
- Guest trip-note edit.
- Journal API readback tied to the saved trip.
- Guest profile API update.
- Phone-width saved trips UI shows the disposable trip without overflow.
- Phone-width saved journal UI shows the edited note and linked trip without overflow.
- Phone-width account profile UI renders without overflow or app errors.
- Saved trip card exposes a `/trips/{id}` reopen link.
- Cleanup deleted the disposable trip, journal entry, profile, and user.

Focused release-candidate orchestration:

```bash
QA_SHARE_SLUG=x3m2c8cnws \
QA_RELEASE_ARTIFACT_NAME=release-candidate-saved-account-2026-05-18 \
QA_RELEASE_INCLUDE_VISUAL=0 \
QA_RELEASE_INCLUDE_STUDIO=0 \
QA_RELEASE_INCLUDE_SLOW_NETWORK=0 \
QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=0 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
npm run qa:release-candidate
```

Result: `15/15` passed, including `saved and account smoke` at `10/10`.

In-app Browser spot check:

- `/saved`: Trips marker present, no horizontal overflow, no visible runtime errors.
- `/saved?tab=journal`: Trip notes content present after hydration, no horizontal overflow.
- `/account`: Account and Sharing profile markers present, no horizontal overflow, no visible runtime errors.

## Evidence

- Release-candidate artifact: `qa/release-candidate-saved-account-2026-05-18/`
