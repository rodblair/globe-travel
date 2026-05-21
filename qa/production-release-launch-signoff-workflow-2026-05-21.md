# Production Release Launch Signoff Workflow

Date: 2026-05-21

## Scope

Close the release-operations gap where the scheduled production release workflow ran production checks but did not also prove that the launch signoff packet remained valid.

## Change

- Added `include_launch_signoff` to `.github/workflows/production-release-gate.yml`.
- Scheduled and manual production release workflow runs now execute `npm run qa:launch-signoff` after `npm run qa:release-production` by default.
- The signoff step uses the freshly captured `qa-ci/production-release-gate.log` as its production evidence source.
- `client/scripts/platform-launch-signoff.mjs` now accepts both human-readable evidence notes and production release gate logs as valid production evidence.

## Verification

```bash
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/production-release-gate.yml"); puts "workflow yaml ok"'
node --check scripts/platform-launch-signoff.mjs
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_INCLUDE_PRODUCTION_VISUAL=0 npm run qa:release-production
QA_LAUNCH_PRODUCTION_EVIDENCE=qa-ci/production-release-gate.log npm run qa:launch-signoff
npm run lint
npm run build
git diff --check
```

Results:

- Workflow YAML parse: pass
- Production release gate: `9/9`
- Launch signoff using production release log evidence: `15/15`
- Production health during signoff: `ok`, `11/11`
- Lint: pass
- Build: pass
- Diff whitespace check: pass

## Notes

- The workflow does not require the GitHub workflow commit to equal the deployed production commit because documentation/evidence-only commits intentionally skip Vercel deployment.
- Exact deployed-commit checks remain available for release windows with `QA_LAUNCH_EXPECTED_COMMIT=<sha>`.
