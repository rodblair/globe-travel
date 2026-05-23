# Launch Dispatch Packet

Date: 2026-05-23
Status: pass

## Result

- Checked: 7
- Passed: 7
- Failed: 0
- Launch operator board: `qa/launch-operator-today-2026-05-23.json`
- Sent-record template: `qa/dispatch-sent-record-template-2026-05-23.json`
- Sent-record CSV to fill after real outreach: `qa/dispatch-sent-record-template-2026-05-23.csv`
- Outreach rows: 6 (5 beta, 1 visual)

## Operating Meaning

This packet is a send bundle, not proof that anything was sent. Use it to copy the prepared messages into the external outreach channel. After real outreach happens, fill only the blank proof fields in `qa/dispatch-sent-record-template-2026-05-23.csv`, validate, import, then rerun launch gates.

## After Real Sends

- Validate filled CSV: `QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-23.csv npm run qa:dispatch-mark-sent`
- Import filled CSV: `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-23.csv npm run qa:dispatch-mark-sent`
- Run: `npm run qa:launch-refresh`
- Run: `npm run qa:launch-signoff`

## Messages

### 1. BETA-HR-001 (beta-human-review)

- Priority: P0
- Subject: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25
- Message source: `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-001-athens.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25

You are assigned BETA-HR-001 for the Globe.travel beta review wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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
- Message source: `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-002-lisbon.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25

You are assigned BETA-HR-002 for the Globe.travel beta review wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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
- Message source: `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-003-barcelona.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25

You are assigned BETA-HR-003 for the Globe.travel beta review wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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
- Message source: `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-004-paris.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25

You are assigned BETA-HR-004 for the Globe.travel beta review wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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
- Message source: `qa/beta-human-review-dispatch-outbox-2026-05-21/beta-hr-005-new-york.txt`
- Start URL or command: `https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas.`
- Packet or artifact: `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md`
- Submission template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json`
- Completed evidence target: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json`
- Validate completed evidence: `npm run qa:beta-review-intake`
- Import completed evidence: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`

```text
Subject: [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25

You are assigned BETA-HR-005 for the Globe.travel beta review wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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

### 6. PROD-VISUAL-HISTORY-002 (production-visual-review)

- Priority: P1
- Subject: [Globe.travel visual QA] PROD-VISUAL-HISTORY-002 production review due 2026-05-28
- Message source: `qa/production-visual-review-dispatch-outbox-2026-05-21/prod-visual-history-002-2026-05-28.txt`
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

- Pass: launch dispatch packet reads current launch operator and sent-record template
- Pass: launch dispatch packet includes every current outreach row
- Pass: launch dispatch packet inlines readable message bodies
- Pass: launch dispatch packet points at existing submission templates
- Pass: launch dispatch packet keeps proof fields blank until real outreach is sent
- Pass: launch dispatch packet includes validation and import commands for every row
- Pass: launch dispatch packet includes complete operator context without sensitive contact details

## Failures

- none
