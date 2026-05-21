# Full Release Candidate Planner Promotion

Date: 2026-05-21

## Goal

Close the launch-packet gap where planner generated-actual map trust was proven by a focused side artifact but was not required inside the full local release-candidate artifact used by launch signoff.

## Fix

- Promoted planner generated actuals into the required full release-candidate contract.
- `npm run qa:launch-signoff` now requires:
  - `includePlannerActuals: true` in the full release-candidate summary;
  - `planner generated actuals map trust`;
  - `planner generated actuals prompt-suite cross-check`.
- Updated launch signoff defaults to the refreshed full release artifact:
  - `qa/release-candidate-full-with-multi-planner-2026-05-21/summary.json`
  - `qa/visual-baseline-2026-05-21-full-with-multi-planner-2026-05-21/summary.json`
  - `qa/release-candidate-full-with-multi-planner-2026-05-21/planner-generated-actuals-regional-edge-cities.json`
  - hosted Stripe Checkout and portal screenshots from the `full-with-multi-planner` run.

## Verification

- Full local release-candidate with every major launch option enabled: `35/35`
- Regional planner generated actuals: `8/8`, `actualsChecked: 6`
- Generated actuals prompt-suite cross-check: `56/56`, `actualsChecked: 6`
- Geocode quality smoke: `38/38`
- Multi-itinerary public-share Browser UI: `37/37`
- Public share feedback states Browser smoke: `21/21`
- Trip Studio owner/read-only Browser UI: `7/7`
- Trip Studio owner feedback Browser UI: `11/11`
- Slow-network recovery: `5/5`
- Responsive visual QA: `50/50`
- Hosted Stripe Checkout Browser QA: `15/15`
- Hosted Stripe billing portal Browser QA: `16/16`
- Release-candidate cleanup: passed
- `npm run qa:launch-signoff`: pass, `32/32`
- Old full release artifact negative test: failed as expected because it lacked `includePlannerActuals`, `planner generated actuals map trust`, and `planner generated actuals prompt-suite cross-check`.

## Artifacts

- `qa/release-candidate-full-with-multi-planner-2026-05-21/`
- `qa/visual-baseline-2026-05-21-full-with-multi-planner-2026-05-21/`
- `qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/`
- `qa/stripe-portal-browser-full-with-multi-planner-2026-05-21/`

## Result

The primary full local release-candidate packet now includes live regional planner generated actuals, broad user-journey QA, visual QA, hosted Stripe readiness, sharing loops, owner feedback, slow-network recovery, and cleanup in one launch-signoff artifact.
