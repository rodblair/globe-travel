# Release Candidate Gate

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 14
- Passed: 14
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: no
- Public share fixture sweep included: no
- Owner feedback readback included: yes
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-share-viral-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.1s | no |
| production build | Pass | n/a | 10.2s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| local route smoke | Pass | 8 | 0.6s | no |
| auth and guest access smoke | Pass | 11 | 46.6s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 42.4s | no |
| public share and social preview smoke | Pass | 5 | 0.9s | no |
| public share recovery smoke | Pass | 3 | 12.1s | no |
| public share viral loop smoke | Pass | 5 | 110.9s | local |
| public share feedback mutation smoke | Pass | 5 | 1.2s | local |
| planner handoff smoke | Pass | 13 | 1.6s | local |
| billing recovery smoke | Pass | 9 | 15.6s | no |
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
