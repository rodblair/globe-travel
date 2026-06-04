# Release Candidate Gate

Date: 2026-06-04
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 35
- Passed: 35
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Public share fixture owner id: bc880225-9b16-4b66-8641-045b46baf163
- Multi-itinerary share UI included: yes
- Owner feedback readback included: yes
- Planner generated actuals included: yes
- Planner generated actuals preset: regional-edge-cities
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: yes
- Hosted Stripe billing portal included: yes
- Summary JSON: `qa/release-candidate-full-with-multi-planner-2026-06-04/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 6.6s | no |
| production build | Pass | n/a | 13.1s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 44 | 0.4s | no |
| planner generated actuals map trust | Pass | 8 | 169.6s | local |
| planner generated actuals prompt-suite cross-check | Pass | 61 | 0.1s | no |
| local route smoke | Pass | 8 | 0.8s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 5.0s | no |
| auth and guest access smoke | Pass | 16 | 35.3s | local |
| saved and account smoke | Pass | 16 | 23.2s | local |
| local commercial smoke | Pass | 4 | 0.5s | no |
| local accessibility and keyboard smoke | Pass | 22 | 56.6s | no |
| public share and social preview smoke | Pass | 5 | 1.3s | no |
| public share recovery smoke | Pass | 4 | 12.8s | no |
| public share viral loop smoke | Pass | 5 | 34.9s | local |
| public share map fallback smoke | Pass | 1 | 4.3s | no |
| public share fixture sweep | Pass | 5 | 21.3s | local |
| public share multi-itinerary browser UI smoke | Pass | 37 | 334.8s | local |
| public share feedback mutation smoke | Pass | 5 | 2.5s | local |
| public share recipient browser feedback smoke | Pass | 5 | 43.2s | local |
| public share feedback states browser smoke | Pass | 21 | 96.7s | local |
| planner handoff smoke | Pass | 17 | 14.8s | local |
| billing recovery smoke | Pass | 15 | 30.2s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 11.3s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.9s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 8 | 82.7s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.3s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 48.0s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 46.2s | local |
| Stripe test-mode readiness | Pass | 11 | 0.8s | no |
| planner prompt contract suite | Pass | 61 | 0.1s | no |
| responsive visual QA | Pass | 55 | 206.4s | no |
| hosted Stripe checkout browser QA | Pass | 15 | 20.8s | local |
| hosted Stripe billing portal browser QA | Pass | 16 | 16.8s | local |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 1.0s | local |

## Fixture

- Trip id: 814fb328-8b49-4d6c-a3a2-73ed662114c8
- Share slug: u38n32f00e
- Run id: 51738a13
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
