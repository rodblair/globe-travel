# Launch Rollback Signoff Gate

Date: 2026-05-21

## Scope

Close the rollback-readiness gap where the operations runbook described rollback, but launch signoff did not prove a current, actionable rollback plan existed.

## Change

- Added `qa/launch-rollback-plan.json`.
- Added `QA_LAUNCH_ROLLBACK_PLAN` support to `npm run qa:launch-signoff`.
- Launch signoff now checks that the rollback plan is fresh, points to the production alias and health endpoint, identifies a known-good deployment, includes post-rollback production verification commands, and has actionable restore steps.

## Verification

```bash
node --check scripts/platform-launch-signoff.mjs
npm run qa:launch-signoff
node -e "JSON.parse(require('fs').readFileSync('../qa/launch-rollback-plan.json','utf8')); console.log('rollback plan json ok')"
npm run lint
npm run build
git diff --check
```

Results:

- Launch signoff: `26/26`
- Rollback plan freshness: pass, `2026-05-21`
- Production target identification: pass
- Post-rollback verification commands: pass
- Actionable restore steps: pass
- Lint: pass
- Build: pass
- Diff whitespace check: pass

## Negative Check

A temporary rollback plan missing `npm run qa:launch-signoff` from its post-rollback verification commands was passed through `QA_LAUNCH_ROLLBACK_PLAN=<tempfile> npm run qa:launch-signoff`.

Result: the command exited nonzero and reported `launch rollback plan includes post-rollback verification commands`, proving signoff blocks incomplete rollback plans.
