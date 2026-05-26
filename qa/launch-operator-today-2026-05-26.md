# Launch Operator Today

Date: 2026-05-26
Today: 2026-05-26
Time zone: America/Vancouver
Generated at: 2026-05-26T22:55:09.078Z
Status: fail

## Result

- Checked: 14
- Passed: 13
- Failed: 1
- Public launch status: blocked
- Runtime deployment current: yes
- Beta reviews: 0/25, 25 remaining
- Production visual-review history: 2/4, 2 remaining
- Beta prepared dispatch rows: 5
- Beta rows deferred until current dispatch packet/log advances: 10
- Beta invites due today: 0
- Beta invite send log: 0 sent, 5 prepared not sent
- Beta follow-ups due soon: 5
- Beta follow-ups blocked until initial sent proof: 5
- Beta review submissions due soon: 5
- Required production visual reviews due soon: 1
- Production visual send log: 0 sent, 2 required prepared not sent
- Runtime deployment actions: 0
- Overdue launch execution rows: 5

## Operator Handoff

- Immediate action: Send or reassign 5 overdue beta invites now.
- Overdue beta invite IDs: BETA-HR-001, BETA-HR-002, BETA-HR-003, BETA-HR-004, BETA-HR-005
- Due-soon production visual-review IDs: PROD-VISUAL-HISTORY-002
- Follow-ups blocked until initial sent proof: BETA-HR-001, BETA-HR-002, BETA-HR-003, BETA-HR-004, BETA-HR-005
- Deferred beta invite IDs: BETA-HR-006, BETA-HR-007, BETA-HR-008, BETA-HR-009, BETA-HR-010, BETA-HR-011, BETA-HR-012, BETA-HR-013, BETA-HR-014, BETA-HR-015
- Sent-record CSV: `qa/dispatch-sent-record-template-2026-05-26.csv`
- Validate sent proof: `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`
- Import sent proof: `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`
- Refresh after import: `npm run qa:launch-refresh` and `npm run qa:launch-signoff`
- Privacy rule: Keep reviewer names and contact details in the external contact system; store only aliases and proof pointers in repo evidence.
- Completion rule: Sent proof is not completed review evidence. Public launch still requires completed beta and visual-review JSON intake imports.

## Execution Order

1. Send every P0/P1 message file in the Send Packet Index; beta rows are overdue and the visual row is due soon.
2. Record each real send in `qa/dispatch-sent-record-template-2026-05-26.csv` with reviewer alias, delivery channel, sent timestamp, and external contact/proof location.
3. Validate the filled sent-record CSV with `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`.
4. Import the sent state with `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent` only after validation passes.
5. Refresh launch evidence with `npm run qa:launch-refresh` and `npm run qa:launch-signoff`.
6. Collect completed non-template beta and visual review JSON, validate intake, import only after clean validation, then rerun launch gates.

## Send Packet Index

