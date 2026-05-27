# Launch Dispatch Packet

Date: 2026-05-26
Status: fail

## Result

- Checked: 8
- Passed: 7
- Failed: 1
- Launch operator board: `qa/launch-operator-today-2026-05-26.json`
- Sent-record template: `qa/dispatch-sent-record-template-2026-05-26.json`
- Sent-record CSV to fill after real outreach: `qa/dispatch-sent-record-template-2026-05-26.csv`
- Outreach rows: 16 (15 beta, 1 visual)

## Operator Brief

- Immediate external action: Send or reassign 5 overdue beta invites now, and send 5 beta invites due today.
- Boundary: This packet is outreach material only; it is not completed beta-review or production visual-review evidence.
- Privacy rule: Keep names, emails, phone numbers, and other contact details in the external contact system; store only aliases and external proof pointers in repo artifacts.
- Proof fields to fill after sending: `reviewerAlias`, `deliveryChannel`, `sentAt`, `contactRecordLocation`

| Order | ID | Type | Priority | Subject | Message File | Completed Evidence Target |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | BETA-HR-001 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-001-athens.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| 2 | BETA-HR-002 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-002-lisbon.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| 3 | BETA-HR-003 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-003-barcelona.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| 4 | BETA-HR-004 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-004-paris.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| 5 | BETA-HR-005 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-005-new-york.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| 6 | BETA-HR-006 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-006 Istanbul review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-006-istanbul.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json` |
| 7 | BETA-HR-007 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-007 Seoul review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-007-seoul.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json` |
| 8 | BETA-HR-008 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-008 Bangkok review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-008-bangkok.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json` |
| 9 | BETA-HR-009 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-009 Marrakech review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-009-marrakech.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json` |
| 10 | BETA-HR-010 | beta-human-review | P0 | [Globe.travel beta] BETA-HR-010 Cape Town review due 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-010-cape-town.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json` |
| 11 | BETA-HR-011 | beta-human-review | P1 | [Globe.travel beta] BETA-HR-011 Sydney review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-011-sydney.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json` |
| 12 | BETA-HR-012 | beta-human-review | P1 | [Globe.travel beta] BETA-HR-012 Vancouver review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-012-vancouver.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json` |
| 13 | BETA-HR-013 | beta-human-review | P1 | [Globe.travel beta] BETA-HR-013 Rio de Janeiro review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-013-rio-de-janeiro.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json` |
| 14 | BETA-HR-014 | beta-human-review | P1 | [Globe.travel beta] BETA-HR-014 Reykjavik review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-014-reykjavik.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json` |
| 15 | BETA-HR-015 | beta-human-review | P1 | [Globe.travel beta] BETA-HR-015 Crete review due 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-015-crete.txt` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json` |
| 16 | PROD-VISUAL-HISTORY-002 | production-visual-review | P1 | [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28 | `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-002-2026-05-28.txt` | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |

## Operating Meaning

This packet is a send bundle, not proof that anything was sent. Use it to copy the prepared messages into the external outreach channel. After real outreach happens, fill only the blank proof fields in `qa/dispatch-sent-record-template-2026-05-26.csv`, validate, import, then rerun launch gates.

## After Real Sends

- Validate filled CSV: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`
- Import filled CSV: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-26.csv npm run qa:dispatch-mark-sent`
- Run: `npm run qa:launch-refresh`
- Run: `npm run qa:launch-signoff`

## Messages

### 1. BETA-HR-001 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-001-athens.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25

You are assigned BETA-HR-001 for wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-25.
- Follow up no later than 2026-05-24.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 2. BETA-HR-002 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-002-lisbon.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25

You are assigned BETA-HR-002 for wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-25.
- Follow up no later than 2026-05-24.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 3. BETA-HR-003 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-003-barcelona.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25

You are assigned BETA-HR-003 for wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-25.
- Follow up no later than 2026-05-24.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 4. BETA-HR-004 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-004-paris.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25

You are assigned BETA-HR-004 for wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-25.
- Follow up no later than 2026-05-24.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 5. BETA-HR-005 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-005-new-york.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25

You are assigned BETA-HR-005 for wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-005 New York review due 2026-05-25" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-25.
- Follow up no later than 2026-05-24.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 6. BETA-HR-006 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-006 Istanbul review due 2026-05-27
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-006-istanbul.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Istanbul+history+and+markets+trip+for+a+small+group.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-006 Istanbul review due 2026-05-27

You are assigned BETA-HR-006 for wave BETA-WAVE-02. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Istanbul+history+and+markets+trip+for+a+small+group. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Istanbul+history+and+markets+trip+for+a+small+group.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Istanbul+history+and+markets+trip+for+a+small+group.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-006 Istanbul review due 2026-05-27" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-27.
- Follow up no later than 2026-05-26.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 7. BETA-HR-007 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-007 Seoul review due 2026-05-27
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-007-seoul.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Seoul+food+and+shopping+trip+for+friends.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-007 Seoul review due 2026-05-27

You are assigned BETA-HR-007 for wave BETA-WAVE-02. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Seoul+food+and+shopping+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Seoul+food+and+shopping+trip+for+friends.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Seoul+food+and+shopping+trip+for+friends.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-007 Seoul review due 2026-05-27" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-27.
- Follow up no later than 2026-05-26.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 8. BETA-HR-008 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-008 Bangkok review due 2026-05-27
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-008-bangkok.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Bangkok+trip+with+temples%2C+street+food%2C+and+easy+pacing.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-008 Bangkok review due 2026-05-27

You are assigned BETA-HR-008 for wave BETA-WAVE-02. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Bangkok+trip+with+temples%2C+street+food%2C+and+easy+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Bangkok+trip+with+temples%2C+street+food%2C+and+easy+pacing.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Bangkok+trip+with+temples%2C+street+food%2C+and+easy+pacing.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-008 Bangkok review due 2026-05-27" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-27.
- Follow up no later than 2026-05-26.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 9. BETA-HR-009 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-009 Marrakech review due 2026-05-27
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-009-marrakech.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Marrakech+trip+around+markets%2C+riads%2C+food%2C+and+culture.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-009 Marrakech review due 2026-05-27

You are assigned BETA-HR-009 for wave BETA-WAVE-02. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Marrakech+trip+around+markets%2C+riads%2C+food%2C+and+culture. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Marrakech+trip+around+markets%2C+riads%2C+food%2C+and+culture.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Marrakech+trip+around+markets%2C+riads%2C+food%2C+and+culture.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-009 Marrakech review due 2026-05-27" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-27.
- Follow up no later than 2026-05-26.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 10. BETA-HR-010 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-010 Cape Town review due 2026-05-27
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-010-cape-town.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Cape+Town+outdoors+and+food+trip+for+friends.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-010 Cape Town review due 2026-05-27

You are assigned BETA-HR-010 for wave BETA-WAVE-02. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Cape+Town+outdoors+and+food+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Cape+Town+outdoors+and+food+trip+for+friends.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Cape+Town+outdoors+and+food+trip+for+friends.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-010 Cape Town review due 2026-05-27" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-27.
- Follow up no later than 2026-05-26.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 11. BETA-HR-011 (beta-human-review)

- Priority: P1
- Subject: [Globe.travel beta] BETA-HR-011 Sydney review due 2026-05-29
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-011-sydney.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Sydney+trip+for+beaches%2C+neighborhoods%2C+and+easy+food+stops.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-011 Sydney review due 2026-05-29

You are assigned BETA-HR-011 for wave BETA-WAVE-03. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Sydney+trip+for+beaches%2C+neighborhoods%2C+and+easy+food+stops. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Sydney+trip+for+beaches%2C+neighborhoods%2C+and+easy+food+stops.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Sydney+trip+for+beaches%2C+neighborhoods%2C+and+easy+food+stops.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-011 Sydney review due 2026-05-29" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-29.
- Follow up no later than 2026-05-28.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 12. BETA-HR-012 (beta-human-review)

- Priority: P1
- Subject: [Globe.travel beta] BETA-HR-012 Vancouver review due 2026-05-29
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-012-vancouver.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Vancouver+outdoors+and+food+trip+for+a+mixed+group.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-012 Vancouver review due 2026-05-29

You are assigned BETA-HR-012 for wave BETA-WAVE-03. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Vancouver+outdoors+and+food+trip+for+a+mixed+group. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Vancouver+outdoors+and+food+trip+for+a+mixed+group.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Vancouver+outdoors+and+food+trip+for+a+mixed+group.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-012 Vancouver review due 2026-05-29" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-29.
- Follow up no later than 2026-05-28.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 13. BETA-HR-013 (beta-human-review)

- Priority: P1
- Subject: [Globe.travel beta] BETA-HR-013 Rio de Janeiro review due 2026-05-29
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-013-rio-de-janeiro.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Rio+beach+and+nightlife+trip+for+friends.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-013 Rio de Janeiro review due 2026-05-29

You are assigned BETA-HR-013 for wave BETA-WAVE-03. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Rio+beach+and+nightlife+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Rio+beach+and+nightlife+trip+for+friends.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Rio+beach+and+nightlife+trip+for+friends.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-013 Rio de Janeiro review due 2026-05-29" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-29.
- Follow up no later than 2026-05-28.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 14. BETA-HR-014 (beta-human-review)

- Priority: P1
- Subject: [Globe.travel beta] BETA-HR-014 Reykjavik review due 2026-05-29
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-014-reykjavik.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Reykjavik+outdoors+trip+with+weather-safe+pacing.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-014 Reykjavik review due 2026-05-29

You are assigned BETA-HR-014 for wave BETA-WAVE-03. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Reykjavik+outdoors+trip+with+weather-safe+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Reykjavik+outdoors+trip+with+weather-safe+pacing.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json

Reviewer checklist:
- Use phone 390x844 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Reykjavik+outdoors+trip+with+weather-safe+pacing.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-014 Reykjavik review due 2026-05-29" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.template.json.
- Confirm the reviewer can test phone 390x844 before 2026-05-29.
- Follow up no later than 2026-05-28.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 15. BETA-HR-015 (beta-human-review)

- Priority: P1
- Subject: [Globe.travel beta] BETA-HR-015 Crete review due 2026-05-29
- Message source: `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-015-crete.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Crete+family+beach+trip+with+culture+and+relaxed+travel+days.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-015 Crete review due 2026-05-29

