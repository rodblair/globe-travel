# Beta Human Review Next-Wave Ops

Date: 2026-05-21
Today: 2026-05-22
Scope: next-wave
Status: pass

## Result

- Checked: 7
- Passed: 7
- Failed: 0
- Next wave: BETA-WAVE-01
- Waves covered: 1/5
- Rows ready to send: 5
- Due: 2026-05-25

## Operator Workflow

- Assign a named human reviewer to each row before sending.
- Send next-wave rows by their send-by date and follow up no later than the follow-up date.
- Send the packet path, start URL, and completed-submission filename from the row.
- Keep `.template.json` files unchanged; completed reviews must be non-template JSON files.
- Run `npm run qa:beta-review-intake`; only import with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` after validation is clean.
- Re-run `npm run qa:beta-review-progress`, `npm run qa:beta-review-command-center`, `npm run qa:beta-review-next-wave-ops`, `npm run qa:public-launch-status`, and `npm run qa:launch-signoff`.

## Operator Rows

| ID | Cohort | Device | Destination | Send By | Follow Up | Due | Packet | Completed File |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | continuity reviewer | phone 390x844 | Athens | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| BETA-HR-002 | share-feedback reviewer | desktop 1440x950 | Lisbon | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| BETA-HR-003 | mobile planner reviewer | phone 390x844 | Barcelona | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| BETA-HR-004 | share-feedback reviewer | desktop 1440x950 | Paris | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| BETA-HR-005 | continuity reviewer | desktop 1440x950 | New York | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |

## Reviewer Message Drafts

### BETA-HR-001: Athens

Subject: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25

You are assigned BETA-HR-001 for the Globe.travel beta review wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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

### BETA-HR-002: Lisbon

Subject: [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25

You are assigned BETA-HR-002 for the Globe.travel beta review wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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

### BETA-HR-003: Barcelona

Subject: [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25

You are assigned BETA-HR-003 for the Globe.travel beta review wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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

### BETA-HR-004: Paris

Subject: [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25

You are assigned BETA-HR-004 for the Globe.travel beta review wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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

### BETA-HR-005: New York

Subject: [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25

You are assigned BETA-HR-005 for the Globe.travel beta review wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json. Use the checklist in the packet, fill every scorecard field, and flag any confusing or broken moment as P0, P1, P2, or P3. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

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


## Checks

- Pass: next-wave ops inputs are passing and aligned
- Pass: next-wave ops exposes the expected review scope
- Pass: next-wave ops has one actionable row per remaining scoped review
- Pass: next-wave ops due math matches each review due date
- Pass: next-wave ops CSV includes every scoped review id
- Pass: next-wave ops has dispatch and follow-up dates before due dates
- Pass: next-wave ops has reviewer and operator dispatch checklists

## Failures

- none

## Launch Rule

This next-wave ops pack is an assignment and outreach artifact, not completed review evidence. Public launch still requires 25 completed beta human reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts.
