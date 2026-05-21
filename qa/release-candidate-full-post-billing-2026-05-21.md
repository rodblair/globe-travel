# Full Local Release Candidate After Billing-State Hardening

Date: 2026-05-21
Environment: `http://localhost:3000`
Commit under test: `d4e6d6a` workspace with runtime changes from `ec53a97`

## Goal

Refresh the local internal release-candidate evidence after the billing subscription-state hardening, with every optional release gate enabled. This closes the gap between the targeted billing fix and the broader platform-readiness objective.

## Command

```bash
QA_RELEASE_ARTIFACT_NAME=release-candidate-full-post-billing-2026-05-21 \
QA_VISUAL_RUN_ID=full-post-billing-2026-05-21 \
QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=1 \
QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1 \
QA_RELEASE_INCLUDE_STRIPE_PORTAL=1 \
QA_STRIPE_CHECKOUT_ARTIFACT_NAME=stripe-checkout-browser-full-post-billing-2026-05-21 \
QA_STRIPE_PORTAL_ARTIFACT_NAME=stripe-portal-browser-full-post-billing-2026-05-21 \
npm run qa:release-candidate
```

## Result

Passed `32/32`.

Major coverage:

- `npm run lint`
- `npm run build`
- Local ops readiness `3/3`
- Geocode quality `38/38`
- Route smoke `8/8`
- Trip Studio missing-trip recovery UI `1/1`
- Auth and guest access `15/15`
- Saved/account returning-user coverage `14/14`
- Commercial fail-safe checks `4/4`
- Accessibility and keyboard coverage `16/16`
- Public share/social preview `5/5`
- Public share recovery `4/4`
- Public share viral loop `5/5`
- Public share static map fallback `1/1`
- Public share fixture sweep with ten itineraries and cleanup
- Public share feedback mutation and recipient UI checks
- Public share feedback state Browser checks `21/21`
- Planner handoff `17/17`
- Billing recovery `15/15`
- Trip Studio owner action smoke `23/23`
- Trip Studio recovery `6/6`
- Trip Studio owner/read-only Browser UI `7/7`
- Trip Studio owner feedback readback and Browser UI `6/6` and `11/11`
- Slow-network recovery `5/5`
- Stripe test-mode readiness `11/11`
- Prompt contract suite `56/56`
- Responsive visual QA `50/50`
- Hosted Stripe Checkout Browser QA `15/15`
- Hosted Stripe billing portal Browser QA `16/16`
- Release-candidate Trip Studio fixture cleanup

## Browser Spot Checks

After the gate, the in-app Browser checked:

- `http://localhost:3000/account?tab=billing&qaBillingState=canceling`
  - Adventurer plan present
  - `Cancels soon` present
  - Period-end copy present
  - Manage billing present
  - No application error
  - No horizontal overflow
  - One `main`
- `http://localhost:3000/t/x3m2c8cnws`
  - Athens public share present
  - Day 5 / Central Athens finale content present
  - Feedback/reaction content present
  - Copy/share controls present
  - Start your own trip CTA present
  - No application error
  - No horizontal overflow
  - One `main`

## Evidence

- `qa/release-candidate-full-post-billing-2026-05-21/README.md`
- `qa/release-candidate-full-post-billing-2026-05-21/summary.json`
- `qa/visual-baseline-2026-05-21-full-post-billing-2026-05-21/README.md`
- `qa/visual-baseline-2026-05-21-full-post-billing-2026-05-21/summary.json`
- `qa/stripe-checkout-browser-full-post-billing-2026-05-21/screenshots/`
- `qa/stripe-portal-browser-full-post-billing-2026-05-21/screenshots/`

## Cleanup

The release-candidate Trip Studio fixture was deleted, including generated places, guest profile, and guest auth user. The public share fixture sweep deleted ten generated itineraries and 62 generated places.

