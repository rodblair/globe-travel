# Public Share Viral Loop

Date: 2026-05-18
Status: Passed

## What Changed

- Public share `Start your own trip` CTAs now start a guest session through `/api/guest/start`.
- The shared trip context is carried into Planner as a natural-language `q` prompt.
- `/api/guest/start` now preserves a safe prompt query while setting the guest session cookie.
- Added `npm run qa:share-viral` for Browser-backed recipient growth-loop coverage.
- Integrated `qa:share-viral` into `npm run qa:release-candidate`.

## Why This Matters

Before this pass, a logged-out recipient could click from a public trip into `/chat` without a guest session. That risked auth friction at the exact viral moment. The CTA now opens Planner as a guest with a contextual prompt such as:

`Plan a 5-day trip to Athens Greece in mid september with a shareable itinerary map for my group.`

## Verification

Standalone viral-loop gate:

```bash
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral
```

Result: `5/5` passed.

Covered:

- Phone public share recipient affordances: feedback form, feedback panel, share card, contextual start links, no horizontal overflow.
- Desktop public share recipient affordances: feedback form, feedback panel, share card, contextual start links, no horizontal overflow.
- Copy-link success feedback.
- Native-share payload includes trip-specific title/text/url.
- Logged-out recipient CTA opens guest Planner at `/chat?q=...` with a guest cookie and no overflow.

Focused release-candidate orchestration:

```bash
QA_SHARE_SLUG=x3m2c8cnws \
QA_RELEASE_ARTIFACT_NAME=release-candidate-share-viral-2026-05-18 \
QA_RELEASE_INCLUDE_VISUAL=0 \
QA_RELEASE_INCLUDE_STUDIO=0 \
QA_RELEASE_INCLUDE_SLOW_NETWORK=0 \
QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=0 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
npm run qa:release-candidate
```

Result: `14/14` passed.

In-app Browser spot check:

- Opened `http://localhost:3000/t/x3m2c8cnws`.
- Confirmed Add your reaction, Friend feedback, Share trip, Copy link, and no horizontal overflow.
- Confirmed both `Start your own trip` links point to `/api/guest/start?q=...` with the Athens shared-trip prompt.

## Evidence

- Release-candidate artifact: `qa/release-candidate-share-viral-2026-05-18/`
