# Public Share Multi-Itinerary UI Smoke

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-multi-itinerary-ui`, a self-contained local browser smoke for the Month 4 public-share growth loop. The gate creates a disposable owner, generates the ten existing public share fixture trips, API-smokes the whole fixture set, Browser-tests three different itinerary shapes as logged-out recipients, submits feedback on each, verifies desktop reload/readback, checks share affordances, opens the owner Trip Studio across phone/tablet/desktop, runs feedback-driven refresh on each tested trip, and cleans up all generated data.

## Coverage

- Creates a disposable QA share owner.
- Creates ten public share fixtures:
  - Lisbon
  - Porto
  - Mexico City
  - Tokyo
  - Rome
  - Barcelona
  - London
  - Paris
  - Copenhagen
  - Berlin
- Runs public share API/social-card smoke across all ten fixture slugs.
- Decodes all ten social-card PNGs and verifies exact `1200x630` dimensions, nonblank/branded pixel content, visible dark/brass visual elements, and unique hashes/byte lengths across trip shapes.
- Opens Lisbon, Porto, and Mexico City public share pages on a 390px phone viewport.
- Verifies each tested page shows the trip title, day count, day-by-day itinerary, feedback form, share card, and `Start your own trip` links without app errors or horizontal overflow.
- Submits one feedback reaction per tested itinerary:
  - Lisbon: `Love it`
  - Porto: `Curious`
  - Mexico City: `Practical note`
- Verifies feedback API readback for each inserted reaction.
- Reloads each tested itinerary on a 1280px desktop viewport and verifies feedback remains visible.
- Checks desktop copy-link success feedback.
- Checks native share payload is trip-specific and uses the expected public share URL.
- Opens owner Trip Studio for Lisbon on phone, Porto on tablet, and Mexico City on desktop with the disposable owner session.
- Verifies each owner view shows the submitted friend reaction, `crew reacting` readiness copy, `Share invite`, no `View only` state, no app errors, and no horizontal overflow.
- Runs `Refresh plan from feedback` on each tested owner trip and verifies the visible workflow result reaches `"status": "ready"`.
- Deletes all inserted feedback rows.
- Deletes all ten disposable trips and 62 QA places.
- Deletes the disposable owner profile and auth user.

## Verified Commands

- `npm run qa:share-multi-itinerary-ui` passed `37/37`.
- `node --check scripts/platform-share-multi-itinerary-ui-smoke.mjs` passed.
- `git diff --check` passed.

## Latest Run

- Run id: `998689c4`
- Fixture count: `10`
- Browser-tested fixture keys: `lisbon`, `porto`, `mexico-city`
- Share slugs:
  - `qa998689c41`
  - `qa998689c42`
  - `qa998689c43`
  - `qa998689c44`
  - `qa998689c45`
  - `qa998689c46`
  - `qa998689c47`
  - `qa998689c48`
  - `qa998689c49`
  - `qa998689c410`
- Feedback rows created and deleted:
  - `611ec309-2cc2-4291-978e-dd6ba8a6b81c`
  - `594f906f-579b-447f-99f9-ccd62b9fafa0`
  - `5302b530-5e4c-4ef3-8c4b-35a4431c8b15`
- Fixture cleanup: `10` trips and `62` places deleted.
- Owner cleanup: disposable owner profile and auth user deleted.

## Owner Feedback Refresh Assertions

All three Browser-tested itinerary shapes passed the owner loop:

- Lisbon: phone viewport `390x844`, owner readback passed, feedback refresh reached `"status": "ready"`.
- Porto: tablet viewport `768x1024`, owner readback passed, feedback refresh reached `"status": "ready"`.
- Mexico City: desktop viewport `1280x900`, owner readback passed, feedback refresh reached `"status": "ready"`.
- Each owner view preserved edit-mode affordances, avoided `View only`, showed `Share invite`, had no app errors, and had no horizontal overflow.

## In-App Browser Spot Check

After the automated gate, Codex Browser opened a separate disposable owner fixture to inspect the real visible Trip Studio surface:

- Fixture run id: `d50a6bb4`
- Trip id: `dc3c3605-5519-4f4b-9eb5-b8485bec4370`
- Share slug: `odffaljwfu`
- Guest owner id: `f280d632-2bae-46a4-8b5c-5dd90402b638`
- Kept feedback id: `76c7e5b4-1251-4732-96a1-7433856e799f`
- Browser verified the owner Studio showed `Friend feedback`, `crew reacting`, `Share invite`, the submitted practical note, no `View only`, no app error, and no horizontal overflow.
- Browser clicked `Refresh plan from feedback`; the visible workflow result showed `Feedback Refresh`, `COMPLETED`, and `"status": "ready"`.
- Browser screenshot capture timed out, so this spot check is DOM-visible state evidence rather than screenshot evidence.
- Cleanup deleted the feedback row, disposable trip, QA places, guest profile, and guest auth user.

## Social-Card Image Assertions

All ten fixture cards passed:

- Response status: `200`
- Content type: `image/png`
- Dimensions: `1200x630`
- Byte length threshold: greater than `40000`
- Unique color buckets threshold: at least `30`
- Non-paper pixel ratio threshold: at least `0.04`
- Dark text/line pixel ratio threshold: at least `0.015`
- Brass accent pixel ratio threshold: at least `0.003`
- Unique SHA-256 hashes: `10/10`
- Unique byte lengths: `10/10`

## Release Impact

This closes the first multi-itinerary public-share browser loop, the first multi-card social preview content gate, and the first multi-itinerary owner feedback refresh loop. The product is no longer only tested against one stable Athens public share, and owner-side feedback planning is no longer only tested on one fixture. Remaining Month 4 expansion work is deeper mixed-feedback, failure/retry, and owner hierarchy polish.
