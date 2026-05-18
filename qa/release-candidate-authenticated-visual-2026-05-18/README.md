# Release Candidate Gate

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 18
- Passed: 18
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Owner feedback readback included: yes
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-authenticated-visual-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.2s | no |
| production build | Pass | n/a | 9.6s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| local route smoke | Pass | 8 | 0.5s | no |
| auth and guest access smoke | Pass | 11 | 53.0s | local |
| local commercial smoke | Pass | 4 | 0.2s | no |
| local accessibility and keyboard smoke | Pass | 16 | 42.2s | no |
| public share and social preview smoke | Pass | 5 | 1.1s | no |
| public share recovery smoke | Pass | 3 | 12.3s | no |
| public share feedback mutation smoke | Pass | 5 | 0.9s | local |
| planner handoff smoke | Pass | 10 | 1.5s | local |
| billing recovery smoke | Pass | 9 | 15.1s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 6.3s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.1s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 0.8s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| responsive visual QA | Pass | 6 | 25.4s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.6s | local |

## Fixture

- Trip id: 2c915d26-7090-421c-ba56-17f86e1abbee
- Share slug: 8qqu9d9wuv
- Run id: 63bae70a
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
