# Operations Readiness

Date: 2026-05-17
Status: Passed locally; production verification blocked by Vercel queue

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

- Run `QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops` after deploy.
- Add uptime monitoring against `/api/health`.
- Add alerting thresholds for planner failures, map hydration failures, share feedback failures, checkout failures, and API 5xx spikes.
- Add a rollback checklist tied to failed health or smoke checks.

## Production Deployment Blocker

Production verification is still pending because Vercel has kept the latest production deployments queued. The live alias `https://globe-travel-two.vercel.app/api/health` returned `404`, which proves the live alias has not yet picked up the `/api/health` route.

Queued deployments observed:

- `dpl_HuivHMRirBBS6z92xZCSxAc5kfyR`
- `dpl_9fs6y7qeoftXASoPJVZ5RBjazA84`
- `dpl_8nBNjyTjjXkMviUt8Ebwmwn3tJzH`

Local prebuilt deployment was attempted as a workaround, but `vercel build --prod` failed after the Next.js build with a Vercel CLI packaging error:

```text
ENOENT: no such file or directory, lstat '.next/server/chunks/ssr/[root-of-the-server]__12effdb2._.js'
```

Next action: once Vercel clears the queue or the packaging issue is resolved, deploy the current `main`, then run production `qa:smoke`, `qa:commercial`, `qa:ops`, and `qa:share`.
