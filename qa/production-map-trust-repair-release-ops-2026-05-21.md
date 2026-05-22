# Production Map-Trust Repair Release-Ops Evidence

Date: 2026-05-21
Production alias: https://globe-travel-two.vercel.app
Verified deployment: globe-travel-2e5vpe3pc-rodney-blairs-projects.vercel.app
Verified commit: 625cdd4fb252c96f99032f062bac8d31c6508a21

## Finding

After the generated-itinerary map-trust repair was deployed, production health was green, but release operations evidence was stale. `npm run qa:public-launch-status` reported guardrail issues because production monitoring and rollback evidence still pointed at the earlier `f07fbad` deployment. A fresh production release gate also exposed two timing-sensitive QA harness failures:

- Trip Studio missing-trip recovery could capture before the client-rendered recovery panel appeared.
- Production public-share visual QA could screenshot the Athens share skeleton at laptop width before the `Friend feedback` section loaded.

The visible production UI itself recovered correctly when inspected with Playwright: the missing-trip page rendered `We could not open this trip.`, `Go to saved trips`, and `Plan a new trip` with no horizontal overflow.

## Fix

- `client/scripts/platform-trip-studio-recovery-ui-smoke.mjs` now uses a longer production render timeout, retries the rendered route, and includes a visible text excerpt when markers are missing.
- `client/scripts/platform-visual-baseline.mjs` now uses a production marker timeout and retries dynamic rendered pages before taking screenshots.
- `qa/production-monitoring-register.json` now records the production release verification for commit `625cdd4fb252c96f99032f062bac8d31c6508a21`.
- `qa/launch-rollback-plan.json` now treats deployment `globe-travel-2e5vpe3pc-rodney-blairs-projects.vercel.app` as the current verified known-good production target.

## Verification

- `QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:studio-recovery-ui` passed `1/1`.
- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_ARTIFACT_NAME=visual-baseline-production-public-share-laptop-retry-2026-05-21-625cdd4 QA_VISUAL_BASELINE_DIR=qa/visual-baseline-production-2026-05-18 QA_VISUAL_ROUTES=public-share QA_VISUAL_VIEWPORTS=laptop QA_VISUAL_DIFF_ROUTES=landing,login,signup npm run qa:visual` passed `1/1`.
- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-map-trust-repair-2026-05-21-625cdd4 npm run qa:release-production` passed `10/10`.
- Production visual QA passed `20/20` in `qa/visual-baseline-production-map-trust-repair-2026-05-21-625cdd4/`.
- Production prompt-suite validation passed `60/60` with the Athens production actual.
