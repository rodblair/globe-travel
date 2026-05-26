# Production Visual Review Dispatch Outbox

Date: 2026-05-26
Today: 2026-05-26
Status: pass
Source: qa/production-visual-review-progress-2026-05-26.json

## Result

- Checked: 4
- Passed: 4
- Failed: 0
- Message files: 3
- Required public-launch rows: 2
- Due soon: 1
- Overdue: 0

## Operator Workflow

- Assign a named visual reviewer before each due date.
- Send the matching message file, command, and submission-template path to the reviewer.
- Review all scheduled screenshots before copying a template to a completed non-template JSON file.
- Replace commit and deployment placeholders with current `/api/health` metadata.
- Validate with `npm run qa:visual-review-intake`; import only with `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake` after validation is clean.
- Re-run `npm run qa:visual-review-progress`, `npm run qa:launch-refresh`, and `npm run qa:launch-signoff` after import.

## Message Files

| ID | Due | Required | Reviewer | Message File |
| --- | --- | --- | --- | --- |
| PROD-VISUAL-HISTORY-002 | 2026-05-28 | yes | visual QA reviewer | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-002-2026-05-28.txt` |
| PROD-VISUAL-HISTORY-003 | 2026-06-04 | yes | visual QA reviewer | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-003-2026-06-04.txt` |
| PROD-VISUAL-HISTORY-004 | 2026-06-11 | buffer | visual QA reviewer | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-004-2026-06-11.txt` |

## Checks

- Pass: visual dispatch outbox reads passing progress and scheduled reviews
- Pass: visual dispatch outbox has one message file per scheduled review
- Pass: visual dispatch outbox rows are actionable and not overdue
- Pass: visual dispatch outbox CSV includes every command and completed-submission path

## Failures

- none

## Launch Rule

This dispatch outbox is assignment and outreach evidence, not completed visual-review history. Public launch still requires completed non-template visual-review JSON submissions that pass intake and are explicitly imported into reviewHistory.
