# Operations Readiness

Date: 2026-05-17
Status: Passed locally and in production

## Scope

This pass supports the Month 6 operations track and makes production readiness monitorable instead of relying only on manual smoke tests.

## Fixes

- Added `/api/health`.
- Added `npm run qa:ops`.
- Added the ops smoke to the release checklist in `PLATFORM_READINESS_ROADMAP.md`.

## Health Endpoint

`/api/health` returns a safe JSON payload with:

- service name
- overall status
- timestamp
- Vercel environment metadata
- configuration checks for:
  - Supabase URL
  - Supabase anon key
  - Supabase service role key
  - Mapbox token
  - OpenAI API key
  - Stripe secret key
  - Stripe publishable key
  - Stripe webhook secret
  - Stripe monthly price ID
  - Stripe yearly price ID
  - public site URL

The endpoint does not expose secret values. Missing critical checks return `503`; otherwise it returns `200`.

## Local Command Evidence

`npm run qa:ops` passed `2/2`:

| Check | Result | Proof |
| --- | --- | --- |
| Health endpoint | Pass | `/api/health` returned `200` with status `ok` and no missing critical checks |
| Deployment metadata | Pass | Not required locally; environment reported as `local` |

Local warning:

- `site_url` is missing locally, but the app has a production metadata fallback and this is not a local release blocker.

## Follow-Up

- Add uptime monitoring against `/api/health`.
- Add alerting thresholds for planner failures, map hydration failures, share feedback failures, checkout failures, and API 5xx spikes.
- Add a rollback checklist tied to failed health or smoke checks.

## Production Deployment Blocker

Production verification was initially blocked because Vercel kept several production deployments queued. The live alias `https://globe-travel-two.vercel.app/api/health` returned `404`, which proved the live alias had not yet picked up the `/api/health` route.

Queued deployments observed:

- `dpl_HuivHMRirBBS6z92xZCSxAc5kfyR`
- `dpl_9fs6y7qeoftXASoPJVZ5RBjazA84`
- `dpl_8nBNjyTjjXkMviUt8Ebwmwn3tJzH`

Local prebuilt deployment was attempted as a workaround, but `vercel build --prod` failed after the Next.js build with a Vercel CLI packaging error:

```text
ENOENT: no such file or directory, lstat '.next/server/chunks/ssr/[root-of-the-server]__12effdb2._.js'
```

Resolution:

- Removed six stale queued deployments with `vercel remove --safe --yes`.
- Vercel then advanced deployment `dpl_ET7i958vfsvgGRis4f4RXQn3NTgx` for commit `2a554034cddba6a0d7dfff37a794297247a8ba62`.
- The deployment became `READY` with 238 outputs.
- The production aliases now point to `globe-travel-22uv0cm02-rodney-blairs-projects.vercel.app`.
- `https://globe-travel-two.vercel.app/api/health` returned `200` with service `globe-travel`, status `ok`, environment `production`, region `iad1`, and zero missing critical checks.

Production command evidence:

| Command | Result | Notes |
| --- | --- | --- |
| `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:smoke` | Pass 8/8 | Public share smoke now checks server-rendered metadata while `qa:share` checks full content |
| `QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops` | Pass 2/2 | Production metadata present; `site_url` remains a warning only |
| `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial` | Pass 4/4 | Pricing redirect and unauthenticated billing failures are safe |
| `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` | Pass 4/4 | Athens five-day public itinerary has all days mapped in Greece with usable routes |
