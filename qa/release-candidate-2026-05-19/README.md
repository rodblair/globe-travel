# Release Candidate Gate

Date: 2026-05-19
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 20
- Passed: 20
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: yes
- Public share fixture sweep included: no
- Owner feedback readback included: no
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-2026-05-19/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.2s | no |
| production build | Pass | n/a | 9.3s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 26 | 0.4s | no |
| local route smoke | Pass | 8 | 1.6s | no |
| auth and guest access smoke | Pass | 15 | 49.9s | local |
| saved and account smoke | Pass | 13 | 15.9s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 88.0s | no |
| public share and social preview smoke | Pass | 5 | 2.2s | no |
| public share recovery smoke | Pass | 4 | 21.5s | no |
| public share viral loop smoke | Pass | 5 | 109.6s | local |
| public share map fallback smoke | Pass | 1 | 6.3s | no |
| planner handoff smoke | Pass | 17 | 11.6s | local |
| billing recovery smoke | Pass | 13 | 25.1s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 9.0s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 9.7s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 6 | 18.3s | no |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.5s | local |

## Fixture

- Trip id: 90812db3-0522-4df4-ab47-7373e13cebcf
- Share slug: puw8nvrs14
- Run id: 162d8c28
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
