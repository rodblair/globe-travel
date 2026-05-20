# Release Candidate Gate

Date: 2026-05-20
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
- Hosted Stripe billing portal included: yes
- Summary JSON: `qa/release-candidate-stripe-portal-2026-05-20/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 13.4s | no |
| production build | Pass | n/a | 29.9s | no |
| local ops readiness | Pass | 3 | 0.4s | no |
| geocode quality smoke | Pass | 26 | 0.4s | no |
| local route smoke | Pass | 8 | 4.5s | no |
| auth and guest access smoke | Pass | 15 | 52.3s | local |
| saved and account smoke | Pass | 13 | 17.1s | local |
| local commercial smoke | Pass | 4 | 0.9s | no |
| local accessibility and keyboard smoke | Pass | 16 | 82.2s | no |
| public share and social preview smoke | Pass | 5 | 2.3s | no |
| public share recovery smoke | Pass | 4 | 23.3s | no |
| public share viral loop smoke | Pass | 5 | 109.9s | local |
| public share map fallback smoke | Pass | 1 | 5.6s | no |
| planner handoff smoke | Pass | 17 | 14.2s | local |
| billing recovery smoke | Pass | 13 | 27.4s | no |
| Stripe test-mode readiness | Pass | 11 | 0.6s | no |
| hosted Stripe billing portal browser QA | Pass | 16 | 21.1s | local |

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
