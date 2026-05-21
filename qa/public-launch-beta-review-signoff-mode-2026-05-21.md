# Public Launch Beta Review Signoff Mode

Date: 2026-05-21

## Purpose

Launch signoff now has two explicit modes:

- Default mode proves the current beta-readiness packet, accepted-risk register, production health, visual evidence, monitoring, rollback, and completed-review evidence quality.
- Public-launch mode additionally requires the beta human-review register to meet its public-launch completed-review threshold.

## Gate Change

`npm run qa:launch-signoff` now reads `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1` or `QA_LAUNCH_MODE=public`. When either is set, the gate fails unless completed beta reviews meet `minimumCompletedReviewsForPublicLaunch` from `qa/beta-human-review-register.json`.

## Verification

- Default exact-commit signoff remains valid for beta/release-candidate operations.
- `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1 QA_LAUNCH_EXPECTED_COMMIT=b634fee74687159c515b8446c94efc3536f3acdd npm run qa:launch-signoff` fails as expected with `0/25` completed beta reviews.

## Release Meaning

This keeps the active platform goal honest: the platform can keep progressing through beta readiness, but public launch approval cannot pass until the real beta review program has at least 25 completed reviews with auditable evidence and no unresolved P0/P1 findings.
