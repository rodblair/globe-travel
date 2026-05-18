# Release Candidate Gate

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 24
- Passed: 24
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: no
- Owner feedback readback included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.4s | no |
| production build | Pass | n/a | 10.4s | no |
| local ops readiness | Pass | 3 | 0.2s | no |
| geocode quality smoke | Pass | 14 | 0.2s | no |
| local route smoke | Pass | 8 | 0.8s | no |
| auth and guest access smoke | Pass | 14 | 32.8s | local |
| saved and account smoke | Pass | 13 | 14.5s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 42.0s | no |
| public share and social preview smoke | Pass | 5 | 0.7s | no |
| public share recovery smoke | Pass | 4 | 12.6s | no |
| public share viral loop smoke | Pass | 5 | 105.4s | local |
| public share map fallback smoke | Pass | 1 | 3.3s | no |
| public share feedback mutation smoke | Pass | 5 | 0.5s | local |
| planner handoff smoke | Pass | 17 | 10.0s | local |
| billing recovery smoke | Pass | 13 | 18.1s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 5.1s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.1s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 0.7s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 45.6s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| planner prompt contract suite | Pass | 56 | 0.1s | no |
| responsive visual QA | Pass | 50 | 141.3s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.7s | local |

## Fixture

- Trip id: a8f74428-70ec-4699-8fe6-b34bd43243cf
- Share slug: 6247qedryb
- Run id: a67cd892
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
