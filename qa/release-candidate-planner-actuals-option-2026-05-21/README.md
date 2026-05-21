# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 19
- Passed: 19
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: no
- Public share fixture sweep included: no
- Public share fixture owner id: n/a
- Multi-itinerary share UI included: no
- Owner feedback readback included: no
- Planner generated actuals included: yes
- Planner generated actuals preset: default
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Hosted Stripe billing portal included: no
- Summary JSON: `qa/release-candidate-planner-actuals-option-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.8s | no |
| production build | Pass | n/a | 10.9s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 38 | 0.2s | no |
| planner generated actuals map trust | Pass | 3 | 20.0s | local |
| planner generated actuals prompt-suite cross-check | Pass | 56 | 0.1s | no |
| local route smoke | Pass | 8 | 1.9s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 4.9s | no |
| auth and guest access smoke | Pass | 15 | 47.4s | local |
| saved and account smoke | Pass | 14 | 15.5s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 43.0s | no |
| public share and social preview smoke | Pass | 5 | 1.4s | no |
| public share recovery smoke | Pass | 4 | 7.9s | no |
| public share viral loop smoke | Pass | 5 | 35.1s | local |
| public share map fallback smoke | Pass | 1 | 3.3s | no |
| planner handoff smoke | Pass | 17 | 10.0s | local |
| billing recovery smoke | Pass | 15 | 27.4s | no |
| Stripe test-mode readiness | Pass | 11 | 0.7s | no |

## Fixture

- Trip id: n/a
- Share slug: n/a
- Run id: n/a
- Cleanup task: n/a

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1` to include the multi-itinerary public share Browser loop with disposable public trips, social-card image checks, recipient feedback, owner readback, and feedback refresh.
- Set `QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1` to include live planner generated-actual map-trust checks; use `QA_RELEASE_PLANNER_ACTUALS_PRESET` to choose the fixture preset.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
