# Public Share Duplicate Stop Gate

Date: 2026-05-18
Surface: public share QA, map trust, release gate
Goal slice: Month 2 planner/map trust

## Purpose

Promote duplicate mapped-stop detection from prompt actuals into `npm run qa:share`.

The previous public share smoke checked that each itinerary day had mapped stops, one country, and a usable route. That was useful, but too broad: it would not independently fail when two distinct itinerary items shared the same generic mapped coordinate. The production Athens repair found exactly that class of issue, so public share QA now catches it directly for every checked share slug.

## Change

Updated `client/scripts/platform-share-smoke.mjs` so each public itinerary day now reports:

- `uniqueMappedStopCount`
- `duplicateMappedStops`
- `routeDistanceMeters`

The gate now fails a day when `duplicateMappedStops.length > 0`.

This means `qa:share`, `qa:release-production`, and release-candidate share checks all inherit duplicate-pin protection.

## Verification

Production Athens share:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
```

Result: passed `5/5`.

Important evidence:

- Day 1: `2` mapped items, `2` unique stops, no duplicates, route `711m`.
- Day 2: `3` mapped items, `3` unique stops, no duplicates, route `1397m`.
- Day 3: `3` mapped items, `3` unique stops, no duplicates, route `3449m`.
- Day 4: `3` mapped items, `3` unique stops, no duplicates, route `9883m`.
- Day 5: `4` mapped items, `4` unique stops, no duplicates, route `5018m`.

Production prompt actuals cross-check:

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-title-duplicate-actuals-2026-05-18.json npm run qa:prompt-suite
```

Result: passed `52/52`, `actualsChecked: 1`.

Ten disposable multi-destination public fixtures:

```bash
QA_OWNER_USER_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea npm run qa:share-fixtures
QA_SHARE_SLUGS=qa490639881,qa490639882,qa490639883,qa490639884,qa490639885,qa490639886,qa490639887,qa490639888,qa490639889,qa4906398810 npm run qa:share
QA_CLEANUP_TRIP_IDS=9a670730-62ae-427c-b64b-fbbe93f8fa96,3e27c541-4d19-459f-a0e7-a39eeea4df50,bf72b5dd-43c9-45a8-a67c-4890d252c5de,1093ef01-ba97-4d79-b083-9bb9b985703f,2f434475-5fd6-4999-97b5-051dd48bd8dc,17476afb-32ac-46c6-a802-36be59378278,34406176-a436-406a-998d-e9f9b3509d73,cb9e4166-f969-40eb-a801-c54eb3d54554,7cd6e15b-ee40-408b-a10b-851e1bd41c1a,1d6461fa-d717-4d3f-8438-e4f8a41fe139 QA_CLEANUP_RUN_ID=49063988 npm run qa:share-fixtures
```

Result:

- Created 10 public fixtures covering Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin.
- `qa:share` passed `50/50`.
- Every checked day reported `duplicateMappedStops: []`.
- Cleanup deleted `10` trips and `62` QA places.

Browser check:

- In-app Browser opened `http://localhost:3000/t/qa490639881`.
- Confirmed `QA 3 Days in Lisbon 49063988` rendered.
- Confirmed day content for `Alfama arrival`, `Belém and riverfront`, and `Chiado finale`.
- Confirmed map elements were present.
- Confirmed horizontal overflow was `0`.

Shipping gates:

```bash
npm run lint
npm run build
git diff --check
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production
```

Results:

- Lint passed.
- Build passed.
- Whitespace check passed.
- Production release gate passed `7/7`, now with duplicate-stop details included in production share output.

## Remaining Risk

This catches duplicate coordinates on public itinerary days. Month 2 should continue adding more live/generated prompt actuals so the same standard is applied to more naturally generated trips, not only deterministic fixtures and the stable Athens share.
