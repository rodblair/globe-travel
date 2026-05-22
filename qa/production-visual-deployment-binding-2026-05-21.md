# Production Visual Deployment Binding

Date: 2026-05-21

## Purpose

Production visual-review history should not count toward public launch unless the reviewed screenshots are tied to the exact production deployment under review. This checkpoint binds visual QA artifacts to `/api/health` deployment metadata and makes visual-review intake reject mismatched commit evidence.

## Changes

- `npm run qa:visual` now records production deployment metadata from `/api/health` for remote visual targets.
- Visual baseline reports now show the deployment commit and deployment URL when available.
- `npm run qa:visual-review-intake` now requires submitted `productionCommit` and `deploymentUrl` to match the visual summary's deployment metadata.

## Verification

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_VISUAL_DATE=2026-05-21 QA_VISUAL_ROUTES=login QA_VISUAL_VIEWPORTS=phone QA_VISUAL_AUTH_MODE=none QA_VISUAL_ARTIFACT_NAME=visual-baseline-production-deployment-metadata-2026-05-21 npm run qa:visual
npm run qa:visual-review-intake
npm run qa:public-launch-status
QA_LAUNCH_EXPECTED_COMMIT=f07fbadc7fdad3c54d23123d2e0e9473609c5dc3 npm run qa:launch-signoff
npm run lint
npm run build
```

Results:

- Focused production visual metadata check: `1/1`
- Captured deployment commit: `f07fbadc7fdad3c54d23123d2e0e9473609c5dc3`
- Captured deployment URL: `globe-travel-o0banpfl9-rodney-blairs-projects.vercel.app`
- Visual-review intake: `4/4`
- Public launch status: `beta-ready-public-blocked`, with no guardrail issues
- Launch signoff: `90/90`
- Lint: passed
- Build: passed

## Fixture Proof

A temporary full-matrix visual-review submission fixture was run outside the repo:

- Matching `productionCommit` and `deploymentUrl`: intake passed with `4/4`.
- Mismatched `productionCommit`: intake failed as expected with `summaryArtifact deployment commit must match productionCommit`.

## Remaining Blockers

This hardens future visual-review imports; it does not complete public launch. Public launch still requires 25 completed beta human reviews and four distinct passing production visual-review history dates.
