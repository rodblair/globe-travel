# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 35
- Passed: 35
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Public share fixture owner id: f8b2bedc-4937-4888-9a29-bc56e4b01789
- Multi-itinerary share UI included: yes
- Owner feedback readback included: yes
- Planner generated actuals included: yes
- Planner generated actuals preset: regional-edge-cities
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: yes
- Hosted Stripe billing portal included: yes
- Summary JSON: `qa/release-candidate-full-with-multi-planner-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.8s | no |
| production build | Pass | n/a | 10.2s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 38 | 0.3s | no |
| planner generated actuals map trust | Pass | 8 | 113.9s | local |
| planner generated actuals prompt-suite cross-check | Pass | 56 | 0.1s | no |
| local route smoke | Pass | 8 | 2.1s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 5.6s | no |
| auth and guest access smoke | Pass | 15 | 45.7s | local |
| saved and account smoke | Pass | 14 | 15.2s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 44.6s | no |
| public share and social preview smoke | Pass | 5 | 1.2s | no |
| public share recovery smoke | Pass | 4 | 8.2s | no |
| public share viral loop smoke | Pass | 5 | 35.7s | local |
| public share map fallback smoke | Pass | 1 | 3.1s | no |
| public share fixture sweep | Pass | 5 | 12.7s | local |
| public share multi-itinerary browser UI smoke | Pass | 37 | 327.2s | local |
| public share feedback mutation smoke | Pass | 5 | 0.5s | local |
| public share recipient browser feedback smoke | Pass | 5 | 21.9s | local |
| public share feedback states browser smoke | Pass | 21 | 55.2s | local |
| planner handoff smoke | Pass | 17 | 10.1s | local |
| billing recovery smoke | Pass | 15 | 26.0s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 5.6s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.5s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 7 | 48.9s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.5s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 31.8s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 46.4s | local |
| Stripe test-mode readiness | Pass | 11 | 0.6s | no |
| planner prompt contract suite | Pass | 56 | 0.1s | no |
| responsive visual QA | Pass | 50 | 136.7s | no |
| hosted Stripe checkout browser QA | Pass | 15 | 17.8s | local |
| hosted Stripe billing portal browser QA | Pass | 16 | 22.3s | local |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 2.4s | local |

## Fixture

- Trip id: 00c8f230-98a6-4751-b06e-2624a73fa561
- Share slug: 0p02rllt1a
- Run id: 8be96cc0
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1` to include the multi-itinerary public share Browser loop with disposable public trips, social-card image checks, recipient feedback, owner readback, and feedback refresh.
- Set `QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1` to include live planner generated-actual map-trust checks; use `QA_RELEASE_PLANNER_ACTUALS_PRESET` to choose the fixture preset.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
