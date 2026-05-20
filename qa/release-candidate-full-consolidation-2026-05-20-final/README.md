# Release Candidate Gate

Date: 2026-05-20
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 30
- Passed: 30
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Public share fixture owner id: b3f8bd5c-33be-4aa0-b3f4-a5b4f959e77b
- Owner feedback readback included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: yes
- Summary JSON: `qa/release-candidate-full-consolidation-2026-05-20-final/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 11.8s | no |
| production build | Pass | n/a | 22.1s | no |
| local ops readiness | Pass | 3 | 0.4s | no |
| geocode quality smoke | Pass | 26 | 0.3s | no |
| local route smoke | Pass | 8 | 1.2s | no |
| auth and guest access smoke | Pass | 15 | 50.8s | local |
| saved and account smoke | Pass | 13 | 17.7s | local |
| local commercial smoke | Pass | 4 | 0.9s | no |
| local accessibility and keyboard smoke | Pass | 16 | 84.5s | no |
| public share and social preview smoke | Pass | 5 | 3.1s | no |
| public share recovery smoke | Pass | 4 | 24.5s | no |
| public share viral loop smoke | Pass | 5 | 109.6s | local |
| public share map fallback smoke | Pass | 1 | 7.8s | no |
| public share fixture sweep | Pass | 5 | 28.5s | local |
| public share feedback mutation smoke | Pass | 5 | 1.6s | local |
| public share recipient browser feedback smoke | Pass | 5 | 43.9s | local |
| public share feedback states browser smoke | Pass | 21 | 61.6s | local |
| planner handoff smoke | Pass | 17 | 15.4s | local |
| billing recovery smoke | Pass | 13 | 31.1s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 7.8s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 12.2s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 6 | 27.2s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.1s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 349.7s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 47.3s | local |
| Stripe test-mode readiness | Pass | 11 | 0.6s | no |
| planner prompt contract suite | Pass | 56 | 0.2s | no |
| responsive visual QA | Pass | 50 | 221.9s | no |
| hosted Stripe checkout browser QA | Pass | 15 | 20.1s | local |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 1.1s | local |

## Fixture

- Trip id: a84cbd5f-abb2-436f-b544-4d4bc569070c
- Share slug: uw2m3likgr
- Run id: 94b3a251
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
