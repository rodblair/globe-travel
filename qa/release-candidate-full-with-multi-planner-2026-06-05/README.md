# Release Candidate Gate

Date: 2026-06-05
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 35
- Passed: 35
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Public share fixture owner id: ca54ac63-2ec0-479c-8147-a351f1ba5088
- Multi-itinerary share UI included: yes
- Owner feedback readback included: yes
- Planner generated actuals included: yes
- Planner generated actuals preset: regional-edge-cities
- Accessibility and keyboard included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: yes
- Hosted Stripe billing portal included: yes
- Summary JSON: `qa/release-candidate-full-with-multi-planner-2026-06-05/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 5.5s | no |
| production build | Pass | n/a | 10.3s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 44 | 0.4s | no |
| planner generated actuals map trust | Pass | 8 | 185.6s | local |
| planner generated actuals prompt-suite cross-check | Pass | 61 | 0.1s | no |
| local route smoke | Pass | 8 | 1.9s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 3.9s | no |
| auth and guest access smoke | Pass | 16 | 35.3s | local |
| saved and account smoke | Pass | 16 | 26.7s | local |
| local commercial smoke | Pass | 4 | 0.4s | no |
| local accessibility and keyboard smoke | Pass | 22 | 53.5s | no |
| public share and social preview smoke | Pass | 5 | 2.1s | no |
| public share recovery smoke | Pass | 4 | 12.6s | no |
| public share viral loop smoke | Pass | 5 | 36.6s | local |
| public share map fallback smoke | Pass | 1 | 3.4s | no |
| public share fixture sweep | Pass | 5 | 23.9s | local |
| public share multi-itinerary browser UI smoke | Pass | 37 | 333.0s | local |
| public share feedback mutation smoke | Pass | 5 | 1.3s | local |
| public share recipient browser feedback smoke | Pass | 5 | 31.8s | local |
| public share feedback states browser smoke | Pass | 21 | 94.0s | local |
| planner handoff smoke | Pass | 17 | 13.7s | local |
| billing recovery smoke | Pass | 15 | 28.1s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 13.1s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.1s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 8 | 84.3s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.9s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 45.5s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 47.2s | local |
| Stripe test-mode readiness | Pass | 11 | 0.7s | no |
| planner prompt contract suite | Pass | 61 | 0.1s | no |
| responsive visual QA | Pass | 55 | 158.6s | no |
| hosted Stripe checkout browser QA | Pass | 15 | 17.0s | local |
| hosted Stripe billing portal browser QA | Pass | 16 | 14.4s | local |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 1.1s | local |

## Fixture

- Trip id: e2b3e141-2cb7-45e1-814b-63cdfa199be3
- Share slug: v2jnqzba3t
- Run id: a70615e2
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
