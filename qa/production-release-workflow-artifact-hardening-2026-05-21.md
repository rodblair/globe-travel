# Production Release Workflow Artifact Hardening

Date: 2026-05-21
Surface: Production release monitoring

## Goal

Make the scheduled and manually dispatched production release workflow operationally reliable when visual QA is intentionally disabled for infrastructure isolation.

## Issue

`.github/workflows/production-release-gate.yml` uploaded the release log and the production visual artifact directory in one required artifact step.

That meant a manual workflow run with `include_production_visual=0` could pass `npm run qa:release-production`, skip visual artifact creation correctly, and still fail afterward because the required upload path included a visual directory that did not exist.

## Fix

The workflow now uploads:

- the release gate log as a required artifact on every run
- the visual artifact directory in a separate required upload step only when `QA_INCLUDE_PRODUCTION_VISUAL != '0'`

Scheduled runs keep visual QA enabled by default and still require the visual artifact.

## Verification

- Workflow YAML parsed successfully.
- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_INCLUDE_PRODUCTION_VISUAL=0 npm run qa:release-production` passed `9/9`, proving the command path succeeds without creating a visual artifact.
- `node --check scripts/platform-production-release-smoke.mjs` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.
- In-app Browser spot-checked the live Athens public share: title/content loaded, map canvas rendered, `Start your own trip` was visible, no app error appeared, horizontal overflow was `0`, and the page had one `main` landmark.

## Release Impact

The production release gate can now be used as a trustworthy investigation tool. Operators can temporarily disable the visual runner without converting a successful nonvisual release check into a false workflow failure at the artifact upload step.

## Postdeploy Verification

The workflow hardening commit deployed to Vercel production as:

```text
6cc678cc1ba8838890863cc1363b8528ba57d8e7
```

Production health reported:

- Status: `ok`
- Checks: `11/11`
- Critical missing: `0`
- Warning missing: `0`
- Deployment URL: `globe-travel-cwkr5teo1-rodney-blairs-projects.vercel.app`

Full non-mutating production release gate after deploy:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-workflow-artifact-2026-05-21-6cc678c \
npm run qa:release-production
```

Result:

- Overall production gate: `10/10`
- Production visual QA: `20/20`
- Public share viral loop: `5/5`
- Prompt suite with production actuals: `56/56`
- Athens public itinerary/map integrity: all five days had mapped stops, no duplicate mapped stops, and usable routes.
- Visual artifact: `qa/visual-baseline-production-workflow-artifact-2026-05-21-6cc678c/`
