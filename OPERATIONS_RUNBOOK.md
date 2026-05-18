# Globe.travel Operations Runbook

Status: active
Owner: release operator

## Purpose

This runbook turns release operations into a repeatable path. Use it for deploys, failed QA gates, production incidents, and rollback decisions.

## Production URLs

- Production alias: `https://globe-travel-two.vercel.app`
- Health endpoint: `https://globe-travel-two.vercel.app/api/health`
- Known public QA share: `https://globe-travel-two.vercel.app/t/x3m2c8cnws`

## Required Release Gates

Run from `client/` before deploy:

```bash
npm run qa:smoke
QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial
npm run qa:ops
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
# or validate several public itinerary links at once:
QA_SHARE_SLUGS=x3m2c8cnws,<next-share-slug> npm run qa:share
QA_TRIP_ID=<owned-trip-id> QA_SHARE_SLUG=x3m2c8cnws npm run qa:studio
QA_PROMPT_SUITE_SHARE_MAP=athens-5-day-couples-rest=x3m2c8cnws QA_PROMPT_SUITE_ACTUALS_OUT=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-actuals
QA_PROMPT_SUITE_ACTUALS=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-suite
npm run lint
npm run build
```

Run from `client/` after deploy:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:smoke
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial
QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
# or:
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUGS=x3m2c8cnws,<next-share-slug> npm run qa:share
QA_BASE_URL=https://globe-travel-two.vercel.app QA_PROMPT_SUITE_SHARE_MAP=athens-5-day-couples-rest=x3m2c8cnws QA_PROMPT_SUITE_ACTUALS_OUT=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-actuals
QA_PROMPT_SUITE_ACTUALS=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-suite
```

## Health Status

`/api/health` should return:

- HTTP `200`
- `status: "ok"`
- `summary.criticalMissing: 0`

Treat HTTP `503`, missing JSON, or any missing critical check as a release blocker.

## Incident Severity

P0:

- Production app unavailable.
- Public share pages unavailable.
- Planner cannot create trips.
- Maps fail for saved/shared itineraries.
- Auth/guest access blocks core use.
- Checkout creates broken or unsafe subscription state.

P1:

- `/api/health` degraded.
- Public feedback submission fails.
- Production smoke, commercial, ops, or share QA fails.
- Trip Studio opens but key actions fail.
- Wrong-country maps appear in generated trips.

P2:

- Non-blocking visual regression.
- Missing optional metadata or analytics.
- Slow but usable route.
- Recoverable copy/share failure.

## First Checks

1. Confirm the failing URL and exact timestamp.
2. Run the matching production QA command.
3. Check `/api/health`.
4. Inspect the latest Vercel deployment status and aliases.
5. Compare the failing deployment with the last known good commit.
6. Record the finding in `RELEASE_READINESS_MEMO.md` or a `qa/` evidence file.

## Rollback Decision

Rollback immediately when:

- A P0 is confirmed.
- A P1 affects new users or public share recipients and no quick fix is ready.
- `/api/health` returns `503` in production because a critical environment value is missing.
- A deploy changes billing, auth, public sharing, or planner behavior and the matching production QA gate fails.

Patch forward when:

- The issue is P2/P3.
- The fix is obvious, low-risk, and can be validated locally and in production within the same release window.

## Rollback Procedure

1. Identify the last known good production deployment in Vercel.
2. Promote the last known good deployment to production.
3. Run all post-deploy QA commands.
4. Confirm `/api/health` is `ok`.
5. Record the rollback deployment id, reason, and verification in `RELEASE_READINESS_MEMO.md`.
6. Create a follow-up fix branch from `main`.

## Monitoring Targets

Add external uptime or scheduled checks for:

- `/api/health`
- `/`
- `/login`
- `/signup`
- `/t/x3m2c8cnws`
- `/api/trips/share/x3m2c8cnws`
- `/api/trips/share/x3m2c8cnws/feedback`

Alert on:

- Any `5xx`
- `/api/health` not `ok`
- public share route not returning trip-specific metadata
- public feedback validation not returning structured JSON
- production smoke failure

## Product-Specific Debug Pointers

Planner:

- Check `OPENAI_API_KEY`.
- Check Supabase read/write configuration.
- Re-run a known prompt from the prompt suite.

Maps:

- Check `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Check Trip Studio day tabs and route/stop counts.
- Re-run Athens five-day map checks.

Public sharing:

- Check `/api/trips/share/[slug]`.
- Check `/api/trips/share/[slug]/feedback`.
- Check Open Graph metadata with `npm run qa:share`.

Billing:

- Check Stripe env values in `/api/health`.
- Run `npm run qa:commercial`.
- Confirm checkout/portal failures return structured JSON when unauthenticated.
