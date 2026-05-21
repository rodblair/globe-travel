# Vercel Workflow-Only Build Skip

Date: 2026-05-21
Surface: Release operations and production deployment hygiene

## Goal

Prevent GitHub Actions workflow-only commits from creating Vercel production deployments. Workflow files affect scheduled monitoring and release automation, but they do not change the runtime application served by Vercel.

## Issue

The Vercel ignore script already skipped QA evidence and release memo commits, but treated `.github/workflows/**` as runtime-relevant. That caused the production release workflow artifact-hardening commit to deploy the app even though the application bundle was unchanged.

## Change

`client/scripts/vercel-ignore-build.mjs` now treats `.github/workflows/**` as safe for Vercel build skipping, alongside existing QA evidence and release documentation paths.

The policy remains conservative:

- workflow-only, QA evidence, and release-documentation commits can skip Vercel builds
- any `client/**`, package/config, application runtime, or unknown path still continues the Vercel build

## Verification

Syntax and config checks:

- `node --check scripts/vercel-ignore-build.mjs` passed.
- `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"` passed.
- `git diff --check` passed.

Dry-run against the previous release-workflow-only commit:

```bash
VERCEL_GIT_PREVIOUS_SHA=6ed5e0e \
VERCEL_GIT_COMMIT_SHA=6cc678c \
node scripts/vercel-ignore-build.mjs
```

Result:

```text
[vercel-ignore] Skipping build: 5 release-ops/documentation/evidence file(s) changed.
exit=0
```

Dry-run against the known billing runtime commit:

```bash
VERCEL_GIT_PREVIOUS_SHA=0bf1e74 \
VERCEL_GIT_COMMIT_SHA=ec53a97 \
node scripts/vercel-ignore-build.mjs
```

Result:

```text
[vercel-ignore] Continuing build: runtime-relevant change(s) detected: client/app/(app)/account/page.tsx, client/scripts/platform-billing-recovery-smoke.mjs
exit=1
```

Application checks:

- `npm run lint` passed.
- `npm run build` passed.

Production public-share smoke checks:

- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed `5/5`.
- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral` passed `5/5`.
- The Athens public itinerary still has five days with mapped stops, no duplicate mapped stops, usable routes, share metadata, a rendered share-card image, visible phone/desktop viral affordances, copy success feedback, native share payload coverage, no app error, and no horizontal overflow.

In-app Browser note: the Browser plugin listed the in-app browser but the active pane was unavailable in this resumed context, so the spot-check used the repo's Browser-backed Playwright smokes instead of a direct pane interaction.

## Postdeploy Verification

This ignore-script update deployed to Vercel production because it changed `client/scripts/vercel-ignore-build.mjs`, which is intentionally treated as build-relevant.

Deployed commit:

```text
06eb269ac896ccb4204607ae4e2348079f393309
```

Production health stayed green during and after deployment:

- Status: `ok`
- Checks: `11/11`
- Critical missing: `0`
- Warning missing: `0`
- Deployment URL: `globe-travel-maensxd9o-rodney-blairs-projects.vercel.app`

Postdeploy production gate:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_INCLUDE_PRODUCTION_VISUAL=0 \
npm run qa:release-production
```

Result:

- Overall production gate: `9/9`
- Production ops: `3/3`
- Route smoke: `8/8`
- Trip Studio recovery UI: `1/1`
- Auth and guest access: `13/13`
- Commercial fail-safe checks: `4/4`
- Athens public share and map integrity: `5/5`
- Public share viral loop: `5/5`
- Prompt suite with production actuals: `56/56`

Decision: green. The release-ops change is deployed, and future `.github/workflows/**`-only commits are covered by the skip-safe policy without weakening runtime-change deployments.
