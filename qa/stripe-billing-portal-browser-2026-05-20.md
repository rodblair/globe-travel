# Stripe Billing Portal Browser QA

Date: 2026-05-20
Surface: hosted Stripe billing portal and Globe.travel billing return
Risk class: Month 5 paid path and subscription operations

## Why This Matters

Checkout completion was already covered, and billing failure recovery was already covered. The remaining paid-path gap was the successful hosted customer portal path: a real test customer with a trialing subscription should be able to open Stripe's billing portal, see subscription management, and return to Globe.travel without a broken account/billing state.

## Code Added

- Added `npm run qa:stripe-portal-browser`.
- Added `scripts/platform-stripe-portal-browser.mjs`.
- Added `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` support to the local release-candidate gate.

The new QA script:

- Requires explicit `QA_STRIPE_RUN_PORTAL_BROWSER=1`.
- Requires a local return URL so it does not mutate or depend on production app state.
- Uses Stripe test-mode credentials.
- Creates a disposable Stripe test customer.
- Creates a disposable trialing subscription on the monthly Adventurer Pro price.
- Creates a Stripe hosted billing portal session.
- Opens the portal in Chrome.
- Verifies the hosted portal renders subscription-management content.
- Verifies the portal exposes a return link to Globe.travel.
- Returns to `/account?tab=billing`.
- Verifies no app error and no horizontal overflow after return.
- Cancels the subscription and deletes the customer.

## Focused Command

```bash
QA_STRIPE_RUN_PORTAL_BROWSER=1 \
QA_STRIPE_PORTAL_ARTIFACT_NAME=stripe-portal-browser-2026-05-20 \
npm run qa:stripe-portal-browser
```

Result: passed `16/16`.

Important checks:

- Stripe secret key was test mode.
- Monthly Stripe price was active, test-mode, monthly, and `$4.99`.
- Stripe billing portal had an active test configuration.
- Test customer creation passed.
- Trial subscription creation passed with `status: trialing`.
- Hosted billing portal session creation passed.
- Portal rendered `Manage your Globe Travel subscription`, `Adventurer Pro`, free-trial timing, subscription actions, billing information, and invoice history.
- Portal return reached Globe.travel billing without layout failure.
- Subscription cleanup passed.
- Customer cleanup passed.

## Integrated Release-Candidate Command

```bash
QA_RELEASE_ARTIFACT_NAME=release-candidate-stripe-portal-2026-05-20 \
QA_RELEASE_INCLUDE_VISUAL=0 \
QA_RELEASE_INCLUDE_STUDIO=0 \
QA_RELEASE_INCLUDE_SHARE_FEEDBACK=0 \
QA_RELEASE_INCLUDE_OWNER_FEEDBACK=0 \
QA_RELEASE_INCLUDE_SLOW_NETWORK=0 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
QA_RELEASE_INCLUDE_STRIPE_PORTAL=1 \
QA_STRIPE_PORTAL_ARTIFACT_NAME=stripe-portal-browser-2026-05-20-release-candidate \
npm run qa:release-candidate
```

Result: passed `17/17`.

Included:

- `npm run lint`
- `npm run build`
- local ops `3/3`
- geocode quality `26/26`
- local smoke `8/8`
- auth/guest `15/15`
- saved/account `13/13`
- commercial `4/4`
- accessibility/keyboard `16/16`
- public share `5/5`
- public share recovery `4/4`
- public share viral loop `5/5`
- public share map fallback `1/1`
- planner handoff `17/17`
- billing recovery `13/13`
- Stripe readiness `11/11`
- hosted Stripe billing portal browser QA `16/16`

Artifacts:

- `qa/release-candidate-stripe-portal-2026-05-20/`
- `qa/stripe-portal-browser-2026-05-20-release-candidate/screenshots/stripe-portal-loaded.png`
- `qa/stripe-portal-browser-2026-05-20-release-candidate/screenshots/stripe-portal-returned.png`

## In-App Browser Check

Codex in-app Browser opened:

```text
http://localhost:3000/account?tab=billing&qaStripePortal=returned
```

Observed after hydration:

- `Plan and billing` visible.
- `Plan comparison` visible.
- `Start free trial` visible.
- no app error.
- no horizontal overflow.
- route remained on account billing with the portal-return query.

## Release Decision

The paid-path readiness bar is stronger: Globe.travel now has repeatable evidence for hosted checkout completion, hosted billing portal access, billing failure recovery, subscription-state copy, and safe return to the account billing surface.
