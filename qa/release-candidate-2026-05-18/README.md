# Release Candidate Gate

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 17
- Passed: 17
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.3s | no |
| production build | Pass | n/a | 10.9s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| local route smoke | Pass | 8 | 1.6s | no |
| local commercial smoke | Pass | 4 | 0.8s | no |
| local accessibility and keyboard smoke | Pass | 16 | 43.5s | no |
| public share and social preview smoke | Pass | 5 | 1.1s | no |
| public share recovery smoke | Pass | 3 | 13.2s | no |
| public share feedback mutation smoke | Pass | 5 | 1.2s | local |
| planner handoff smoke | Pass | 10 | 1.5s | local |
| billing recovery smoke | Pass | 9 | 16.3s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 5.4s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.4s | no |
| Stripe test-mode readiness | Pass | 11 | 0.6s | no |
| planner prompt contract suite | Pass | 52 | 0.1s | no |
| responsive visual QA | Pass | 50 | 159.0s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.4s | local |

## Fixture

- Trip id: 5093df61-9c67-45ae-8b7b-f18325070089
- Share slug: 8qq6txub6a
- Run id: 7fbbefb7
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
