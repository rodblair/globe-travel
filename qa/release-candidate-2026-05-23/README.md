# Release Candidate Gate

Date: 2026-05-23
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 29
- Passed: 29
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: no
- Public share fixture owner id: n/a
- Multi-itinerary share UI included: no
- Owner feedback readback included: yes
- Planner generated actuals included: no
- Planner generated actuals preset: n/a
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: no
- Hosted Stripe billing portal included: no
- Summary JSON: `qa/release-candidate-2026-05-23/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 5.4s | no |
| production build | Pass | n/a | 9.5s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 44 | 0.2s | no |
| local route smoke | Pass | 8 | 0.3s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 4.4s | no |
| auth and guest access smoke | Pass | 16 | 31.9s | local |
| saved and account smoke | Pass | 14 | 13.8s | local |
| local commercial smoke | Pass | 4 | 0.2s | no |
| local accessibility and keyboard smoke | Pass | 22 | 47.1s | no |
| public share and social preview smoke | Pass | 5 | 1.0s | no |
| public share recovery smoke | Pass | 4 | 11.9s | no |
| public share viral loop smoke | Pass | 5 | 30.1s | local |
| public share map fallback smoke | Pass | 1 | 2.7s | no |
| public share feedback mutation smoke | Pass | 5 | 0.4s | local |
| public share recipient browser feedback smoke | Pass | 5 | 18.8s | local |
| public share feedback states browser smoke | Pass | 21 | 51.7s | local |
| planner handoff smoke | Pass | 17 | 8.8s | local |
| billing recovery smoke | Pass | 15 | 26.4s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 8.1s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.1s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 7 | 48.5s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.1s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 62.2s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 45.6s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| planner prompt contract suite | Pass | 60 | 0.1s | no |
| responsive visual QA | Pass | 55 | 149.9s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.7s | local |

## Fixture

- Trip id: 1cbc9546-e4b1-4d08-b5bc-2849f520b861
- Share slug: sctu3gclnq
- Run id: 0969e896
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
