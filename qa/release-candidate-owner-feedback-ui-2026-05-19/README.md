# Release Candidate Gate

Date: 2026-05-20
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 24
- Passed: 24
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: yes
- Public share fixture sweep included: no
- Owner feedback readback included: yes
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-owner-feedback-ui-2026-05-19/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 13.1s | no |
| production build | Pass | n/a | 29.0s | no |
| local ops readiness | Pass | 3 | 0.9s | no |
| geocode quality smoke | Pass | 26 | 0.4s | no |
| local route smoke | Pass | 8 | 5.7s | no |
| auth and guest access smoke | Pass | 15 | 77.5s | local |
| saved and account smoke | Pass | 13 | 27.2s | local |
| local commercial smoke | Pass | 4 | 2.8s | no |
| local accessibility and keyboard smoke | Pass | 16 | 96.3s | no |
| public share and social preview smoke | Pass | 5 | 1.2s | no |
| public share recovery smoke | Pass | 4 | 11.7s | no |
| public share viral loop smoke | Pass | 5 | 145.0s | local |
| public share map fallback smoke | Pass | 1 | 12.7s | no |
| public share feedback mutation smoke | Pass | 5 | 2.0s | local |
| public share recipient browser feedback smoke | Pass | 5 | 42.7s | local |
| planner handoff smoke | Pass | 17 | 66.7s | local |
| billing recovery smoke | Pass | 13 | 39.1s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 12.4s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 20.4s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 6 | 55.2s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 3.1s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 6 | 92.5s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 1.1s | local |

## Fixture

- Trip id: 9f6b6b8c-b5c6-46e8-ac5d-cb618a03db90
- Share slug: oi8a12o59f
- Run id: c914e797
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
