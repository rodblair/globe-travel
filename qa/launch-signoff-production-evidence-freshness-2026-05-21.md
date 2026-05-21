# Launch Signoff Production Evidence Freshness

Date: 2026-05-21

## Goal

Close the release-signoff gap where postdeploy production evidence could be old but still satisfy the launch audit as long as it contained the right health and production-gate markers.

## Fix

- Added a freshness check for `QA_LAUNCH_PRODUCTION_EVIDENCE` inside `npm run qa:launch-signoff`.
- Human evidence notes can provide an explicit `Date: YYYY-MM-DD`.
- Structured logs can provide a JSON `checkedAt`.
- Generated CI logs such as `qa-ci/production-release-gate.log` can omit an embedded date and still pass by using the file mtime, because the workflow captures the log immediately before launch signoff.
- The production evidence check still requires all three operational markers:
  - Vercel production deploy evidence.
  - Production health `11/11`.
  - Production release gate `9/9`.

## Verification

- `node --check scripts/platform-launch-signoff.mjs`: pass
- `npm run qa:launch-signoff`: pass, `27/27`
- Stale production evidence negative test with `Date: 2026-04-01`: failed as expected with `postdeploy production release evidence is fresh` false.
- Date-less generated-log style evidence test: passed via current file mtime with `postdeploy production release evidence is fresh` true.
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass

## Result

Launch signoff now proves the postdeploy production evidence is both present and current. This keeps release meetings from accidentally approving a launch packet backed by stale production logs, while preserving the scheduled GitHub Actions flow that feeds a freshly generated production release log into signoff.
