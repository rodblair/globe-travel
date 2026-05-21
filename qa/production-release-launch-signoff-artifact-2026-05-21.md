# Production Release Launch Signoff Artifact Handling

Date: 2026-05-21

## Scope

Close a workflow false-failure path introduced by making launch signoff optional in the production release workflow.

## Issue

Manual `include_launch_signoff=0` runs skip the `Run launch signoff audit` step, but the release-log artifact upload still required `qa-ci/launch-signoff.log`. That could make a healthy visual-disabled or signoff-disabled investigation run fail after the production gate had already passed.

## Change

- Kept `production-release-gate.log` as a required artifact on every run.
- Split `launch-signoff.log` into a separate `production-launch-signoff-log` artifact.
- Upload `production-launch-signoff-log` only when `QA_INCLUDE_LAUNCH_SIGNOFF != '0'`.

## Verification

```bash
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/production-release-gate.yml"); puts "workflow yaml ok"'
QA_LAUNCH_EXPECTED_COMMIT=45fab985d0c302629147eb4bcf49dd21c8438b49 npm run qa:launch-signoff
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_INCLUDE_PRODUCTION_VISUAL=0 QA_INCLUDE_LAUNCH_SIGNOFF=0 npm run qa:release-production
test -s ../qa-ci/production-release-gate.log
test ! -e ../qa-ci/launch-signoff.log
git diff --check
```

Results:

- Workflow YAML parse: pass
- Exact-commit launch signoff: `27/27`
- Signoff-disabled production release gate: `9/9`
- Release gate log exists: pass
- Launch signoff log absent when disabled: pass
- Diff whitespace check: pass
