# Authenticated Visual QA

Date: 2026-05-18
Surface: protected visual QA for saved, account, and Trip Studio owner surfaces

## Scope

This pass closes the previous visual-QA follow-up for authenticated or preview-like fixtures.

`npm run qa:visual` can now run with guest session cookies for protected routes:

```bash
QA_VISUAL_AUTH_MODE=guest QA_GUEST_ID=<owner-guest-id> QA_TRIP_ID=<trip-id> npm run qa:visual
```

When `QA_VISUAL_AUTH_MODE=auto` and the base URL is local, protected-route visual sweeps automatically receive a generated guest cookie. Generated guest accounts are cleaned up after the run when service-role credentials are available. Externally provided guest IDs are left for the caller to clean up, which keeps release-candidate fixture ownership intact until the final fixture cleanup step.

## Automated Evidence

Generated guest protected-surface sweep:

```bash
QA_VISUAL_ARTIFACT_NAME=visual-authenticated-guest-2026-05-18 \
QA_VISUAL_ROUTES=saved-trips,saved-journal,account-profile,account-billing \
QA_VISUAL_VIEWPORTS=phone,laptop \
QA_VISUAL_SETTLE_MS=1200 \
npm run qa:visual
```

Result: passed `8/8`.

Verified:

- Protected saved/account routes used guest visual auth.
- Phone and laptop screenshots were captured.
- No horizontal overflow, app errors, app-owned small targets, or actionable small map controls were found.
- Generated guest cleanup deleted the disposable profile and auth user.

Owner fixture visual sweep:

```bash
QA_KEEP_FIXTURE=1 node scripts/platform-trip-studio-actions.mjs
QA_TRIP_ID=<fixture-trip-id> QA_SHARE_SLUG=<fixture-share-slug> QA_GUEST_ID=<fixture-guest-id> \
QA_VISUAL_AUTH_MODE=guest \
QA_VISUAL_ARTIFACT_NAME=visual-authenticated-owner-fixture-2026-05-18 \
QA_VISUAL_ROUTES=saved-trips,account-billing,trip-studio \
QA_VISUAL_VIEWPORTS=phone,laptop \
QA_VISUAL_SETTLE_MS=1600 \
npm run qa:visual
QA_CLEANUP_TRIP_ID=<fixture-trip-id> QA_CLEANUP_RUN_ID=<run-id> QA_CLEANUP_GUEST_ID=<fixture-guest-id> \
node scripts/platform-trip-studio-actions.mjs
```

Result: visual QA passed `6/6`; cleanup passed.

Verified:

- The visual runner set the provided guest cookie in both phone and laptop contexts.
- Saved trips, account billing, and Trip Studio rendered as protected owner surfaces.
- Trip Studio owner visual QA used the same guest ID as the disposable fixture.
- Fixture cleanup removed the trip, QA places, guest profile, and guest auth user.

Focused release-candidate orchestration:

```bash
QA_RELEASE_ARTIFACT_NAME=release-candidate-authenticated-visual-2026-05-18 \
QA_VISUAL_ROUTES=saved-trips,account-billing,trip-studio \
QA_VISUAL_VIEWPORTS=phone,laptop \
QA_VISUAL_SETTLE_MS=1600 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
npm run qa:release-candidate
```

Result: passed `18/18`; responsive visual QA passed `6/6`.

The release-candidate runner now passes the kept Trip Studio fixture `guestId` into `qa:visual`, so authenticated owner visual QA no longer depends on localhost dev-auth fallback.

## Artifacts

- `qa/visual-authenticated-guest-2026-05-18/README.md`
- `qa/visual-authenticated-guest-2026-05-18/summary.json`
- `qa/visual-authenticated-owner-fixture-2026-05-18/README.md`
- `qa/visual-authenticated-owner-fixture-2026-05-18/summary.json`
- `qa/release-candidate-authenticated-visual-2026-05-18/README.md`
- `qa/release-candidate-authenticated-visual-2026-05-18/summary.json`

## Release Impact

This makes protected visual QA repeatable for local release candidates and preview-style disposable fixtures. It also reduces database clutter from QA runs by cleaning up disposable guest accounts alongside fixture trips and places.
