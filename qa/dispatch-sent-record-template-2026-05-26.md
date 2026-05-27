# Dispatch Sent-Record Template

Date: 2026-05-26
Status: pass

## Result

- Checked: 10
- Passed: 10
- Failed: 0
- Launch operator board: `qa/launch-operator-today-2026-05-26.json`
- Template rows: 16
- Beta rows: 15
- Visual rows: 1
- Ready for import now: no

## Operating Meaning

This file is not a sent proof and does not count as outreach evidence. It is a starter record for the release operator to fill only after real beta invites or visual-review assignments are sent outside the repo. Keep real names, emails, phone numbers, and other contact details in the external contact system; use only non-sensitive aliases and external record pointers here.

## Proof Fields To Fill

- reviewerAlias: a stable non-sensitive alias, such as `reviewer-beta-hr-001`
- deliveryChannel: one of `email`, `sms`, `slack`, `discord`, `whatsapp`, `imessage`, `phone`, `manual`, `external-outreach-log`, `other`
- sentAt: an ISO timestamp that starts with 2026-05-26, such as `2026-05-26T12:00:00.000Z`
- contactRecordLocation: a stable external proof pointer, such as `https://crm.example.com/records/GT-123`, `external-record:BETA-HR-001-sent-proof`, `crm:GT-BETA-HR-001`

The example columns in the JSON and CSV are examples only. Leave them unchanged or delete them before import; the import command reads only the real proof fields.

## Commands After Filling The JSON

- Validate: `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.json npm run qa:dispatch-mark-sent`
- Import: `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.json npm run qa:dispatch-mark-sent`

## Commands After Filling The CSV

- Validate: `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`
- Import: `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`

## After Import

- Run: `npm run qa:launch-refresh`
- Run: `npm run qa:launch-signoff`

## Rows To Fill

| ID | Type | Subject | Source | Packet | Submission Template | Completed Evidence Target |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | beta-human-review | [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-001-athens.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| BETA-HR-002 | beta-human-review | [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-002-lisbon.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| BETA-HR-003 | beta-human-review | [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-003-barcelona.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| BETA-HR-004 | beta-human-review | [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-004-paris.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| BETA-HR-005 | beta-human-review | [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-005-new-york.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| BETA-HR-006 | beta-human-review | [Globe.travel beta] BETA-HR-006 Istanbul review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-006-istanbul.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json` |
| BETA-HR-007 | beta-human-review | [Globe.travel beta] BETA-HR-007 Seoul review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-007-seoul.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json` |
| BETA-HR-008 | beta-human-review | [Globe.travel beta] BETA-HR-008 Bangkok review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-008-bangkok.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json` |
| BETA-HR-009 | beta-human-review | [Globe.travel beta] BETA-HR-009 Marrakech review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-009-marrakech.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json` |
| BETA-HR-010 | beta-human-review | [Globe.travel beta] BETA-HR-010 Cape Town review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-010-cape-town.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json` |
| BETA-HR-011 | beta-human-review | [Globe.travel beta] BETA-HR-011 Sydney review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-011-sydney.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json` |
| BETA-HR-012 | beta-human-review | [Globe.travel beta] BETA-HR-012 Vancouver review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-012-vancouver.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json` |
| BETA-HR-013 | beta-human-review | [Globe.travel beta] BETA-HR-013 Rio de Janeiro review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-013-rio-de-janeiro.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json` |
| BETA-HR-014 | beta-human-review | [Globe.travel beta] BETA-HR-014 Reykjavik review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-014-reykjavik.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json` |
| BETA-HR-015 | beta-human-review | [Globe.travel beta] BETA-HR-015 Crete review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-015-crete.txt` | `qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.template.json` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json` |
| PROD-VISUAL-HISTORY-002 | production-visual-review | [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28 | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-002-2026-05-28.txt` | `qa/visual-baseline-production-review-2026-05-28` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |

## Checks

- Pass: sent-record template reads actionable launch operator board
- Pass: sent-record template covers every current outreach send action
- Pass: sent-record template keeps post-send proof fields blank
- Pass: sent-record template points at existing message files
- Pass: sent-record template points at existing submission templates
- Pass: sent-record template includes validation and import commands
- Pass: sent-record template requires launch refresh and signoff after import
- Pass: sent-record template includes operator context for every outreach row
- Pass: sent-record template includes proof-format guidance
- Pass: sent-record template contains no sensitive contact details

## Failures

- none
