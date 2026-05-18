# Ops Monitoring Contract

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Endpoint: `/api/health`

## Purpose

Strengthen the production monitoring gate so release checks prove more than "the endpoint returned JSON." The health contract now verifies cache behavior, timestamp shape, deployment metadata expectations, and the expected operational check roster.

## Automated Gate

Command:

```bash
npm run qa:ops
```

Result:

```json
{
  "checked": 3,
  "passed": 3,
  "failed": 0
}
```

Verified:

- Health endpoint reports operational readiness.
- Critical dependencies are configured.
- Health endpoint uses `Cache-Control: no-store`.
- `checkedAt` is present and parseable.
- The expected operational check names are present.
- Deployment metadata check is present; production metadata is only required when `QA_REQUIRE_PRODUCTION_METADATA=1`.

## Local Warning

`site_url` is currently a warning-level missing value in the local environment. It does not fail local readiness, but production release candidates should set `NEXT_PUBLIC_SITE_URL` and run:

```bash
QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops
```
