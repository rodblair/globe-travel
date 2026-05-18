# Production Site URL Readiness

Date: 2026-05-17
Status: Production health warning resolved

## Scope

This pass advances release operations readiness by resolving the remaining `/api/health` warning for the public site URL.

## Change

Configured Vercel production environment:

```bash
NEXT_PUBLIC_SITE_URL=https://globe-travel-two.vercel.app
```

Then redeployed the latest production commit so the runtime environment includes the value.

## Evidence

Production deployment:

- Deployment id: `dpl_Gi5HXfZL4zCdu7g3CbCryP5FN1F1`
- Deployment URL: `https://globe-travel-m8btd8tnp-rodney-blairs-projects.vercel.app`
- Production alias: `https://globe-travel-two.vercel.app`
- Commit: `fd61f346db3a1c8a60713d3b1c4cbcc527b00177`

Health result:

```json
{
  "status": "ok",
  "environment": "production",
  "criticalMissing": 0,
  "warningMissing": 0,
  "warnings": []
}
```

Command:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_REQUIRE_PRODUCTION_METADATA=1 \
npm run qa:ops
```

Result:

- Passed `2/2`.
- Health endpoint reports operational readiness.
- Production deployment metadata is present.
