# Release Candidate Gate

Date: 2026-05-18
Environment: local, `http://localhost:3000`
Command: `npm run qa:release-candidate`

## Scope

This gate bundles the local checks required before a production release decision:

- lint and production build
- operations, route smoke, auth/guest access, commercial smoke, accessibility/keyboard smoke
- public share/social preview, public share recovery, and public feedback mutation with cleanup
- planner handoff mutation with cleanup
- billing recovery states
- Trip Studio action coverage on a kept disposable fixture
- Trip Studio recovery coverage on the same fixture
- Trip Studio owner feedback readback on the same public fixture
- slow-network recovery for planner, Trip Studio, public share, and billing
- authenticated visual QA using the kept fixture guest ID for protected owner surfaces
- Stripe test-mode readiness
- planner prompt contract suite
- full responsive visual QA across 10 routes and 5 viewports
- cleanup of the disposable Trip Studio fixture

Hosted Stripe Checkout browser completion remains opt-in with `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` because it creates Stripe test-mode objects.

## Findings Fixed

- Account billing comparison chips failed serious axe contrast on desktop. The Explorer comparison chip text was raised from `text-foreground/50` to `text-foreground/70`.
- The visual gate expected only `Save trip` on Trip Studio, but a realistic kept fixture can already be in the `Saved` state after action QA. The marker contract now accepts either `Save trip` or `Saved`.
- Public share visual capture could measure before client-rendered itinerary and feedback content finished loading. The visual runner now waits for route markers or app-error text before collecting layout metrics.

## Evidence

Final result: passed `18/18` release-candidate tasks.

Key nested results:

- `npm run lint`: passed
- `npm run build`: passed
- local ops readiness: `3/3`
- local route smoke: `8/8`
- auth and guest access smoke: `11/11`, cleaned up disposable guest account
- local commercial smoke: `4/4`
- local accessibility and keyboard smoke: `16/16`
- public share and social preview smoke: `5/5`
- public share recovery smoke: `3/3`
- public share feedback mutation smoke: `5/5`, cleaned up
- planner handoff smoke: `10/10`, cleaned up
- billing recovery smoke: `9/9`
- Trip Studio action smoke on kept fixture: `23/23`
- Trip Studio recovery smoke on kept fixture: `6/6`
- Trip Studio owner feedback readback smoke: `6/6`
- slow-network recovery smoke on kept fixture: `5/5`
- authenticated owner visual QA focused run: `6/6`
- Stripe test-mode readiness: `11/11`
- planner prompt contract suite: `52/52`
- responsive visual QA: `50/50`
- disposable Trip Studio fixture cleanup: passed

In-app Browser sanity:

- `/account?tab=billing` rendered `Plan and billing`, Explorer/Adventurer comparison content, no app error, and no horizontal overflow.
- `/t/x3m2c8cnws` rendered the Athens public-share content, Start your own trip CTA, feedback/reaction content, no app error, and no horizontal overflow after client content settled.

Artifacts:

- `qa/auth-guest-access-2026-05-18.md`
- `qa/release-candidate-2026-05-18/README.md`
- `qa/release-candidate-2026-05-18/summary.json`
- `qa/release-candidate-owner-feedback-2026-05-18/README.md`
- `qa/release-candidate-owner-feedback-2026-05-18/summary.json`
- `qa/release-candidate-authenticated-visual-2026-05-18/README.md`
- `qa/release-candidate-authenticated-visual-2026-05-18/summary.json`
- `qa/authenticated-visual-qa-2026-05-18.md`
- `qa/release-candidate-slow-network-2026-05-18/README.md`
- `qa/release-candidate-slow-network-2026-05-18/summary.json`
- `qa/slow-network-recovery-2026-05-18.md`
- `qa/accessibility-keyboard-2026-05-18/README.md`
- `qa/accessibility-keyboard-2026-05-18/summary.json`
- `qa/visual-baseline-2026-05-18-release-candidate-2026-05-18/README.md`
- `qa/visual-baseline-2026-05-18-release-candidate-2026-05-18/summary.json`
- `qa/visual-baseline-2026-05-18-release-candidate-2026-05-18/screenshots/`

## Release Impact

This closes the missing local release-candidate command gap for Sprint 4, the owner-feedback/readback follow-up from Sprint 1, the authenticated visual-fixture follow-up from Sprint 2, and the current slow-network recovery follow-up. The app now has a single repeatable pre-deploy gate that exercises core functionality, accessibility, authenticated visual QA, commercial readiness, viral sharing surfaces, public-to-owner feedback, slow successful API behavior, Trip Studio owner behavior, planner handoff, and billing recovery before production verification.
