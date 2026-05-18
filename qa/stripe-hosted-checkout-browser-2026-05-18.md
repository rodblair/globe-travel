# Stripe Hosted Checkout Browser QA

Date: 2026-05-18
Surface: hosted Stripe Checkout and Globe.travel billing return URL
Command: `QA_STRIPE_RUN_HOSTED_CHECKOUT=1 npm run qa:stripe-checkout-browser`

## Scope

This pass verifies the hosted checkout user journey with Stripe test mode:

- create a disposable Stripe test customer
- create a subscription checkout session for Adventurer Pro monthly with a 7-day trial
- open hosted Stripe Checkout in Chrome
- fill card details with Stripe's standard test card
- submit checkout
- return to Globe.travel account billing success state
- verify the Stripe checkout session is complete
- verify the subscription is `trialing`
- cancel the test subscription
- delete the test customer

The command is opt-in because it creates and cleans up real Stripe test-mode objects.

## Safety

- Requires `QA_STRIPE_RUN_HOSTED_CHECKOUT=1`.
- Requires a local return URL by default: `http://localhost:3000`.
- Uses a Stripe test secret key only.
- Uses the Stripe test card number `4242 4242 4242 4242`.
- Cancels the created subscription and deletes the test customer at the end of the run.

## Evidence

Result: passed `15/15` checks.

The first return-page iteration exposed an account billing render crash after checkout return. The account page now refreshes subscription state after `upgraded=true` and keeps the primary billing action in a disabled `Checking subscription...` state until the portal/pro state is available, so users do not see an immediate repeat-upgrade CTA while the app reconciles billing.

Screenshots:

- `qa/stripe-checkout-browser-2026-05-18/screenshots/stripe-checkout-loaded.png`
- `qa/stripe-checkout-browser-2026-05-18/screenshots/stripe-checkout-filled.png`
- `qa/stripe-checkout-browser-2026-05-18/screenshots/stripe-checkout-returned.png`

## Release Impact

This closes the hosted checkout Browser-flow gap for Sprint 4 commercial readiness. It complements `npm run qa:stripe-readiness`, which verifies Stripe configuration and API readiness without opening hosted Checkout.
