# Protected Surfaces Authenticated Visual QA

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## Purpose

This slice adds fresh current-state evidence for protected launch surfaces after the production public visual and viral release gate. It focuses on returning-user surfaces that need authenticated context: saved trips, saved journal, account profile, account billing, and owner Trip Studio.

## Local Server Recovery Note

The first `npm run qa:saved-account` attempt timed out while navigating to `/saved`. A simultaneous `/api/health` request also timed out, showing the local Next dev server was wedged rather than proving a saved/account product failure. The dev server was restarted on port `3000`, `/api/health` returned `200`, and a Supabase cleanup query found no leftover `QA Saved Account` trips or `QA Journal` notes from the failed attempt.

## Verified Commands

- `npm run qa:saved-account` passed `13/13`.
- `npm run qa:billing-recovery` passed `13/13`.
- `npm run qa:studio-owner-ui` passed `6/6`; its disposable fixture setup also ran `qa:studio-actions` at `23/23` and cleaned up.
- `QA_KEEP_FIXTURE=1 npm run qa:studio-actions` passed `23/23` and kept fixture `52fede9e-6a10-4ed7-9070-8dec8421e849`.
- `QA_TRIP_ID=52fede9e-6a10-4ed7-9070-8dec8421e849 QA_GUEST_ID=d23a1832-dd0d-464b-9d7a-9bb068b58796 npm run qa:studio-recovery` passed `6/6`.
- `QA_TRIP_ID=52fede9e-6a10-4ed7-9070-8dec8421e849 QA_GUEST_ID=d23a1832-dd0d-464b-9d7a-9bb068b58796 QA_VISUAL_AUTH_MODE=guest QA_VISUAL_ROUTES=saved-trips,saved-journal,account-profile,account-billing,trip-studio QA_VISUAL_VIEWPORTS=phone,tablet,laptop,desktop,wide QA_VISUAL_ARTIFACT_NAME=visual-baseline-2026-05-20-protected-surfaces npm run qa:visual` passed `25/25`.
- `QA_CLEANUP_TRIP_ID=52fede9e-6a10-4ed7-9070-8dec8421e849 QA_CLEANUP_RUN_ID=ebd4ce37 QA_CLEANUP_GUEST_ID=d23a1832-dd0d-464b-9d7a-9bb068b58796 npm run qa:studio-actions` cleaned up the kept fixture.

## Authenticated Visual Evidence

Visual artifact directory: `qa/visual-baseline-2026-05-20-protected-surfaces/`

The visual gate checked five protected routes across five responsive viewports:

- saved trips;
- saved journal;
- account profile;
- account billing;
- owner Trip Studio.

All `25` route/viewport combinations passed with no horizontal overflow, no app-owned small touch targets, no clipped action or heading text, no overlapping app-owned controls, no actionable Mapbox control failures, and no visible app error markers.

## Browser Spot Check

The Codex in-app Browser opened the kept guest-owned fixture through `/api/guest/start?id=d23a1832-dd0d-464b-9d7a-9bb068b58796&next=/saved`, then checked:

- `/saved`: rendered `QA Trip Studio Actions ebd4ce37 Saved`, `Trips`, and `Your itineraries` with no app error and no horizontal overflow.
- `/account?tab=billing`: rendered the correct free Explorer state with `Plan and billing`, `Free plan with generous limits`, `Start free trial`, and `Plan comparison`, with no app error and no horizontal overflow.
- `/trips/52fede9e-6a10-4ed7-9070-8dec8421e849`: rendered owner controls including `Save trip`, `Build maps`, `Share with friends`, and `Rewrite day`, with no app error and no horizontal overflow.

## Disposable Fixture Cleanup

- Run id: `ebd4ce37`
- Trip id: `52fede9e-6a10-4ed7-9070-8dec8421e849`
- Share slug: `dzpb890xy6`
- Guest id: `d23a1832-dd0d-464b-9d7a-9bb068b58796`

Cleanup deleted the disposable trip, QA places, guest profile, and guest auth user.

## Launch Readiness Impact

This closes the immediate protected-surface evidence gap called out after the full production public visual and viral pass. The broader platform-readiness goal remains active because final launch completion still needs fresh full release-candidate signoff, subscription/Stripe hosted-flow rehearsal, and final P0/P1 audit review before the whole platform can be called commercially complete.
