# Launch Signoff Rollback Current Deployment

Date: 2026-05-21

## Issue

`qa/launch-rollback-plan.json` still pointed at deployment commit `8b7ac260d47633237985f1756e7318dc15216b0f` even though production was live and healthy on `b817921cdea00e8c2c7c9e2aec5d34e514d9ccdb`. `npm run qa:launch-signoff` passed because it only checked that a known-good deployment existed, not that the rollback plan tracked the current verified production deployment.

## Fix

- `npm run qa:launch-signoff` now passes live `/api/health` deployment metadata into the rollback-plan audit.
- Launch signoff now fails unless `knownGoodDeployment.commit` and `knownGoodDeployment.url` match the live production deployment.
- Launch signoff also requires `knownGoodDeployment.verifiedBy` to include the live commit and `npm run qa:launch-signoff`.
- Updated `qa/launch-rollback-plan.json` to current production commit `7ec3872e16a2aacbb3d22935fb562482e2a5af4a` and deployment `globe-travel-1yuz317s4-rodney-blairs-projects.vercel.app`.

## Verification

Exact-commit launch signoff:

```bash
QA_LAUNCH_EXPECTED_COMMIT=7ec3872e16a2aacbb3d22935fb562482e2a5af4a npm run qa:launch-signoff
```

Result: `34/34` passed.

- Production deployment matches expected commit: pass
- Launch rollback plan tracks current known-good production deployment: pass
- Commit match: true
- URL match: true
- `verifiedBy` includes commit: true
- `verifiedBy` includes launch signoff command: true

Stale rollback-plan negative test:

```bash
QA_LAUNCH_ROLLBACK_PLAN=/tmp/globe-stale-rollback-XXXXXX.json npm run qa:launch-signoff
```

Result: exited `1` as expected.

- Failed check: `launch rollback plan tracks current known-good production deployment`
- Commit match: false
- URL match: false
- `verifiedBy` includes commit: false

## Result

Launch signoff now prevents release meetings from relying on a rollback plan that has drifted away from the production deployment that was actually verified as healthy.
