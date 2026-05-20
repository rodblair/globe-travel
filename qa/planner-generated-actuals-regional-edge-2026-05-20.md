# Planner Generated Actuals: Regional Edge Cities

Date: 2026-05-20
Status: Passed after map-trust hardening

## Scope

This pass expands Month 2/Phase 1 generated-itinerary map-trust coverage beyond the first ten launch cities. The new `regional-edge-cities` preset covers:

- Istanbul, Turkey: 4 days, history, markets, ferries, rooftop dinners
- Bangkok, Thailand: 4 days, temples, street food, markets, late night
- Marrakech, Morocco: 3 days, souks, gardens, riads, calm pacing
- Sydney, Australia: 4 days, beaches, neighborhoods, ferry views, seafood

## Findings

The first live regional run exposed real map-trust gaps:

- Missing destination anchors caused weak or unmapped regional geocoding.
- Cape Town and Seoul were too broad for a reliable first regional generated-actual gate without deeper regional pin work.
- Istanbul initially repeated `Balat Antik Cafe` as both a meal and an activity, creating a duplicate mapped stop.
- Bangkok, Marrakech, and Sydney needed canonical routeable place sets to avoid weak street/neighborhood matches.

These were treated as launch-readiness issues, not ignored as test flakiness.

## Fixes

- Added the `regional-edge-cities` preset and `npm run qa:planner-actuals:regional-edge`.
- Added regional destination anchors for Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney.
- Added shared regional canonical place overrides for Istanbul, Bangkok, Marrakech, and Sydney, used by both the planner chat route and Trip Studio map hydration.
- Added trusted planner guidance for Istanbul, Bangkok, Marrakech, and Sydney so generated plans prefer routeable exact places.
- Added country-name alias handling for generated-actual and prompt-suite validation.
- Expanded `npm run qa:geocode-quality` to cover the six new regional destination anchors.

## Verification

Passing local gates:

- `npm run qa:prompt-suite`: `56/56`
- `npm run qa:geocode-quality`: `38/38`
- `npm run lint`: passed
- `npm run build`: passed
- Focused Istanbul rerun: `3/3`, duplicate-pin issue cleared
- `npm run qa:planner-actuals:regional-edge`: `6/6`
- `QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json npm run qa:prompt-suite`: `56/56`, `actualsChecked: 4`

Durable artifact:

- `qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json`

Browser spot check:

- In-app Browser opened local `http://localhost:3000/t/x3m2c8cnws`.
- Page title remained `5 Days in Athens Greece in mid september | Globe.travel`.
- Athens public share content, feedback/reaction area, and `Start your own trip` CTA were visible.
- No application error was visible.
- Horizontal overflow was `0`.

## Result

The Phase 1 regional generated-actual target now has four non-European regional city actuals passing the same map-trust rules as the first ten city set: expected day count, destination-title match, country consistency, mapped item count equals item count, no duplicate mapped stops, usable routes, and disposable fixture cleanup.

## Remaining Expansion

Seoul and Cape Town should be promoted in a later regional tranche after dedicated trusted-place guidance and canonical pins are added for compact Seoul districts and Cape Town day-trip routing.
