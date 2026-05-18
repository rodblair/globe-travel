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
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.2s | no |
| production build | Pass | n/a | 10.2s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| local route smoke | Pass | 8 | 0.8s | no |
| auth and guest access smoke | Pass | 11 | 51.1s | local |
| local commercial smoke | Pass | 4 | 0.2s | no |
| local accessibility and keyboard smoke | Pass | 16 | 44.1s | no |
| public share and social preview smoke | Pass | 5 | 0.7s | no |
| public share recovery smoke | Pass | 3 | 11.8s | no |
| public share feedback mutation smoke | Pass | 5 | 0.7s | local |
| planner handoff smoke | Pass | 10 | 1.0s | local |
| billing recovery smoke | Pass | 9 | 15.4s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 8.4s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.2s | no |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| planner prompt contract suite | Pass | 52 | 0.1s | no |
| responsive visual QA | Pass | 50 | 142.3s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.4s | local |

## Fixture

- Trip id: e6b9b5ac-ee6a-4b15-b6b9-1e8af3303d06
- Share slug: iijni03pdg
- Run id: b3b3524f
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
