# Launch Operator Today

Date: 2026-05-22
Today: 2026-05-22
Status: pass

## Result

- Checked: 4
- Passed: 4
- Failed: 0
- Public launch status: beta-ready-public-blocked
- Beta reviews: 0/25, 25 remaining
- Production visual-review history: 2/4, 2 remaining
- Beta invites due today: 5
- Beta follow-ups due soon: 5
- Beta review submissions due soon: 5
- Required production visual reviews due soon: 1
- Overdue launch execution rows: 0

## Do Today

| Priority | Type | ID | Due | Action | Source | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | beta-human-review | BETA-HR-001 | 2026-05-25 | Send beta review invite today. Prepare follow-up; send on or before the follow-up date. Track completed reviewer JSON and intake readiness. | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-001-athens.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| P0 | beta-human-review | BETA-HR-002 | 2026-05-25 | Send beta review invite today. Prepare follow-up; send on or before the follow-up date. Track completed reviewer JSON and intake readiness. | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-002-lisbon.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| P0 | beta-human-review | BETA-HR-003 | 2026-05-25 | Send beta review invite today. Prepare follow-up; send on or before the follow-up date. Track completed reviewer JSON and intake readiness. | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-003-barcelona.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| P0 | beta-human-review | BETA-HR-004 | 2026-05-25 | Send beta review invite today. Prepare follow-up; send on or before the follow-up date. Track completed reviewer JSON and intake readiness. | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-004-paris.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| P0 | beta-human-review | BETA-HR-005 | 2026-05-25 | Send beta review invite today. Prepare follow-up; send on or before the follow-up date. Track completed reviewer JSON and intake readiness. | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-005-new-york.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| P1 | production-visual-review | PROD-VISUAL-HISTORY-002 | 2026-05-28 | Schedule reviewer time and prepare production visual-review run. | `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-05-28 npm run qa:release-production` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |

## Operating Rules

- Send beta invite messages from the listed message files; do not treat sent messages as completed review evidence.
- Record reviewer names and contact details outside the repo.
- Completed beta reviews must be non-template JSON files, validated with `npm run qa:beta-review-intake`, then imported only with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`.
- Production visual reviews must be inspected by a human, validated with `npm run qa:visual-review-intake`, then imported only with `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`.
- Re-run `npm run qa:launch-today`, `npm run qa:public-launch-status`, and `npm run qa:launch-signoff` after each import.

## Checks

- Pass: launch today reads current blocked release status
- Pass: launch today has actionable beta or visual work
- Pass: launch today beta actions have message files
- Pass: launch today has no overdue launch execution rows

## Failures

- none
