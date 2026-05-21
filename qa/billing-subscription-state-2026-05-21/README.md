# Billing Subscription State QA

Date: 2026-05-21
Surface: Account billing and subscription recovery

## Goal

Close the remaining Month 5 paid-path clarity issue: an Adventurer subscription that is scheduled to cancel at the period end must still read as paid access, not as an ambiguous active/free state.

## Change

- Added a development-only `qaBillingState=canceling` account billing state.
- Account billing now renders cancel-at-period-end subscriptions as `Cancels soon`.
- The billing summary now explains that Adventurer access remains active until the current period ends.
- The account billing status pill now uses readable sentence-case product copy instead of all-caps telemetry-style text.
- `npm run qa:billing-recovery` now covers free, active, trialing, canceling, past-due, canceled, checkout failure, portal failure, checkout return/cancel, and the saved-journal upgrade dialog.

## Browser Verification

In-app Browser opened `http://localhost:3000/account?tab=billing&qaBillingState=canceling` and verified:

- `Adventurer`
- `Your Adventurer plan stays active until the current period ends.`
- `Cancels soon`
- `Current period ends`
- `Manage billing`
- No application error
- No horizontal overflow at the active Browser viewport
- One page-level `main` landmark

Screenshot:

- `qa/billing-subscription-state-2026-05-21/screenshots/account-billing-canceling-local-1103x-view.png`

## Automated Verification

- `node --check scripts/platform-billing-recovery-smoke.mjs` passed.
- `npm run qa:billing-recovery` passed `15/15`.

