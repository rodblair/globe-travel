# Beta Human Review Dispatch Outbox

Date: 2026-05-21
Today: 2026-05-26
Status: pass
Source: qa/beta-human-review-next-wave-ops-2026-05-21.json

## Result

- Checked: 4
- Passed: 4
- Failed: 0
- Scope: next-wave
- Next wave: BETA-WAVE-01
- Catch-up overdue rows allowed: yes
- Message files: 5
- Dispatch due today: 0
- Dispatch overdue: 5
- Follow-ups due soon: 0
- Follow-ups overdue: 5

## Operator Workflow

- Assign a named human reviewer for each message before sending.
- Send the matching message file, packet path, start URL, and submission-template path to the reviewer.
- Record reviewer contact outside the repo.
- Follow up no later than the row's follow-up date.
- Do not edit `.template.json` files; completed reviews must arrive as non-template JSON files.
- Validate with `npm run qa:beta-review-intake`; import only with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` after validation is clean.

## Message Files

| ID | Reviewer | Destination | Send By | Follow Up | Due | Message File |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | mobile couple beta reviewer | Athens | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-001-athens.txt` |
| BETA-HR-002 | desktop friend group beta reviewer | Lisbon | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-002-lisbon.txt` |
| BETA-HR-003 | mobile friend group beta reviewer | Barcelona | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-003-barcelona.txt` |
| BETA-HR-004 | desktop couple beta reviewer | Paris | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-004-paris.txt` |
| BETA-HR-005 | desktop friend group beta reviewer | New York | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-005-new-york.txt` |

## Checks

- Pass: dispatch outbox reads passing beta-review ops source
- Pass: dispatch outbox has one message file per beta-review ops row
- Pass: dispatch outbox message rows are send-ready
- Pass: dispatch outbox CSV includes every message file and completed-submission path

## Failures

- none

## Launch Rule

This dispatch outbox is assignment and outreach evidence, not completed review evidence. Public launch still requires completed non-template reviewer JSON submissions that pass intake and are explicitly imported.
