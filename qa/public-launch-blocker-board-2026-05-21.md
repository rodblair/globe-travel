# Public Launch Blocker Board

Date: 2026-05-21
Today: 2026-05-22
Status: pass

## Result

- Checked: 5
- Passed: 5
- Failed: 0
- Beta reviews: 0/25, 25 remaining
- Beta next wave: BETA-WAVE-01
- Beta rows ready: 5
- Visual review history: 2/4, 2 remaining
- Visual rows scheduled: 3
- Next visual review due: 2026-05-28

## Work Rows

| Blocker | Type | ID | Due | Owner | Status | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- |
| beta-human-review-threshold | beta-human-review | BETA-HR-001 | 2026-05-25 | Product | needs completed review submission | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| beta-human-review-threshold | beta-human-review | BETA-HR-002 | 2026-05-25 | Product | needs completed review submission | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| beta-human-review-threshold | beta-human-review | BETA-HR-003 | 2026-05-25 | Product | needs completed review submission | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| beta-human-review-threshold | beta-human-review | BETA-HR-004 | 2026-05-25 | Product | needs completed review submission | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| beta-human-review-threshold | beta-human-review | BETA-HR-005 | 2026-05-25 | Product | needs completed review submission | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| production-visual-review-history | production-visual-review | PROD-VISUAL-HISTORY-002 | 2026-05-28 | Product | required for public launch history | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json` |
| production-visual-review-history | production-visual-review | PROD-VISUAL-HISTORY-003 | 2026-06-04 | Product | required for public launch history | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-003.json` |
| production-visual-review-history | production-visual-review | PROD-VISUAL-HISTORY-004 | 2026-06-11 | Product | scheduled buffer review | `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-004.json` |

## Next Evidence Actions

### BETA-HR-001: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25

- Due: 2026-05-25
- Reviewer role: mobile couple beta reviewer
- Start URL: https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time.
- Packet: `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md`
- Template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json`
- Completed evidence path: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json`
- Validate: `npm run qa:beta-review-intake`
- Import when clean: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`
- Rule: Counts only after a non-template JSON submission passes beta review intake and is explicitly imported.

### BETA-HR-002: [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25

- Due: 2026-05-25
- Reviewer role: desktop friend group beta reviewer
- Start URL: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife.
- Packet: `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md`
- Template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json`
- Completed evidence path: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json`
- Validate: `npm run qa:beta-review-intake`
- Import when clean: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`
- Rule: Counts only after a non-template JSON submission passes beta review intake and is explicitly imported.

### BETA-HR-003: [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25

- Due: 2026-05-25
- Reviewer role: mobile friend group beta reviewer
- Start URL: https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends.
- Packet: `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md`
- Template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json`
- Completed evidence path: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json`
- Validate: `npm run qa:beta-review-intake`
- Import when clean: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`
- Rule: Counts only after a non-template JSON submission passes beta review intake and is explicitly imported.

### BETA-HR-004: [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25

- Due: 2026-05-25
- Reviewer role: desktop couple beta reviewer
- Start URL: https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing.
- Packet: `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md`
- Template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json`
- Completed evidence path: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json`
- Validate: `npm run qa:beta-review-intake`
- Import when clean: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`
- Rule: Counts only after a non-template JSON submission passes beta review intake and is explicitly imported.

### BETA-HR-005: [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25

- Due: 2026-05-25
- Reviewer role: desktop friend group beta reviewer
- Start URL: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas.
- Packet: `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md`
- Template: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json`
- Completed evidence path: `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json`
- Validate: `npm run qa:beta-review-intake`
- Import when clean: `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`
- Rule: Counts only after a non-template JSON submission passes beta review intake and is explicitly imported.

### PROD-VISUAL-HISTORY-002: required for public launch history

- Due: 2026-05-28
- Reviewer role: visual QA reviewer
- Run: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-05-28 npm run qa:release-production`
- Expected artifact prefix: `qa/visual-baseline-production-review-2026-05-28`
- Template: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json`
- Completed evidence path: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.json`
- Validate: `npm run qa:visual-review-intake`
- Import when clean: `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`
- Routes: landing, login, signup, public-share
- Viewports: phone, tablet, laptop, desktop, wide
- Diff routes: landing, login, signup
- Rule: Counts only after production visual review evidence passes intake and is explicitly imported into reviewHistory.

### PROD-VISUAL-HISTORY-003: required for public launch history

- Due: 2026-06-04
- Reviewer role: visual QA reviewer
- Run: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-06-04 npm run qa:release-production`
- Expected artifact prefix: `qa/visual-baseline-production-review-2026-06-04`
- Template: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-003.template.json`
- Completed evidence path: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-003.json`
- Validate: `npm run qa:visual-review-intake`
- Import when clean: `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`
- Routes: landing, login, signup, public-share
- Viewports: phone, tablet, laptop, desktop, wide
- Diff routes: landing, login, signup
- Rule: Counts only after production visual review evidence passes intake and is explicitly imported into reviewHistory.

### PROD-VISUAL-HISTORY-004: scheduled buffer review

- Due: 2026-06-11
- Reviewer role: visual QA reviewer
- Run: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-review-2026-06-11 npm run qa:release-production`
- Expected artifact prefix: `qa/visual-baseline-production-review-2026-06-11`
- Template: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-004.template.json`
- Completed evidence path: `qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-004.json`
- Validate: `npm run qa:visual-review-intake`
- Import when clean: `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`
- Routes: landing, login, signup, public-share
- Viewports: phone, tablet, laptop, desktop, wide
- Diff routes: landing, login, signup
- Rule: Counts only after production visual review evidence passes intake and is explicitly imported into reviewHistory.

## Operator Rules

- Beta review rows are outreach assignments, not completed review evidence.
- Production visual rows are scheduled review work, not completed visual history.
- Keep template files unchanged; completed evidence must be non-template JSON.
- Validate beta evidence with `npm run qa:beta-review-intake`; import only with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`.
- Validate visual evidence with `npm run qa:visual-review-intake`; import only with `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake`.
- Re-run `npm run qa:public-launch-blockers`, `npm run qa:public-launch-status`, and `npm run qa:launch-signoff` after every import.

## Checks

- Pass: public launch blocker board reads current blocked status
- Pass: public launch blocker board covers beta next wave
- Pass: public launch blocker board covers scheduled visual history work
- Pass: public launch blocker board CSV includes every open work row
- Pass: public launch blocker board evidence paths and commands are executable

## Failures

- none

## Launch Rule

This blocker board does not satisfy public launch by itself. Public launch still requires 25 completed beta human reviews with no unresolved P0/P1 findings and four distinct dated passing production visual-review history entries.