You are assigned BETA-HR-015 for wave BETA-WAVE-03. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Crete+family+beach+trip+with+culture+and+relaxed+travel+days. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

Start URL:
https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Crete+family+beach+trip+with+culture+and+relaxed+travel+days.

Packet:
qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md

Submission template:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.template.json

Completed submission filename:
qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json

Reviewer checklist:
- Use desktop 1440x950 for the full review.
- Start from https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Crete+family+beach+trip+with+culture+and+relaxed+travel+days.
- Complete planner, Trip Studio, map, save/reopen, public share, feedback, and paid-value checks.
- Fill every scorecard field with a numeric score and a short note.
- Classify each finding as P0, P1, P2, P3, or none.
- Save the completed non-template JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json

Operator checklist:
- Assign a named human reviewer and record their contact outside this artifact.
- Send the subject "[Globe.travel beta] BETA-HR-015 Crete review due 2026-05-29" with the reviewer message below.
- Include packet qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md and template qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.template.json.
- Confirm the reviewer can test desktop 1440x950 before 2026-05-29.
- Follow up no later than 2026-05-28.
- After the completed JSON arrives, run npm run qa:beta-review-intake before any import.

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
```

### 16. PROD-VISUAL-HISTORY-002 (production-visual-review)

- Priority: P1
- Subject: [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28
- Message source: `qa/production-visual-review-dispatch-outbox-2026-05-26/prod-visual-history-002-2026-05-28.txt`
- Start URL or command: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-05-28 npm run qa:release-production`
- Packet or artifact: `qa/visual-baseline-production-review-2026-05-28`
- Submission template: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json`
- Completed evidence target: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json`
- Validate completed evidence: `npm run qa:visual-review-intake`
- Import completed evidence: `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`

