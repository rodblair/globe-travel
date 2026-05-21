# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 33
- Passed: 33
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Public share fixture owner id: 17acbbcd-8922-46ae-b344-1f5a370d4036
- Multi-itinerary share UI included: yes
- Owner feedback readback included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: yes
- Hosted Stripe billing portal included: yes
- Summary JSON: `qa/release-candidate-full-with-multi-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.7s | no |
| production build | Pass | n/a | 10.3s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 38 | 1.2s | no |
| local route smoke | Pass | 8 | 2.4s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 6.5s | no |
| auth and guest access smoke | Pass | 15 | 29.6s | local |
| saved and account smoke | Pass | 14 | 15.0s | local |
| local commercial smoke | Pass | 4 | 0.4s | no |
| local accessibility and keyboard smoke | Pass | 16 | 43.7s | no |
| public share and social preview smoke | Pass | 5 | 1.5s | no |
| public share recovery smoke | Pass | 4 | 8.3s | no |
| public share viral loop smoke | Pass | 5 | 35.0s | local |
| public share map fallback smoke | Pass | 1 | 3.3s | no |
| public share fixture sweep | Pass | 5 | 14.6s | local |
| public share multi-itinerary browser UI smoke | Pass | 37 | 333.0s | local |
| public share feedback mutation smoke | Pass | 5 | 0.7s | local |
| public share recipient browser feedback smoke | Pass | 5 | 21.5s | local |
| public share feedback states browser smoke | Pass | 21 | 61.5s | local |
| planner handoff smoke | Pass | 17 | 9.3s | local |
| billing recovery smoke | Pass | 15 | 26.2s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 7.8s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.0s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 7 | 48.2s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 0.7s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 33.5s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 46.2s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| planner prompt contract suite | Pass | 56 | 0.1s | no |
| responsive visual QA | Pass | 50 | 132.2s | no |
| hosted Stripe checkout browser QA | Pass | 15 | 16.5s | local |
| hosted Stripe billing portal browser QA | Pass | 16 | 48.8s | local |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 1.4s | local |

## Fixture

- Trip id: 7751430b-77c6-4a0d-aec7-386de0e766d0
- Share slug: 7cjwp1f6m4
- Run id: 5138f32c
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1` to include the multi-itinerary public share Browser loop with disposable public trips, social-card image checks, recipient feedback, owner readback, and feedback refresh.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