| Priority | ID | Type | Subject | Message File | Evidence Path |
| --- | --- | --- | --- | --- | --- |
| P0 | BETA-HR-001 | beta-human-review | [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-001-athens.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| P0 | BETA-HR-002 | beta-human-review | [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-002-lisbon.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| P0 | BETA-HR-003 | beta-human-review | [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-003-barcelona.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| P0 | BETA-HR-004 | beta-human-review | [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-004-paris.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| P0 | BETA-HR-005 | beta-human-review | [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-005-new-york.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| P1 | PROD-VISUAL-HISTORY-002 | production-visual-review | [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28 | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-002-2026-05-28.txt` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |

## Do Today

| Priority | Type | ID | Send By | Timing | Due | Send Status | Action | Subject | Source | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | beta-human-review | BETA-HR-001 | 2026-05-22 | send overdue by 4 days | 2026-05-25 | prepared-not-sent | BETA-HR-001 dispatch is overdue by 4 days; send invite immediately or reassign, then record sent proof. Follow-up overdue by 2 days; draft the follow-up, but do not send it until the initial invite is recorded as sent. Review overdue by 1 day; track completed reviewer JSON and intake readiness. | [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-001-athens.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| P0 | beta-human-review | BETA-HR-002 | 2026-05-22 | send overdue by 4 days | 2026-05-25 | prepared-not-sent | BETA-HR-002 dispatch is overdue by 4 days; send invite immediately or reassign, then record sent proof. Follow-up overdue by 2 days; draft the follow-up, but do not send it until the initial invite is recorded as sent. Review overdue by 1 day; track completed reviewer JSON and intake readiness. | [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-002-lisbon.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| P0 | beta-human-review | BETA-HR-003 | 2026-05-22 | send overdue by 4 days | 2026-05-25 | prepared-not-sent | BETA-HR-003 dispatch is overdue by 4 days; send invite immediately or reassign, then record sent proof. Follow-up overdue by 2 days; draft the follow-up, but do not send it until the initial invite is recorded as sent. Review overdue by 1 day; track completed reviewer JSON and intake readiness. | [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-003-barcelona.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| P0 | beta-human-review | BETA-HR-004 | 2026-05-22 | send overdue by 4 days | 2026-05-25 | prepared-not-sent | BETA-HR-004 dispatch is overdue by 4 days; send invite immediately or reassign, then record sent proof. Follow-up overdue by 2 days; draft the follow-up, but do not send it until the initial invite is recorded as sent. Review overdue by 1 day; track completed reviewer JSON and intake readiness. | [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-004-paris.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| P0 | beta-human-review | BETA-HR-005 | 2026-05-22 | send overdue by 4 days | 2026-05-25 | prepared-not-sent | BETA-HR-005 dispatch is overdue by 4 days; send invite immediately or reassign, then record sent proof. Follow-up overdue by 2 days; draft the follow-up, but do not send it until the initial invite is recorded as sent. Review overdue by 1 day; track completed reviewer JSON and intake readiness. | [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-005-new-york.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| P1 | production-visual-review | PROD-VISUAL-HISTORY-002 | n/a | review in 2 days | 2026-05-28 | prepared-not-sent | Review in 2 days; send visual-review assignment or confirm scheduled reviewer time. | [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28 | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-002-2026-05-28.txt` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |

## Operating Rules

- Send beta invite messages from the listed message files; do not treat sent messages as completed review evidence.
- Do not send deferred beta rows until their dispatch packet and dispatch-log row are prepared; send or reassign the current prepared rows first.
- Record reviewer names and contact details outside the repo.
- Fill the generated sent-record template after real outreach: `qa/dispatch-sent-record-template-2026-05-26.csv` (report: `qa/dispatch-sent-record-template-2026-05-26.md`, JSON: `qa/dispatch-sent-record-template-2026-05-26.json`).
- Validate the filled sent-state update with `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`, then import it with `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`.
- Completed beta reviews must be non-template JSON files, validated with `npm run qa:beta-review-intake`, then imported only with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`.
- Production visual reviews must be inspected by a human, validated with `npm run qa:visual-review-intake`, then imported only with `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`.
- Runtime deployment actions must run from the repo root; after Vercel accepts a production deploy, rerun `npm run qa:launch-refresh` and `npm run qa:launch-signoff`.
- Re-run `npm run qa:launch-refresh` and `npm run qa:launch-signoff` after each dispatch-log or review-evidence import.

## Checks

- Pass: launch today reads current blocked release status
- Pass: launch today has actionable deployment, beta, or visual work
- Pass: launch today exposes runtime deployment blocker when production is behind
- Pass: launch today reads aligned dispatch logs
- Pass: launch today beta actions are backed by prepared dispatch packets
- Pass: launch today beta actions have message files
- Pass: launch today visual actions have message files
- Pass: launch today visual actions preserve dispatch context
- Pass: launch today send actions match dispatch logs
- Pass: launch today exposes time-aware execution actions
- Pass: launch today exposes exact sent-record handoff commands
- Pass: launch today exposes a complete operator handoff summary
- Pass: launch today keeps beta follow-ups gated by initial sent proof
- Fail: launch today has no overdue launch execution rows

## Failures

- launch today has no overdue launch execution rows