```text
Subject: [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28

You are assigned PROD-VISUAL-HISTORY-002, a scheduled Globe.travel production visual review for 2026-05-28.

Run command:
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-05-28 npm run qa:release-production

Expected artifact:
qa/visual-baseline-production-review-2026-05-28

Submission template:
qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json

Completed submission filename:
qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json

Acceptance criteria:
Pass production release gate 10/10, review all 25 production visual screenshots, confirm no app errors, horizontal overflow, clipped primary text, overlapping app controls, missing screenshots, or unexplained stable-route diffs, then append a passing reviewHistory entry.

Reviewer checklist:
- Run the production visual command on or after 2026-05-28.
- Review all 25 screenshots across landing, pricing, login, signup, public-share and phone, tablet, laptop, desktop, wide.
- Confirm no app errors, horizontal overflow, clipped primary text, overlapping app controls, missing screenshots, or unexplained stable-route diffs.
- Replace production commit and deployment placeholders with the current /api/health deployment metadata.
- Save the completed non-template JSON as qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json.
- Validate with npm run qa:visual-review-intake before import.

Operator checklist:
- Assign a named visual reviewer and record their contact outside this repo.
- Send this message file, the command, and the submission template path to the reviewer.
- Confirm the review is not imported until screenshots have actually been inspected.
- Import only after validation is clean: QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake.
- Re-run npm run qa:visual-review-progress, npm run qa:launch-refresh, and npm run qa:launch-signoff after import.

Launch rule:
This message is visual-review outreach, not completed visual-review history. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported into reviewHistory.
```


## Checks

- Fail: launch dispatch packet reads current launch operator and sent-record template
- Pass: launch dispatch packet includes every current outreach row
- Pass: launch dispatch packet inlines readable message bodies
- Pass: launch dispatch packet points at existing submission templates
- Pass: launch dispatch packet keeps proof fields blank until real outreach is sent
- Pass: launch dispatch packet includes validation and import commands for every row
- Pass: launch dispatch packet includes complete operator context without sensitive contact details
- Pass: launch dispatch packet includes a concise operator brief and send order

## Failures

- launch dispatch packet reads current launch operator and sent-record template
