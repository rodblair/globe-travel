# Billing Subscription State Hardening

Date: 2026-05-18
Surface: `/account?tab=billing`
User type: signed-in local/dev account

## Scope

This pass hardens the paid-product account surface for subscription states that matter before launch:

- free
- trialing
- past due
- canceled
- checkout unavailable
- billing portal unavailable
- checkout cancel return
- checkout success return

## Fixes

- Trialing subscriptions now count as Adventurer access in the client hook.
- Subscription API responses preserve the stored plan even when the status is not currently entitled, so account UI can explain past-due and canceled Adventurer states instead of flattening them into generic Explorer copy.
- Account billing now has development-only QA state overrides with `qaBillingState=free|active|trialing|past_due|canceled`.
- Past-due and canceled billing states now show explicit recovery copy and a billing-management action when a Stripe customer exists.
- The plan comparison layout now stacks Explorer/Adventurer values inside compact cells, preventing cramped label overlap in the account sidebar.

## Automated Evidence

```bash
npm run qa:billing-recovery
```

Result: passed `9/9`.

Covered:

- billing surface visible
- trialing subscription is shown as Adventurer access
- past-due subscription prompts billing recovery
- canceled subscription state is explicit and recoverable
- checkout failure recovery visible
- billing portal failure recovery visible
- checkout canceled notice visible
- checkout success return notice visible
- no horizontal overflow

```bash
QA_VISUAL_RUN_ID=billing-commercial-state QA_VISUAL_ARTIFACT_NAME=visual-baseline-billing-commercial-state QA_VISUAL_ROUTES=account-billing QA_VISUAL_VIEWPORTS=tablet,laptop,desktop QA_VISUAL_SETTLE_MS=1200 npm run qa:visual
```

Result: passed `3/3`.

Artifact: `qa/visual-baseline-billing-commercial-state/README.md`

## Browser Evidence

In-app Browser loaded:

```text
http://localhost:3000/account?tab=billing&qaBillingState=past_due
```

Result:

- Adventurer state was visible.
- Payment-needs-attention state was visible.
- Update billing and Manage billing actions were visible.
- No horizontal overflow.
- No visible app errors.

Screenshot: `qa/billing-past-due-browser-recovery-2026-05-18.png`

## Remaining Risk

This pass proves UI state handling and safe failure recovery. Full Stripe test-mode checkout and customer-portal redirects still require valid Stripe test credentials and should remain in Sprint 4.
