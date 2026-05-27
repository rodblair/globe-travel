# Beta Human Review Follow-Up Outbox

Date: 2026-05-21
Today: 2026-05-26
Status: pass
Source: qa/beta-human-review-dispatch-outbox-2026-05-21.json

## Result

- Checked: 5
- Passed: 5
- Failed: 0
- Catch-up overdue follow-ups allowed: yes
- Follow-up message files: 5
- Due within 3 days: 0
- Follow-ups overdue: 5
- Eligible to send now: 0
- Draft-only until initial invite is sent: 5

## Operator Workflow

- Send these only after the initial dispatch message has gone out.
- Rows with `followUpSendEligible: false` are draft-only until the initial invite is recorded as sent in the dispatch log.
- Use the follow-up file matching each review ID.
- Keep reviewer contact and send timestamps outside this repo.
- Completed reviews must arrive as non-template JSON files.
- Validate with `npm run qa:beta-review-intake`; import only with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` after validation is clean.

## Follow-Up Files

| ID | Reviewer | Destination | Follow Up | Initial Send | Eligible | Message File |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | mobile couple beta reviewer | Athens | 2026-05-24 | prepared-not-sent | draft-only | `qa/beta-human-review-follow-up-outbox-2026-05-21/beta-hr-001-athens-follow-up.txt` |
| BETA-HR-002 | desktop friend group beta reviewer | Lisbon | 2026-05-24 | prepared-not-sent | draft-only | `qa/beta-human-review-follow-up-outbox-2026-05-21/beta-hr-002-lisbon-follow-up.txt` |
| BETA-HR-003 | mobile friend group beta reviewer | Barcelona | 2026-05-24 | prepared-not-sent | draft-only | `qa/beta-human-review-follow-up-outbox-2026-05-21/beta-hr-003-barcelona-follow-up.txt` |
| BETA-HR-004 | desktop couple beta reviewer | Paris | 2026-05-24 | prepared-not-sent | draft-only | `qa/beta-human-review-follow-up-outbox-2026-05-21/beta-hr-004-paris-follow-up.txt` |
| BETA-HR-005 | desktop friend group beta reviewer | New York | 2026-05-24 | prepared-not-sent | draft-only | `qa/beta-human-review-follow-up-outbox-2026-05-21/beta-hr-005-new-york-follow-up.txt` |

## Checks

- Pass: follow-up outbox reads passing dispatch and intake artifacts
- Pass: follow-up outbox has one message file per due-soon incomplete review
- Pass: follow-up rows are actionable and not overdue
- Pass: follow-up send eligibility is gated by dispatch sent state
- Pass: follow-up CSV includes every message and completed-submission path

## Failures

- none

## Launch Rule

This follow-up outbox is outreach evidence, not completed review evidence. Public launch still requires completed non-template reviewer JSON submissions that pass intake and are explicitly imported.
