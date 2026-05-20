# Planner Generated Actuals: Regional Edge Cities

Date: 2026-05-20
Status: Passed after map-trust hardening

## Scope

This pass expands Month 2/Phase 1 generated-itinerary map-trust coverage beyond the first ten launch cities. The new `regional-edge-cities` preset covers:

- Istanbul, Turkey: 4 days, history, markets, ferries, rooftop dinners
- Seoul, South Korea: 5 days, food, shopping, and one relaxed spa day
- Bangkok, Thailand: 4 days, temples, street food, markets, late night
- Marrakech, Morocco: 3 days, souks, gardens, riads, calm pacing
- Cape Town, South Africa: 5 days, hikes, wine, beaches, group-friendly dinners
- Sydney, Australia: 4 days, beaches, neighborhoods, ferry views, seafood

## Findings

The first live regional run exposed real map-trust gaps:

- Missing destination anchors caused weak or unmapped regional geocoding.
- Cape Town and Seoul were initially too broad for a reliable first regional generated-actual gate without deeper regional pin work.
- Istanbul initially repeated `Balat Antik Cafe` as both a meal and an activity, creating a duplicate mapped stop.
- Bangkok, Marrakech, and Sydney needed canonical routeable place sets to avoid weak street/neighborhood matches.
- Seoul initially generated useful days but almost no reliable pins, and Mapbox returned weak Seoul-wide or street-level matches for named places.
- Cape Town initially returned partial maps with weak street false positives such as `Good Hope Road`, `Point Street`, and `Social`, plus long day-trip routing risk.

These were treated as launch-readiness issues, not ignored as test flakiness.

## Fixes

- Added the `regional-edge-cities` preset and `npm run qa:planner-actuals:regional-edge`.
- Added regional destination anchors for Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney.
- Added shared regional canonical place overrides for Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney, used by both the planner chat route and Trip Studio map hydration.
- Added trusted planner guidance for Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney so generated plans prefer routeable exact places.
- Promoted Seoul and Cape Town into the `regional-edge-cities` preset after compact trusted-place sets were added.
- Added country-name alias handling for generated-actual and prompt-suite validation.
- Expanded `npm run qa:geocode-quality` to cover the six new regional destination anchors.

## Verification

Passing local gates:

- `npm run qa:prompt-suite`: `56/56`
- `npm run qa:geocode-quality`: `38/38`
- `npm run lint`: passed
- `npm run build`: passed
- Focused Istanbul rerun: `3/3`, duplicate-pin issue cleared
- Focused Seoul and Cape Town rerun: `4/4`, weak/missing pins and duplicate-pin issues cleared
- `npm run qa:planner-actuals:regional-edge`: `8/8`, `actualsChecked: 6`
- `QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json npm run qa:prompt-suite`: `56/56`, `actualsChecked: 6`

Durable artifact:

- `qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json`

Browser spot checks:

- In-app Browser opened local `http://localhost:3000/t/x3m2c8cnws`.
- Page title remained `5 Days in Athens Greece in mid september | Globe.travel`.
- Athens public share content, feedback/reaction area, and `Start your own trip` CTA were visible.
- No application error was visible.
- Horizontal overflow was `0`.
- In-app Browser opened temporary local Seoul public share `4rq3ggkvgd` before cleanup.
- Seoul title, representative stops (`Gyeongbokgung Palace`, `N Seoul Tower`, `Spa Lei`, `Hongdae Shopping Street`, `Banpo Hangang Park`), feedback affordance, `Start your own trip`, six map canvases, and `30` markers were visible; horizontal overflow was `0`; no application error was visible.
- In-app Browser opened temporary local Cape Town public share `ulmrhjseew` before cleanup.
- Cape Town title, representative stops (`Table Mountain Aerial Cableway`, `Lion's Head Trailhead`, `Beau Constantia`, `The Pot Luck Club`, `GOLD Restaurant`), feedback affordance, `Start your own trip`, and six map canvases were visible; horizontal overflow was `0`; no application error was visible.
- Temporary Seoul and Cape Town Browser fixtures and guest users were cleaned up.

## Result

The Phase 1 regional generated-actual target now has six non-European regional city actuals passing the same map-trust rules as the first ten city set: expected day count, destination-title match, country consistency, mapped item count equals item count, no duplicate mapped stops, usable routes, and disposable fixture cleanup.

## Remaining Expansion

The next regional tranche should move beyond the current six-city set into additional long-haul and multi-region fixtures such as Vancouver, Buenos Aires, Rio de Janeiro, Hanoi, Singapore, Hong Kong, Taipei, Auckland, and Dubai, using the same generated-actual proof loop before promotion.
