# Release Candidate Gate

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 15
- Passed: 15
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: no
- Public share fixture sweep included: no
- Owner feedback readback included: yes
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-saved-account-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.3s | no |
| production build | Pass | n/a | 10.3s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| local route smoke | Pass | 8 | 0.6s | no |
| auth and guest access smoke | Pass | 11 | 47.9s | local |
| saved and account smoke | Pass | 10 | 12.1s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 42.8s | no |
| public share and social preview smoke | Pass | 5 | 1.1s | no |
| public share recovery smoke | Pass | 3 | 12.0s | no |
| public share viral loop smoke | Pass | 5 | 111.0s | local |
| public share feedback mutation smoke | Pass | 5 | 1.3s | local |
| planner handoff smoke | Pass | 13 | 1.5s | local |
| billing recovery smoke | Pass | 9 | 15.5s | no |
| Stripe test-mode readiness | Pass | 11 | 0.9s | no |

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
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
