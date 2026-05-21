# Launch Signoff Planner Actuals Coverage

Date: 2026-05-21

## Goal

Close the planner/map evidence gap where regional generated itinerary actuals existed as standalone QA proof, but launch signoff did not directly verify that the launch packet still had fresh, complete, map-ready generated actual evidence.

## Fix

- Added `QA_LAUNCH_PLANNER_ACTUALS_ARTIFACT` to `npm run qa:launch-signoff`.
- The default launch signoff now reads `qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json`.
- The audit verifies that the regional planner actual artifact is readable, fresh, covers all six launch edge-city fixtures, and has map-ready days with:
  - mapped stops for every itinerary item;
  - unique mapped pins;
  - one expected country per generated day;
  - at least one usable route per day.
- Added `QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1` to `npm run qa:release-candidate` so a predeploy release-candidate run can include live planner generated-actual map-trust checks plus prompt-suite cross-checking.

## Verification

- `node --check scripts/platform-launch-signoff.mjs`: pass
- `node --check scripts/platform-release-candidate-smoke.mjs`: pass
- `npm run qa:launch-signoff`: pass, `31/31`
- Stale planner actual artifact negative test with `2026-04-01` path date: failed as expected on `regional planner generated actuals evidence is fresh`.
- Incomplete planner actual artifact negative test with only one regional fixture: failed as expected on `regional planner generated actuals cover launch edge cities`.
- Focused release-candidate run with `QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1` and `QA_RELEASE_PLANNER_ACTUALS_PRESET=default`: pass, `19/19`.

## Focused Release-Candidate Evidence

Artifact: `qa/release-candidate-planner-actuals-option-2026-05-21/`

The focused run verified the new release-candidate planner-actuals wiring without rerunning every heavy optional launch gate:

- Planner generated actuals map trust: `3/3`
- Generated actuals checked: `1`
- Prompt-suite cross-check with generated actuals: `56/56`
- Geocode quality smoke: `38/38`
- Auth and guest access: `15/15`
- Saved and account: `14/14`
- Accessibility and keyboard: `16/16`
- Billing recovery: `15/15`
- Stripe readiness: `11/11`
- Disposable generated trip and guest cleanup: passed

## Result

Launch signoff now proves the regional generated itinerary/map-trust evidence is current and complete. Release-candidate runs can also opt into live generated actuals, giving the platform a repeatable path from real planner generation to launch approval evidence.

## Postdeploy Evidence

Commit `b7ea3719daadd0f335d75a245dcc70c3399aa91e` deployed to Vercel production.

- Production alias: `https://globe-travel-two.vercel.app`
- Deployment URL: `globe-travel-6iuufpxom-rodney-blairs-projects.vercel.app`
- Production health: `ok`, `11/11`
- Exact-commit launch signoff: `32/32`
- Non-visual production release gate: `9/9`
- Athens public share/map integrity: `5/5`, with 5 itinerary days, mapped stops, usable routes, share metadata, and share-card image.
- Prompt suite with production actuals: `56/56`
