# Planner Map Trust: Title And Duplicate Stop Contract

Date: 2026-05-18
Surface: planner actuals, public share maps, production Athens five-day reference
Goal slice: Week 2 planner/map-trust expansion

## Purpose

Tighten the generated-itinerary trust contract so public/share actuals prove more than "some map exists." The prompt-suite actuals check now verifies:

- The trip title contains the expected destination.
- Day indexes are sequential and match the expected trip length.
- Every itinerary item has a mapped place.
- Every day stays in the expected country.
- Every day has at least one usable route.
- No day maps multiple different itinerary items to the same rounded coordinate.
- Route distances are exported for review.

## Finding

The new duplicate-stop check immediately found a real production Athens issue on stable share slug `x3m2c8cnws`.

Failing production actual before repair:

- Day 2 mapped `Acropolis archaeological site` and `Dinner at Strofi` to the same generic `Athina` place.
- Day 5 mapped `Monastiraki Square & flea market` and `Ancient Agora exterior stroll` to the same generic `Athina` place.

This was a P1 map-trust issue: the public itinerary looked complete, but the map did not truthfully distinguish important itinerary stops.

## Fix

Code guardrails:

- Added canonical Athens place overrides to planner place resolution in `client/app/api/chat/route.ts` for Acropolis, Acropolis Museum, Strofi, Monastiraki Square, and Ancient Agora.
- Added the missing Athens canonical patterns to the map hydration repair endpoint in `client/app/api/trips/[id]/hydrate-map/route.ts`.
- Expanded `client/scripts/planner-share-actuals.mjs` to export unique stop counts, duplicate mapped stops, and route distances.
- Expanded `client/scripts/planner-prompt-suite.mjs` to fail generated actuals with destination-title mismatch, non-sequential day indexes, or duplicate mapped stops.

Production data repair:

- Repaired the stable Athens public itinerary by replacing four stale generic `Athina` pins with specific places:
  - `Acropolis of Athens`
  - `Strofi`
  - `Monastiraki Square`
  - `Ancient Agora of Athens`
- Recomputed walking routes for affected Days 2 and 5.

## Verification

Commands run from `client/` unless noted:

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-expanded-2026-05-18-actuals.json npm run qa:prompt-suite
```

Result: passed `52/52`, `actualsChecked: 10`.

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_PROMPT_SUITE_SHARE_MAP=athens-5-day-couples-rest=x3m2c8cnws \
QA_PROMPT_SUITE_ACTUALS_OUT=../qa/planner-map-trust-title-duplicate-actuals-2026-05-18.json \
npm run qa:prompt-actuals
```

Result: exported `1` production actual.

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-title-duplicate-actuals-2026-05-18.json npm run qa:prompt-suite
```

Result: passed `52/52`, `actualsChecked: 1`.

```bash
npm run qa:prompt-suite
npm run lint
npm run build
git diff --check
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production
```

Results:

- Static prompt suite passed `52/52`.
- Lint passed.
- Build passed.
- Whitespace check passed.
- Production release gate passed `7/7`, including production prompt actuals and prompt suite with production actuals.

## Browser Verification

In-app Browser opened:

```text
https://globe-travel-two.vercel.app/t/x3m2c8cnws
```

Browser result:

- Page title: `5 Days in Athens Greece in mid september | Globe.travel`
- Horizontal overflow: `0`
- Rendered itinerary includes Day 5 content.
- Rendered specific repaired stop names:
  - `Acropolis of Athens`
  - `Strofi`
  - `Monastiraki Square`
  - `Ancient Agora of Athens`
- Map elements remained present.

## Current Actual Snapshot

`qa/planner-map-trust-title-duplicate-actuals-2026-05-18.json` now shows:

- Day 2: `3` mapped items, `3` unique mapped stops, no duplicates, route distance `1397m`.
- Day 5: `4` mapped items, `4` unique mapped stops, no duplicates, route distance `5018m`.

## Remaining Risk

The planner now has canonical guardrails for the Athens failure patterns found in production. Broader destination-specific canonical coverage should continue in Month 2 by promoting more live generated/public actuals into this stricter duplicate-stop contract.
