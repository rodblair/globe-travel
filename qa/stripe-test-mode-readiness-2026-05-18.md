# Stripe Test-Mode Readiness

Date: 2026-05-18
Surface: paid product / account billing
Command: `npm run qa:stripe-readiness`

## Scope

This pass adds repeatable Stripe readiness evidence for Sprint 4 commercial hardening.

The new gate verifies:

- `STRIPE_SECRET_KEY` exists and is a test-mode key.
- `STRIPE_PRO_MONTHLY_PRICE_ID` resolves to an active monthly test price.
- `STRIPE_PRO_YEARLY_PRICE_ID` resolves to an active yearly test price.
- `STRIPE_WEBHOOK_SECRET` has the expected format.
- Local webhook signature construction and verification works.
- Stripe Billing Portal has an active test configuration.

The opt-in mutation mode verifies:

- A Stripe test customer can be created.
- A subscription checkout session can be created with the monthly price and 7-day trial.
- A billing portal session can be created for the test customer.
- The checkout session can be expired.
- The test customer can be deleted.

## Commands

Read-only:

```bash
npm run qa:stripe-readiness
```

Full test-mode session smoke:

```bash
QA_STRIPE_CREATE_TEST_SESSIONS=1 npm run qa:stripe-readiness
```

## Evidence

Read-only result:

- Checked: `11`
- Passed: `11`
- Failed: `0`
- Monthly price: `price_1TFk5QBRw4RlC8sbDrUNiRNV`, `usd`, `month`, `499`
- Yearly price: `price_1TFk5bBRw4RlC8sbqanEneZO`, `usd`, `year`, `4900`
- Billing portal configuration: `bpc_1TFhVEBRw4RlC8sbI7dXN3nd`

Full test-mode session smoke result:

- Checked: `15`
- Passed: `15`
- Failed: `0`
- Test customer created and deleted.
- Test subscription checkout session created and expired.
- Test billing portal session created.

The command intentionally masks configured secrets in output and only prints Stripe object ids, modes, intervals, amounts, and cleanup status.

## Release Impact

This closes the Sprint 4 gap for Stripe test-mode evidence at the integration level. Browser-level payment entry with a Stripe test card is still a later, explicit end-to-end checkout run because it requires intentionally opening the hosted Stripe Checkout page and entering test payment data.
