# Release Candidate Gate

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 18
- Passed: 18
- Failed: 0
- Visual QA included: no
- Trip Studio fixture included: no
- Public share fixture sweep included: no
- Public share fixture owner id: n/a
- Multi-itinerary share UI included: yes
- Owner feedback readback included: no
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Hosted Stripe billing portal included: no
- Summary JSON: `qa/release-candidate-share-multi-integration-2026-05-21/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 4.8s | no |
| production build | Pass | n/a | 10.9s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 38 | 0.2s | no |
| local route smoke | Pass | 8 | 2.8s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 6.8s | no |
| auth and guest access smoke | Pass | 15 | 46.7s | local |
| saved and account smoke | Pass | 14 | 15.7s | local |
| local commercial smoke | Pass | 4 | 0.3s | no |
| local accessibility and keyboard smoke | Pass | 16 | 41.5s | no |
| public share and social preview smoke | Pass | 5 | 1.2s | no |
| public share recovery smoke | Pass | 4 | 8.1s | no |
| public share viral loop smoke | Pass | 5 | 34.1s | local |
| public share map fallback smoke | Pass | 1 | 3.4s | no |
| public share multi-itinerary browser UI smoke | Pass | 37 | 329.8s | local |
| planner handoff smoke | Pass | 17 | 9.4s | local |
| billing recovery smoke | Pass | 15 | 25.9s | no |
| Stripe test-mode readiness | Pass | 11 | 0.7s | no |

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
- Set `QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1` to include the multi-itinerary public share Browser loop with disposable public trips, social-card image checks, recipient feedback, owner readback, and feedback refresh.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.

## Postdeploy Verification

This release-candidate orchestrator change deployed to Vercel production because it changed `client/scripts/platform-release-candidate-smoke.mjs`.

Deployed commit:

```text
a7a14162fdbaecaff6307642c0fbcc282d72121f
```

Production health stayed green during and after deployment:

- Status: `ok`
- Checks: `11/11`
- Deployment URL: `globe-travel-gw5fmpomm-rodney-blairs-projects.vercel.app`

Postdeploy production gate:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_INCLUDE_PRODUCTION_VISUAL=0 \
npm run qa:release-production
```

Result:

- Overall production gate: `9/9`
- Production ops: `3/3`
- Route smoke: `8/8`
- Trip Studio recovery UI: `1/1`
- Auth and guest access: `13/13`
- Commercial fail-safe checks: `4/4`
- Athens public share and map integrity: `5/5`
- Public share viral loop: `5/5`
- Prompt suite with production actuals: `56/56`
