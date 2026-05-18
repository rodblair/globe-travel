# Production Release Rehearsal

Date: 2026-05-18
Production URL: `https://globe-travel-two.vercel.app`
Stable share slug: `x3m2c8cnws`
Deployment: `dpl_67z9WNZWz4wuRNk9soZpTmp1PGcb`
Commit: `e70b4a2`
Status: production release rehearsal passed after deployment

## Purpose

This rehearsal checks the live production app against the release-runbook gates after the local social-preview work. The first pass proved production was healthy but did not yet include the share-card endpoint. After commit `e70b4a2` deployed as `dpl_67z9WNZWz4wuRNk9soZpTmp1PGcb`, the production gates were re-run and the social-preview gate passed.

## Production Gates

### Operations

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops
```

Initial result: passed `3/3`.
Post-deploy result: passed `3/3`.

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

Initial result: passed `8/8`.
Post-deploy result: passed `8/8`.

Evidence:

- Landing, auth, protected-route redirects, account redirects, and Athens public share route passed.
- Protected production routes redirected to `/login` as expected.

### Commercial

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial
```

Initial result: passed `4/4`.
Post-deploy result: passed `4/4`.

Evidence:

- Pricing resolves to login/account billing path.
- Stripe checkout fails safely with `401` when unauthenticated.
- Stripe portal fails safely with `401` when unauthenticated.
- Invalid public feedback fails safely with `400`.

### Public Share

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
```

Initial result before deploy: failed `3/5`.
Post-deploy result: passed `5/5`.

What passed:

- Public trip API returns the Athens five-day itinerary.
- Every public itinerary day has mapped stops, a single country, and at least one usable route.
- Public feedback API returns an array.

What failed before deploy:

- Production public page is missing the new social image metadata:
  - `og:image`
  - `og:image:width`
  - `og:image:height`
  - `twitter:image`
- Production `/api/share-card/x3m2c8cnws` returns `404` with `content-type: text/html; charset=utf-8`.

Post-deploy evidence:

- Public page emits the new share metadata.
- `/api/share-card/x3m2c8cnws` returns `200`.
- Share card `content-type`: `image/png`.
- Share card byte length: `81579`.

Interpretation: the live app is healthy and production now includes the social-preview release-candidate changes.

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
- Before deploy, `og:image`, image dimensions, and `twitter:image` were missing.
- After deploy, `og:image` is `https://globe-travel-two.vercel.app/api/share-card/x3m2c8cnws`.
- After deploy, `og:image:width` is `1200`.
- After deploy, `og:image:height` is `630`.
- After deploy, `twitter:image` is `https://globe-travel-two.vercel.app/api/share-card/x3m2c8cnws`.

## Release Decision

Production now carries the completed social-preview work for the stable Athens public share.

Next release action:

1. Continue the broader platform-readiness goal with the remaining Month 1/2 release-candidate scope.
2. Run the fuller release-candidate matrix before a larger public launch decision:
   - accessibility gate
   - visual-diff gate
   - Trip Studio owner fixture gate
   - prompt actuals gate
   - production share feedback gate where safe
3. Keep this deployment as the current production baseline unless a later gate finds a P0/P1 regression.

## Current Risk

Severity after deploy: no open P1 for the stable Athens social-preview path.

Remaining risk: this proves the stable Athens public-share social preview in production. Broader launch readiness still needs continued multi-itinerary production/preview coverage, fuller visual regression scheduling, subscription-state evidence, and the larger release-candidate matrix.
