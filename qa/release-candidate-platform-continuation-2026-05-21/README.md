# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 28
- Passed: 28
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: no
- Public share fixture owner id: n/a
- Owner feedback readback included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: no
- Hosted Stripe billing portal included: no
- Summary JSON: `qa/release-candidate-platform-continuation-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 6.0s | no |
| production build | Pass | n/a | 14.9s | no |
| local ops readiness | Pass | 3 | 0.3s | no |
| geocode quality smoke | Pass | 38 | 0.2s | no |
| local route smoke | Pass | 8 | 2.2s | no |
| auth and guest access smoke | Pass | 15 | 48.2s | local |
| saved and account smoke | Pass | 13 | 15.6s | local |
| local commercial smoke | Pass | 4 | 0.4s | no |
| local accessibility and keyboard smoke | Pass | 16 | 58.7s | no |
| public share and social preview smoke | Pass | 5 | 1.5s | no |
| public share recovery smoke | Pass | 4 | 10.7s | no |
| public share viral loop smoke | Pass | 5 | 2139.5s | local |
| public share map fallback smoke | Pass | 1 | 63.3s | no |
| public share feedback mutation smoke | Pass | 5 | 0.8s | local |
| public share recipient browser feedback smoke | Pass | 5 | 20.6s | local |
| public share feedback states browser smoke | Pass | 21 | 50.6s | local |
| planner handoff smoke | Pass | 17 | 10.5s | local |
| billing recovery smoke | Pass | 13 | 20.0s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 5.5s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 12.1s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 6 | 46.7s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.6s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 37.0s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 153.7s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| planner prompt contract suite | Pass | 56 | 0.1s | no |
| responsive visual QA | Pass | 50 | 156.6s | no |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 0.6s | local |

## Fixture

- Trip id: c90197cb-33e3-4c6d-87bc-3b4c4fa56336
- Share slug: s7uoovmefs
- Run id: 830c2759
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
