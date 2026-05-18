# Release Candidate Gate

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 23
- Passed: 23
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Owner feedback readback included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: no
- Summary JSON: `qa/release-candidate-full-predeploy-2026-05-18/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.5s | no |
| production build | Pass | n/a | 10.8s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| local route smoke | Pass | 8 | 0.6s | no |
| auth and guest access smoke | Pass | 11 | 28.1s | local |
| saved and account smoke | Pass | 10 | 12.2s | local |
| local commercial smoke | Pass | 4 | 0.2s | no |
| local accessibility and keyboard smoke | Pass | 16 | 43.2s | no |
| public share and social preview smoke | Pass | 5 | 1.4s | no |
| public share recovery smoke | Pass | 3 | 12.3s | no |
| public share viral loop smoke | Pass | 5 | 111.7s | local |
| public share fixture sweep | Pass | 5 | 15.0s | local |
| public share feedback mutation smoke | Pass | 5 | 0.7s | local |
| planner handoff smoke | Pass | 13 | 1.1s | local |
| billing recovery smoke | Pass | 9 | 18.3s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 6.8s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 10.6s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.2s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 48.7s | local |
| Stripe test-mode readiness | Pass | 11 | 0.8s | no |
| planner prompt contract suite | Pass | 52 | 0.1s | no |
| responsive visual QA | Pass | 50 | 162.1s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.6s | local |

## Fixture

- Trip id: 655410b4-0f65-4389-a5c5-2f6380e32707
- Share slug: hdoavdlpit
- Run id: e84d2f1e
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
