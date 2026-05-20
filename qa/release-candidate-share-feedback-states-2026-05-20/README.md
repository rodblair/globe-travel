# Release Candidate Gate

Date: 2026-05-20
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 25
- Passed: 25
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: yes
- Public share fixture sweep included: no
- Owner feedback readback included: yes
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-share-feedback-states-2026-05-20/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 12.2s | no |
| production build | Pass | n/a | 25.5s | no |
| local ops readiness | Pass | 3 | 1.0s | no |
| geocode quality smoke | Pass | 26 | 0.3s | no |
| local route smoke | Pass | 8 | 6.0s | no |
| auth and guest access smoke | Pass | 15 | 66.5s | local |
| saved and account smoke | Pass | 13 | 24.9s | local |
| local commercial smoke | Pass | 4 | 1.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 95.4s | no |
| public share and social preview smoke | Pass | 5 | 3.4s | no |
| public share recovery smoke | Pass | 4 | 30.3s | no |
| public share viral loop smoke | Pass | 5 | 131.5s | local |
| public share map fallback smoke | Pass | 1 | 9.4s | no |
| public share feedback mutation smoke | Pass | 5 | 1.3s | local |
| public share recipient browser feedback smoke | Pass | 5 | 36.0s | local |
| public share feedback states browser smoke | Pass | 12 | 75.5s | local |
| planner handoff smoke | Pass | 17 | 19.9s | local |
| billing recovery smoke | Pass | 13 | 44.4s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 38.8s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 16.8s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 6 | 28.5s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 2.7s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 6 | 90.0s | local |
| Stripe test-mode readiness | Pass | 11 | 0.7s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.5s | local |

## Fixture

- Trip id: 892e54b9-84bf-47b6-9205-1f5fe9914a14
- Share slug: qogf5wutyv
- Run id: 943260b3
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
