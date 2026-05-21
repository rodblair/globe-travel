# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 32
- Passed: 32
- Failed: 0
- Visual QA included: yes
- Trip Studio fixture included: yes
- Public share fixture sweep included: yes
- Public share fixture owner id: fd0520de-d0f2-49a6-be44-f06b13dd14a3
- Owner feedback readback included: yes
- Slow-network recovery included: yes
- Hosted Stripe Checkout included: yes
- Hosted Stripe billing portal included: yes
- Summary JSON: `qa/release-candidate-full-post-billing-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 5.0s | no |
| production build | Pass | n/a | 11.0s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 38 | 0.2s | no |
| local route smoke | Pass | 8 | 2.2s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 6.2s | no |
| auth and guest access smoke | Pass | 15 | 30.1s | local |
| saved and account smoke | Pass | 14 | 18.2s | local |
| local commercial smoke | Pass | 4 | 0.4s | no |
| local accessibility and keyboard smoke | Pass | 16 | 46.9s | no |
| public share and social preview smoke | Pass | 5 | 1.3s | no |
| public share recovery smoke | Pass | 4 | 7.7s | no |
| public share viral loop smoke | Pass | 5 | 39.3s | local |
| public share map fallback smoke | Pass | 1 | 3.1s | no |
| public share fixture sweep | Pass | 5 | 11.5s | local |
| public share feedback mutation smoke | Pass | 5 | 0.4s | local |
| public share recipient browser feedback smoke | Pass | 5 | 21.4s | local |
| public share feedback states browser smoke | Pass | 21 | 66.9s | local |
| planner handoff smoke | Pass | 17 | 9.4s | local |
| billing recovery smoke | Pass | 15 | 25.6s | no |
| Trip Studio action smoke with kept fixture | Pass | 23 | 9.8s | local |
| Trip Studio recovery smoke on kept fixture | Pass | 6 | 8.3s | no |
| Trip Studio owner/read-only browser UI smoke on kept fixture | Pass | 7 | 48.9s | no |
| Trip Studio owner feedback readback smoke | Pass | 6 | 1.9s | local |
| Trip Studio owner feedback browser UI smoke | Pass | 11 | 34.2s | local |
| slow-network recovery smoke on kept fixture | Pass | 5 | 44.8s | local |
| Stripe test-mode readiness | Pass | 11 | 0.5s | no |
| planner prompt contract suite | Pass | 56 | 0.1s | no |
| responsive visual QA | Pass | 50 | 134.5s | no |
| hosted Stripe checkout browser QA | Pass | 15 | 17.3s | local |
| hosted Stripe billing portal browser QA | Pass | 16 | 15.3s | local |
| cleanup release-candidate Trip Studio fixture | Pass | n/a | 1.1s | local |

## Fixture

- Trip id: 258f3e25-cbad-41d3-bd9d-33c5d8a82b87
- Share slug: fcrcpt2uhd
- Run id: fe6c4e28
- Cleanup task: passed

## Failure Detail

No failures.

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
