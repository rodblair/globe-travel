# Trip Studio Month 3 Owner Visual QA

Date: 2026-05-19
Surface: Trip Studio owner workspace
Route: `/trips/992a422e-6104-4b5a-b459-10333f672c17`
Disposable guest owner: `aed5d59f-1fa6-4e58-a3c9-afa9b2559ef9`
Disposable share slug: `3ox3c6nqch`
Run id: `e97e2872`

## Purpose

Start Month 3 Trip Studio completion work by testing a real owned itinerary fixture across API actions, Browser-visible read-only state, recovery states, and responsive visual QA.

## Browser Findings

- Browser opened the disposable Trip Studio route on localhost.
- The visible page had no console errors.
- Direct/public access without a retained owner cookie rendered as read-only with `View only`, `Shared preview`, and `View share`, which keeps public preview state distinct from owner edit mode.
- Browser inspection surfaced two visual issues that the numeric visual gate did not catch:
  - A decorative `Map readiness` card peeked behind the command header on laptop/desktop widths.
  - The itinerary panel `Move` drag chip overlapped the `Rewrite day` action.

## Fixes

- The background `Map readiness` card now appears only on `2xl` layouts where there is enough horizontal room.
- The itinerary panel drag chip was removed from the visible launch surface so it no longer competes with itinerary actions.

## Automated Evidence

`QA_KEEP_FIXTURE=1 npm run qa:studio-actions`

- Result: passed `23/23`.
- Verified disposable owner trip creation, mapped editable trip API, title update persistence, swap options, apply swap persistence, map build, reorder, move, delete, optimize, save, public share, and share API readback.

`QA_TRIP_ID=992a422e-6104-4b5a-b459-10333f672c17 QA_GUEST_ID=aed5d59f-1fa6-4e58-a3c9-afa9b2559ef9 npm run qa:studio-recovery`

- Result: passed `6/6`.
- Verified Trip Studio recovery behavior against the kept fixture.

`QA_TRIP_ID=992a422e-6104-4b5a-b459-10333f672c17 QA_GUEST_ID=aed5d59f-1fa6-4e58-a3c9-afa9b2559ef9 QA_VISUAL_AUTH_MODE=guest QA_VISUAL_ROUTES=trip-studio QA_VISUAL_VIEWPORTS=phone,tablet,laptop,desktop,wide QA_VISUAL_ARTIFACT_NAME=visual-baseline-2026-05-19-trip-studio-month3-owner npm run qa:visual`

- Result: passed `5/5`.
- Artifact: `qa/visual-baseline-2026-05-19-trip-studio-month3-owner/`.
- Covered phone `390x844`, tablet `768x1024`, laptop `1280x800`, desktop `1440x950`, and wide `1728x1050`.
- No horizontal overflow, clipped text, small app targets, small map controls, or app-owned target overlaps were reported.

Cleanup:

`QA_CLEANUP_TRIP_ID=992a422e-6104-4b5a-b459-10333f672c17 QA_CLEANUP_RUN_ID=e97e2872 QA_CLEANUP_GUEST_ID=aed5d59f-1fa6-4e58-a3c9-afa9b2559ef9 npm run qa:studio-actions`

- Result: cleanup passed.
- Deleted disposable trip, QA places, guest profile, and guest auth user.

## Remaining Month 3 Work

- Expand Browser owner testing around visible edit controls, swap menus, save/share notices, and mobile chat panel behavior with a cookie-stable authenticated context.
- Add visual or functional regression coverage if another repeated Trip Studio collision appears.
