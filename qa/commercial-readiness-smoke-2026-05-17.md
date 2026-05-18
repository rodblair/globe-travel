# Commercial Readiness Smoke

Date: 2026-05-17
Target: `http://localhost:3000`
Status: Passed locally

## Scope

This pass moves the platform-readiness work beyond route rendering into billing and monetization safety.

Checks added:

- `npm run qa:commercial`
- Pricing redirect lands on the real billing surface: `/account?tab=billing`
- Checkout endpoint returns a JSON error when unauthenticated or unconfigured
- Billing portal endpoint returns a JSON error when unauthenticated or unconfigured
- Optional public-feedback validation check when `QA_SHARE_SLUG` is provided

## Fixes

- Checkout success URL now returns to `/account?tab=billing&upgraded=true`.
- Checkout cancellation now returns to `/account?tab=billing&checkout=cancelled`.
- Billing portal return URL now returns to `/account?tab=billing`.
- Billing portal route now handles missing Stripe configuration with a JSON `503` response instead of throwing before a structured response.
- Billing client helpers now handle non-JSON billing failures with recoverable user-facing error messages.
- Package metadata was renamed from stale `arcki` to `globe-travel`, removing stale brand leakage from QA command output.

## Local Command Evidence

`npm run qa:commercial` passed. `QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial` also passed with the optional public-feedback validation check.

| Check | Result | Proof |
| --- | --- | --- |
| Pricing redirect | Pass | `/pricing` resolves to `/account?tab=billing` for an active local guest session, or protected `/login` when unauthenticated in production |
| Checkout safe failure | Pass | `401 Unauthorized` JSON response when unauthenticated |
| Billing portal safe failure | Pass | `401 Unauthorized` JSON response when unauthenticated |
| Public feedback validation | Pass | Invalid payload returns `400 Invalid feedback` JSON response |

## Browser Evidence

Browser checked `/account?tab=billing`, `/pricing`, `/login`, and `/signup` at:

- 390 x 844
- 1280 x 800

Results:

- No document-level overflow.
- No missing labels on app-owned controls.
- No stale brand copy.
- No visible application error text.
- Billing CTA and plan comparison render on the billing tab.
- `/pricing` resolves to the same billing surface.

## Follow-Up

- Run `QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:commercial` after deploy.
- Add an authenticated Stripe test-mode walkthrough once production test keys and test Price IDs are confirmed.
- Add explicit UI copy for `checkout=cancelled` and `upgraded=true` states if those query params become part of the visible post-checkout journey.
