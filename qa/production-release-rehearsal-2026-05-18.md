# Production Release Rehearsal

Date: 2026-05-18
Production URL: `https://globe-travel-two.vercel.app`
Stable share slug: `x3m2c8cnws`
Status: production healthy, current local social-preview batch not deployed

## Purpose

This rehearsal checks the live production app against the release-runbook gates after the local social-preview work. The goal is to separate production health from release-candidate readiness.

## Production Gates

### Operations

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops
```

Result: passed `3/3`.

Evidence:

- `/api/health` returned `200`.
- `healthStatus`: `ok`.
- `criticalMissing`: `[]`.
- `warningMissing`: `[]`.
- No-store health contract present.
- Production deployment metadata present.

### Smoke

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:smoke
```

Result: passed `8/8`.

Evidence:

- Landing, auth, protected-route redirects, account redirects, and Athens public share route passed.
- Protected production routes redirected to `/login` as expected.

### Commercial

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial
```

Result: passed `4/4`.

Evidence:

- Pricing resolves to login/account billing path.
- Stripe checkout fails safely with `401` when unauthenticated.
- Stripe portal fails safely with `401` when unauthenticated.
- Invalid public feedback fails safely with `400`.

### Public Share

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
```

Result: failed `3/5`.

What passed:

- Public trip API returns the Athens five-day itinerary.
- Every public itinerary day has mapped stops, a single country, and at least one usable route.
- Public feedback API returns an array.

What failed:

- Production public page is missing the new social image metadata:
  - `og:image`
  - `og:image:width`
  - `og:image:height`
  - `twitter:image`
- Production `/api/share-card/x3m2c8cnws` returns `404` with `content-type: text/html; charset=utf-8`.

Interpretation: the live app is healthy, but production does not yet include the local social-preview release-candidate changes.

## Browser Evidence

Browser checked:

```text
https://globe-travel-two.vercel.app/t/x3m2c8cnws
```

Observed:

- Page title: `5 Days in Athens Greece in mid september | Globe.travel`
- Athens public share title visible.
- `Start your own trip` CTA visible.
- No horizontal overflow at the active Browser viewport.
- `og:image`: missing.
- `og:image:width`: missing.
- `og:image:height`: missing.
- `twitter:image`: missing.

## Release Decision

Do not treat the current production alias as carrying the completed social-preview work.

Next release action:

1. Commit the verified local release-candidate batch when the owner is ready.
2. Push and deploy to Vercel.
3. Re-run production:
   - `QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops`
   - `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:smoke`
   - `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial`
   - `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share`
4. Production release rehearsal passes only when `qa:share` returns `5/5` and the share-card image returns `image/png`.

## Current Risk

Severity: P1 for viral sharing readiness, not a production availability outage.

Reason: the public share page itself is live and mapped, but social apps will not receive the intended rich image card until the local share-card endpoint and metadata are deployed.
