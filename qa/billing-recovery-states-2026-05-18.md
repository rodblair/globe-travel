# Billing Recovery States

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Route: `/account?tab=billing`

## Purpose

Verify that subscription and billing entry points fail safely before launch. A profitable app cannot leave users stranded during checkout, portal access, or Stripe return states.

## Fixes Covered

- Billing checkout and portal actions now have deterministic development QA failure flags:
  - `?qaCheckoutFailure=1`
  - `?qaPortalFailure=1`
- Checkout failure now leaves the user on the billing page with a clear recovery message and `Try again` action.
- Checkout cancelled return state shows: `Checkout was cancelled. Your current plan is unchanged.`
- Checkout success return state shows: `Checkout returned successfully. We are refreshing your subscription status.`
- Profile save now catches failed updates and keeps the user on the page with a visible recovery message.

## Automated Recovery Gate

Command:

```bash
npm run qa:billing-recovery
```

Result:

```json
{
  "checked": 5,
  "passed": 5,
  "failed": 0
}
```

Verified:

- Billing surface visible.
- Forced checkout failure recovery visible.
- Checkout cancelled notice visible.
- Checkout return notice visible.
- No horizontal overflow at `1280px`.

## Focused Visual Gate

Command:

```bash
QA_VISUAL_RUN_ID=billing-recovery QA_VISUAL_ROUTES=account-billing QA_VISUAL_PROGRESS=1 QA_VISUAL_SETTLE_MS=1200 npm run qa:visual
```

Result:

- Checked: `5`
- Passed: `5`
- Failed: `0`
- Artifact: `qa/visual-baseline-2026-05-18-billing-recovery/README.md`

## Browser Evidence

The in-app Browser loaded `/account?tab=billing&qaCheckoutFailure=1`, showed `Plan and billing`, `Plan comparison`, and `Start free trial`, and reported no horizontal overflow. The in-app Browser click bridge timed out on the CTA in this session, so the durable Chrome-backed `qa:billing-recovery` gate above is the repeatable interaction proof for the checkout failure state.
