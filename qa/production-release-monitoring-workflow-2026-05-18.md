# Production Release Monitoring Workflow

Date: 2026-05-18
Workflow: `.github/workflows/production-release-gate.yml`
Default production URL: `https://globe-travel-two.vercel.app`
Default share slug: `x3m2c8cnws`

## Scope

This pass promotes the production release gate from a local/manual command into scheduled production monitoring.

The workflow runs:

```bash
npm run qa:release-production
```

It covers:

- production operations health and deployment metadata
- production route smoke
- production auth and guest access Browser smoke
- production commercial safety checks
- production public share, map integrity, metadata, and share-card image rendering
- production public visual QA and stable-route pixel diffs
- production prompt actual export for the stable Athens itinerary
- prompt-suite validation with that production actual

## Schedule

- Runs every 6 hours.
- Supports manual `workflow_dispatch`.
- Manual inputs can override:
  - production base URL
  - public share slug
  - prompt actuals inclusion
  - production feedback mutation inclusion
  - production visual QA inclusion

The workflow locates Chrome and sets `QA_CHROME_PATH` before running the release gate so Browser-backed auth/guest access checks can run on GitHub-hosted runners.

## Safety

The workflow is read-only by default.

Production feedback insertion is disabled unless `include_feedback_mutation` is explicitly set to `1` during an approved release window.
Production visual QA is enabled by default and should only be disabled with `include_production_visual=0` when investigating visual-runner infrastructure issues.

## Evidence

Local validation after adding and upgrading the workflow:

- `npm run qa:release-production` passed `7/7`.
- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-release-2026-05-18 npm run qa:release-production` passed `8/8`, including public production visual QA `20/20`.
- `node --check scripts/platform-production-release-smoke.mjs` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Release Impact

This catches the production class of failure found during the social-preview release rehearsal: a local gate can pass while the production alias is still missing the newly deployed endpoint or metadata. The scheduled workflow keeps checking the live alias even between manual release passes.

It now also catches public visual regressions in acquisition, auth conversion, and viral share surfaces as part of the same release signal.
