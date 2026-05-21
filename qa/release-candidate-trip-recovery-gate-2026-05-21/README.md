# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 17
- Passed: 17
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: no
- Public share fixture sweep included: no
- Public share fixture owner id: n/a
- Owner feedback readback included: no
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Hosted Stripe billing portal included: no
- Summary JSON: `qa/release-candidate-trip-recovery-gate-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 8.0s | no |
| production build | Pass | n/a | 15.5s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 38 | 0.2s | no |
| local route smoke | Pass | 8 | 0.7s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 5.6s | no |
| auth and guest access smoke | Pass | 15 | 35.6s | local |
| saved and account smoke | Pass | 13 | 14.0s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 57.5s | no |
| public share and social preview smoke | Pass | 5 | 1.0s | no |
| public share recovery smoke | Pass | 4 | 12.1s | no |
| public share viral loop smoke | Pass | 5 | 331.8s | local |
| public share map fallback smoke | Pass | 1 | 4.6s | no |
| planner handoff smoke | Pass | 17 | 9.6s | local |
| billing recovery smoke | Pass | 13 | 19.2s | no |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |

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
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
