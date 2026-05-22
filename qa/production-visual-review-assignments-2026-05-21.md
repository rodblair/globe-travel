# Production Visual Review Assignment Board

Date: 2026-05-21
Status: ready for scheduled review execution

## Operator Instructions

- Run each scheduled production release command on or after its due date.
- Review all 20 production visual screenshots for the scheduled artifact.
- Copy the matching `.template.json` file to a non-template `.json` file only after the review is actually complete.
- Replace live production commit and deployment placeholders with the current `/api/health` deployment metadata.
- Run `npm run qa:visual-review-intake`, then `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake` only when validation is clean.
- Re-run `npm run qa:visual-review-schedule`, `npm run qa:public-launch-status`, and `npm run qa:launch-signoff` after import.

## Scheduled Review Matrix

| ID | Due | Owner | Artifact | Template | Command |
| --- | --- | --- | --- | --- | --- |
| PROD-VISUAL-HISTORY-002 | 2026-05-28 | Product | `qa/visual-baseline-production-review-2026-05-28` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json` | `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-05-28 npm run qa:release-production` |
| PROD-VISUAL-HISTORY-003 | 2026-06-04 | Product | `qa/visual-baseline-production-review-2026-06-04` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-003.template.json` | `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-06-04 npm run qa:release-production` |
| PROD-VISUAL-HISTORY-004 | 2026-06-11 | Product | `qa/visual-baseline-production-review-2026-06-11` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-004.template.json` | `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-06-11 npm run qa:release-production` |

## Launch Rule

Public launch still requires four distinct dated passing visual-review history entries. This board and its templates are scheduling aids, not completed visual-review evidence.
