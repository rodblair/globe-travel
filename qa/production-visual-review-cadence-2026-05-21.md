# Production Visual Review Cadence

Date: 2026-05-21

## Issue

`GT-P2-002` tracked that production visual QA had strong automated artifact capture but no repeatable review cadence. Launch signoff could prove screenshots existed and automated visual checks passed, but it did not prove the latest production visual artifact was reviewed against the current production deployment.

## Fix

- Added `qa/production-visual-review-register.json`.
- Added launch-signoff checks that require the production visual review register to be fresh.
- Launch signoff now fails unless the visual review tracks the current `/api/health` production commit and deployment URL.
- Launch signoff now verifies the reviewed production visual summary is readable, passed `20/20`, covers landing, login, signup, and public-share across five viewports, includes stable-route diff coverage, and has every reviewed screenshot artifact present.
- Launch signoff now requires a named owner, review cadence, review protocol, future next-review date, passing verdict, and no blocking findings.

## Verification

```bash
QA_LAUNCH_EXPECTED_COMMIT=678044eb1feb626f9b8ece8d38cb145d1ca5f249 npm run qa:launch-signoff
```

Result: `42/42` passed.

```bash
QA_LAUNCH_PRODUCTION_EVIDENCE=/tmp/globe-production-release-visual-review-678044e.log npm run qa:launch-signoff
```

Result: `41/41` passed.

Focused visual review checks passed:

- Production visual review register is readable.
- Production visual review register evidence is fresh.
- Production visual review tracks current production deployment.
- Production visual review summary artifact is readable.
- Production visual review covers required public routes, viewports, and diffs.
- Production visual review screenshot artifacts exist for every reviewed result.
- Production visual review has no unresolved visual blockers.
- Production visual review cadence has owner and future review date.

Stale visual review negative test:

```bash
QA_LAUNCH_VISUAL_REVIEW_REGISTER=/tmp/globe-visual-review-stale-XXXXXX.json \
QA_LAUNCH_EXPECTED_COMMIT=678044eb1feb626f9b8ece8d38cb145d1ca5f249 \
npm run qa:launch-signoff
```

Result: exited `1` as expected.

- Failed check: `production visual review tracks current production deployment`
- Commit match: false
- URL match: false

## Result

Production visual review is now a release-operation control instead of a loose follow-up. The P2 remains open until the cadence has routine human review history through beta, but every launch-signoff run now proves the latest production visual review is current, owned, and attached to the live deployment under test.
