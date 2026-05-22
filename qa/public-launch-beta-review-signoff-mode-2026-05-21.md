# Public Launch Beta Review Signoff Mode

Date: 2026-05-21

## Purpose

Launch signoff now has two explicit modes and one canonical status artifact:

- Default mode proves the current beta-readiness packet, accepted-risk register, production health, visual evidence, monitoring, rollback, and completed-review evidence quality.
- Public-launch mode additionally requires the beta human-review register to meet its public-launch completed-review threshold.
- `npm run qa:public-launch-status` summarizes the current production state as either `public-launch-ready`, `beta-ready-public-blocked`, or `blocked`.

## Gate Change

`npm run qa:launch-signoff` now reads `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1` or `QA_LAUNCH_MODE=public`. When either is set, the gate fails unless completed beta reviews meet `minimumCompletedReviewsForPublicLaunch` from `qa/beta-human-review-register.json`.

The same public-launch mode also fails unless `qa/production-visual-review-register.json` contains at least four distinct dated production visual-review history entries with passing evidence, no blocking findings, and at least 20 reviewed screenshots per entry. Launch signoff now reads `qa/public-launch-status-2026-05-21.json`; default mode expects that artifact to track the live production deployment and expose the remaining public blockers, while public-launch mode requires it to report `public-launch-ready`.

## Verification

- Commit `539506d829bdc4b7c66cb546e39b92a925e098e0` deployed to Vercel production with health `ok`, `11/11`.
- The full production release gate passed `10/10`, including production visual QA `20/20`, public-share viral loop `5/5`, Athens public-share map integrity, and prompt-suite production actual validation `60/60`.
- Default exact-commit signoff passed `89/89` for beta/release-candidate operations, including `25/25` beta reviewer packet coverage, `25/25` beta submission-template coverage, beta assignment-board coverage, beta review progress artifact consistency, beta review intake artifact consistency, paid-path readiness `6/6`, the `3/3` future production visual-review schedule, `3/3` production visual-review submission-template coverage, production visual-review assignment-board coverage, production visual-review intake consistency, and the public-launch status artifact.
- `npm run qa:public-launch-status` reports `beta-ready-public-blocked` with no guardrail issues, `0/25` completed beta reviews, and `1/4` required production visual-review history entries.
- `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1 QA_LAUNCH_EXPECTED_COMMIT=539506d829bdc4b7c66cb546e39b92a925e098e0 npm run qa:launch-signoff` fails as expected at `88/91`, with `0/25` completed beta reviews, `1/4` required production visual-review history entries, and a non-ready public-launch status.
- `QA_BETA_REVIEW_PROGRESS_REQUIRE_PUBLIC=1 npm run qa:beta-review-progress` fails as expected with `0/25` completed beta reviews and missing completed-review matrix coverage.

## Release Meaning

This keeps the active platform goal honest: the platform can keep progressing through beta readiness, but public launch approval cannot pass until the real beta review program has at least 25 completed reviews with auditable evidence, zero unresolved P0/P1 findings, and routine visual review history.
