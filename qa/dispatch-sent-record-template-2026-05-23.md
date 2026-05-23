# Dispatch Sent-Record Template

Date: 2026-05-23
Status: pass

## Result

- Checked: 9
- Passed: 9
- Failed: 0
- Launch operator board: `qa/launch-operator-today-2026-05-23.json`
- Template rows: 6
- Beta rows: 5
- Visual rows: 1
- Ready for import now: no

## Operating Meaning

This file is not a sent proof and does not count as outreach evidence. It is a starter record for the release operator to fill only after real beta invites or visual-review assignments are sent outside the repo. Keep real names, emails, phone numbers, and other contact details in the external contact system; use only non-sensitive aliases and external record pointers here.

## Commands After Filling The JSON

- Validate: `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-23.json npm run qa:dispatch-mark-sent`
- Import: `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-23.json npm run qa:dispatch-mark-sent`

## Commands After Filling The CSV

- Validate: `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-23.csv npm run qa:dispatch-mark-sent`
- Import: `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-23.csv npm run qa:dispatch-mark-sent`

## After Import

- Run: `npm run qa:launch-refresh`
- Run: `npm run qa:launch-signoff`

## Rows To Fill

| ID | Type | Subject | Source | Packet | Submission Template | Completed Evidence Target |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | beta-human-review | [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-001-athens.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| BETA-HR-002 | beta-human-review | [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-002-lisbon.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| BETA-HR-003 | beta-human-review | [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-003-barcelona.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| BETA-HR-004 | beta-human-review | [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-004-paris.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| BETA-HR-005 | beta-human-review | [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-005-new-york.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| PROD-VISUAL-HISTORY-002 | production-visual-review | PROD-VISUAL-HISTORY-002 | `qa/production-visual-review-dispatch-outbox-2026-05-21/prod-visual-history-002-2026-05-28.txt` | `qa/visual-baseline-production-review-2026-05-28` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |

## Checks

- Pass: sent-record template reads actionable launch operator board
- Pass: sent-record template covers every current outreach send action
- Pass: sent-record template keeps post-send proof fields blank
- Pass: sent-record template points at existing message files
- Pass: sent-record template points at existing submission templates
- Pass: sent-record template includes validation and import commands
- Pass: sent-record template requires launch refresh and signoff after import
- Pass: sent-record template includes operator context for every outreach row
- Pass: sent-record template contains no sensitive contact details

## Failures

- none
