# Public Launch Beta Review Signoff Mode

Date: 2026-05-21

## Purpose

Launch signoff now has two explicit modes:

- Default mode proves the current beta-readiness packet, accepted-risk register, production health, visual evidence, monitoring, rollback, and completed-review evidence quality.
- Public-launch mode additionally requires the beta human-review register to meet its public-launch completed-review threshold.

## Gate Change

`npm run qa:launch-signoff` now reads `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1` or `QA_LAUNCH_MODE=public`. When either is set, the gate fails unless completed beta reviews meet `minimumCompletedReviewsForPublicLaunch` from `qa/beta-human-review-register.json`.

The same public-launch mode also fails unless `qa/production-visual-review-register.json` contains at least four distinct dated production visual-review history entries with passing evidence, no blocking findings, and at least 20 reviewed screenshots per entry.

## Verification

- Commit `8931b58b4b7a0147d4b3bfacba270bd303ea301e` deployed to Vercel production with health `ok`, `11/11`.
- The full production release gate passed `10/10`, including production visual QA `20/20`, public-share viral loop `5/5`, Athens public-share map integrity, and prompt-suite production actual validation `60/60`.
- Default exact-commit signoff passed `69/69` for beta/release-candidate operations, including `25/25` beta reviewer packet coverage and the `3/3` future production visual-review schedule.
- `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1 QA_LAUNCH_EXPECTED_COMMIT=8931b58b4b7a0147d4b3bfacba270bd303ea301e npm run qa:launch-signoff` fails as expected with `0/25` completed beta reviews and `1/4` required production visual-review history entries.

## Release Meaning

This keeps the active platform goal honest: the platform can keep progressing through beta readiness, but public launch approval cannot pass until the real beta review program has at least 25 completed reviews with auditable evidence, zero unresolved P0/P1 findings, and routine visual review history.
