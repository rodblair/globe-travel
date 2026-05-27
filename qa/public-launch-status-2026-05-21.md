# Public Launch Status

Date: 2026-05-21
Operational date: 2026-05-27
Time zone: America/Toronto
Generated at: 2026-05-27T07:20:18.141Z
Base URL: https://globe-travel-two.vercel.app
Status: beta-ready-public-blocked

## Result

- Beta/release-ops ready: yes
- Public-launch ready: no
- Production commit: c3456d52fac34f19a6236841c0b4d5409860f1df
- Production deployment: globe-travel-3y1hgwc01-rodney-blairs-projects.vercel.app
- Runtime deployment current: yes
- Latest runtime commit awaiting production: none
- Beta reviews: 0/25
- Beta review origin: https://globe-travel-two.vercel.app
- Beta review assignment queue ready: yes
- Beta review execution schedule ready: yes
- Beta review command center ready: yes
- Beta review overdue waves: 1
- Beta review due-soon waves: 2
- Beta review dispatch prepared rows: 25
- Beta review dispatch due today: 0
- Beta review dispatch overdue: 10
- Beta review follow-ups due soon: 5
- Beta review follow-ups overdue: 10
- Beta review next-wave ops ready: yes
- Beta review dispatch outbox ready: yes (5 message files)
- Beta review dispatch log ready: yes (0 sent, 5 prepared not sent)
- Beta review follow-up outbox ready: yes (5 message files, 0 eligible, 5 draft-only)
- Beta review all-wave ops ready: yes (25/25)
- Beta review wave rehearsal ready: yes (5/5)
- Beta review matrix rehearsal ready: yes (25/25)
- Beta review production guest-start rehearsal ready: yes (1 exercised, 0 cleanup failures)
- Production visual review history: 2/4
- Production visual due-soon reviews: 1
- Production visual overdue reviews: 0
- Latest production visual artifact: qa/visual-baseline-production-runtime-current-2026-05-27-c3456d5
- Latest production visual commit: c3456d52fac34f19a6236841c0b4d5409860f1df
- Latest production visual deployment: globe-travel-3y1hgwc01-rodney-blairs-projects.vercel.app
- Production visual review progress artifact aligned: yes
- Production visual review assignment queue ready: yes
- Production visual review dispatch outbox ready: yes (3 message files, 2 required)
- Production visual review dispatch log ready: yes (0 sent, 3 prepared not sent)
- Public launch blocker board ready: yes (25 beta rows, 2 required visual rows, 28 total rows)
- Launch operator today ready: yes (16 action rows, 15 beta, 1 visual, 16 send-packet rows, 6 execution steps, 25 beta unsent, 15 follow-ups blocked until initial sent proof, 2 required visual unsent)
- Launch operator overdue rehearsal ready: yes (5 overdue rows detected)
- Launch operator sent-dispatch rehearsal ready: yes (14 action rows after rehearsed sends)
- Dispatch mark-sent dry run ready: yes (2 beta, 1 visual)
- Dispatch mark-sent import rehearsal ready: yes (2 beta sent on isolated log, 1 visual sent on isolated log)
- Dispatch sent-record template ready: yes (16 rows, ready for import: no, missing commands: 0, missing context: 0)
- Launch outreach brief ready: yes (16 rows, 16 CSV rows)
- Dispatch sent-record blank-template rejection ready: yes (16 rejected rows, canonical logs unchanged: yes)
- Review intake rehearsal ready: yes (1 beta invalid, 1 visual invalid)
- Review intake import rehearsal ready: yes (beta copied count 0->1, visual copied count 2->3)
- Public launch mode rehearsal ready: yes (1 strict-mode exit)
- Public launch threshold rehearsal ready: yes (simulated beta 25/25, simulated visual 4/4)
- Open P0/P1 risks: 0
- Open accepted P2 risks: 2
- Incomplete accepted P2 risks: 0
- Accepted P2 evidence-count issues: 0
- Rollback plan actionable: yes
- Production monitoring ready: yes
- Paid path ready: yes
- Accessibility ready: yes
- Design system ready: yes
- Planner map actuals ready: yes
- Planner handoff ready: yes (17/17, Athens days: 5)
- Public share map/itinerary catalog ready: yes (7/7 public shares, 14 viewports)
- Public metadata ready: yes (6/6)
- Release candidate ready: yes
- Full route inventory ready: yes
- Authenticated app surfaces ready: yes
- Production authenticated app surfaces ready: yes

## Public-Launch Blockers

- beta-human-review-threshold: 0/25 completed; 25 remaining.
- production-visual-review-history: 2/4 distinct review dates recorded; 2 remaining.

## Guardrail Issues

- none

## Evidence Queue Issues

Beta human-review queue:
- none

Beta human-review schedule:
- none

Beta human-review command center:
- none

Beta human-review next-wave ops:
- none

Beta human-review dispatch outbox:
- none

Beta human-review dispatch log:
- none

Beta human-review follow-up outbox:
- none

Beta human-review all-wave ops:
- none

Beta human-review wave rehearsal:
- none

Beta human-review matrix rehearsal:
- none

Beta human-review production guest-start rehearsal:
- none

Production visual-review progress:
- none

Production visual-review queue:
- none

Production visual-review dispatch outbox:
- none

Production visual-review dispatch log:
- none

Public launch blocker board:
- none

Launch operator today:
- none

Launch operator overdue rehearsal:
- none

Launch operator sent-dispatch rehearsal:
- none

Dispatch mark-sent dry run:
- none

Dispatch mark-sent import rehearsal:
- none

Dispatch sent-record template:
- none

Launch outreach brief:
- none

Dispatch sent-record commands:
- JSON validation: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.json npm run qa:dispatch-mark-sent`
- JSON import after real sends: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.json npm run qa:dispatch-mark-sent`
- CSV validation: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent`
- CSV import after real sends: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent`
- Post-import checks: `npm run qa:launch-refresh`, `npm run qa:launch-signoff`

Dispatch sent-record blank-template rejection:
- none

Review intake rehearsal:
- none

Review intake import rehearsal:
- none

Public launch mode rehearsal:
- none

Public launch threshold rehearsal:
- none

Full route inventory:
- none

Authenticated app surfaces:
- none

Production authenticated app surfaces:
- none

Planner handoff:
- none

Public share map/itinerary integrity:
- none

Public metadata:
- none

## Next Actions

- Send or escalate 10 overdue beta review dispatch message(s) from qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21.json, then record sent evidence with qa/dispatch-sent-record-template-2026-05-27.csv, run QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent to validate it, run QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent to import the sent state, then rerun npm run qa:launch-refresh and npm run qa:launch-signoff.
- Send 1 production visual-review request(s) due soon from qa/production-visual-review-dispatch-outbox-2026-05-26.json, then record sent evidence with qa/dispatch-sent-record-template-2026-05-27.csv, run QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent to validate it, run QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent to import the sent state, then rerun npm run qa:launch-refresh and npm run qa:launch-signoff.
- Collect and import 25 completed beta review submission(s).
- Run, review, and import 2 scheduled production visual review date(s).

## Evidence

- Beta register: `qa/beta-human-review-register.json`
- Beta progress: `qa/beta-human-review-progress-2026-05-21.json`
- Beta intake: `qa/beta-human-review-intake-2026-05-21.json`
- Beta packet manifest: `qa/beta-human-review-packet-manifest-2026-05-21.json`
- Beta assignment board: `qa/beta-human-review-assignments-2026-05-21.md` and `qa/beta-human-review-assignments-2026-05-21.csv`
- Beta execution schedule: `qa/beta-human-review-schedule-2026-05-21.json`, `qa/beta-human-review-schedule-2026-05-21.md`, and `qa/beta-human-review-schedule-assignments-2026-05-21.csv`
- Beta command center: `qa/beta-human-review-command-center-2026-05-21.json` and `qa/beta-human-review-command-center-2026-05-21.md`
- Beta next-wave ops: `qa/beta-human-review-next-wave-ops-2026-05-21.json`, `qa/beta-human-review-next-wave-ops-2026-05-21.md`, and `qa/beta-human-review-next-wave-ops-2026-05-21.csv`
- Beta dispatch outbox: `qa/beta-human-review-dispatch-outbox-2026-05-21.json`, `qa/beta-human-review-dispatch-outbox-2026-05-21.md`, `qa/beta-human-review-dispatch-outbox-2026-05-21.csv`, and `qa/beta-human-review-dispatch-outbox-2026-05-21`
- Beta dispatch log: `qa/beta-human-review-dispatch-log-2026-05-21.json`, `qa/beta-human-review-dispatch-log-2026-05-21.md`, and `qa/beta-human-review-dispatch-log-2026-05-21.csv`
- Beta follow-up outbox: `qa/beta-human-review-follow-up-outbox-2026-05-21.json`, `qa/beta-human-review-follow-up-outbox-2026-05-21.md`, `qa/beta-human-review-follow-up-outbox-2026-05-21.csv`, and `qa/beta-human-review-follow-up-outbox-2026-05-21`
- Beta all-wave ops: `qa/beta-human-review-all-wave-ops-2026-05-21.json`, `qa/beta-human-review-all-wave-ops-2026-05-21.md`, and `qa/beta-human-review-all-wave-ops-2026-05-21.csv`
- Beta wave rehearsal: `qa/beta-human-review-wave-rehearsal-2026-05-22.json` and `qa/beta-human-review-wave-rehearsal-2026-05-22.md`
- Beta matrix rehearsal: `qa/beta-human-review-matrix-rehearsal-2026-05-22.json` and `qa/beta-human-review-matrix-rehearsal-2026-05-22.md`
- Beta guest-start rehearsal: `qa/beta-human-review-guest-start-rehearsal-2026-05-22.json` and `qa/beta-human-review-guest-start-rehearsal-2026-05-22.md`
- Public launch blocker board: `qa/public-launch-blocker-board-2026-05-21.md`, `qa/public-launch-blocker-board-2026-05-21.csv`, and `qa/public-launch-blocker-board-2026-05-21.json`
- Launch operator today: `qa/launch-operator-today-2026-05-27.md`, `qa/launch-operator-today-2026-05-27.csv`, and `qa/launch-operator-today-2026-05-27.json`
- Launch operator sent-dispatch rehearsal: `qa/launch-operator-sent-dispatch-rehearsal-2026-05-27.md` and `qa/launch-operator-sent-dispatch-rehearsal-2026-05-27.json`
- Dispatch mark-sent dry run: `qa/dispatch-log-mark-sent-2026-05-27.md` and `qa/dispatch-log-mark-sent-2026-05-27.json`
- Dispatch mark-sent import rehearsal: `qa/dispatch-log-mark-sent-import-rehearsal-2026-05-27.md` and `qa/dispatch-log-mark-sent-import-rehearsal-2026-05-27.json`
- Dispatch sent-record template: `qa/dispatch-sent-record-template-2026-05-27.md`, `qa/dispatch-sent-record-template-2026-05-27.csv`, and `qa/dispatch-sent-record-template-2026-05-27.json`
- Launch outreach brief: `qa/launch-outreach-brief-2026-05-27.md`, `qa/launch-outreach-brief-2026-05-27.csv`, and `qa/launch-outreach-brief-2026-05-27.json`
- Dispatch sent-record blank-template rejection: `qa/dispatch-sent-record-template-rejection-2026-05-27.md` and `qa/dispatch-sent-record-template-rejection-2026-05-27.json`
- Review intake import rehearsal: `qa/review-intake-import-rehearsal-2026-05-27.md` and `qa/review-intake-import-rehearsal-2026-05-27.json`
- Public launch threshold rehearsal: `qa/public-launch-threshold-rehearsal-2026-05-27.md` and `qa/public-launch-threshold-rehearsal-2026-05-27.json`
- Visual register: `qa/production-visual-review-register.json`
- Visual progress: `qa/production-visual-review-progress-2026-05-26.json`
- Latest production visual artifact: `qa/visual-baseline-production-runtime-current-2026-05-27-c3456d5` and `qa/visual-baseline-production-runtime-current-2026-05-27-c3456d5/summary.json`
- Visual schedule: `qa/production-visual-review-schedule-2026-05-21.md`
- Visual intake: `qa/production-visual-review-intake-2026-05-21.json`
- Visual assignment board: `qa/production-visual-review-assignments-2026-05-21.md` and `qa/production-visual-review-assignments-2026-05-21.csv`
- Visual dispatch outbox: `qa/production-visual-review-dispatch-outbox-2026-05-26.json`, `qa/production-visual-review-dispatch-outbox-2026-05-26.md`, `qa/production-visual-review-dispatch-outbox-2026-05-26.csv`, and `qa/production-visual-review-dispatch-outbox-2026-05-26`
- Visual dispatch log: `qa/production-visual-review-dispatch-log-2026-05-26.json`, `qa/production-visual-review-dispatch-log-2026-05-26.md`, and `qa/production-visual-review-dispatch-log-2026-05-26.csv`
- Visual submission templates: `qa/production-visual-review-submissions-2026-05-21`
- Monitoring register: `qa/production-monitoring-register.json`
- Rollback plan: `qa/launch-rollback-plan.json`
- Risk register: `qa/launch-risk-register.json`
- Paid-path readiness: `qa/paid-path-readiness-2026-05-23.json`
- Accessibility: `qa/accessibility-keyboard-production-guest-2026-05-26/summary.json`
- Design-system readiness: `qa/design-system-readiness-2026-05-27.json`
- Planner actuals: `qa/release-candidate-full-with-multi-planner-2026-05-21/planner-generated-actuals-regional-edge-cities.json`
- Planner handoff: `qa/planner-handoff-smoke-2026-05-26.json` and `qa/planner-handoff-smoke-2026-05-26.md`
- Public share map/itinerary integrity: `qa/public-share-map-catalog-2026-05-26.json` and `qa/public-share-map-catalog-2026-05-26.md`
- Public metadata, manifest, robots, and sitemap: `qa/public-metadata-smoke-2026-05-26.json` and `qa/public-metadata-smoke-2026-05-26.md`
- Release candidate: `qa/release-candidate-full-with-multi-planner-2026-05-21/summary.json`
- Full route inventory: `qa/route-inventory-smoke-2026-05-26.json`
- Authenticated app surfaces: `qa/app-surfaces-smoke-2026-05-26.json`
- Production authenticated app surfaces: `qa/app-surfaces-production-guest-2026-05-26.json`

## Operating Meaning

Default mode may pass while public launch is blocked, because the remaining blockers require real human-review and visual-review history. Run with `QA_LAUNCH_STATUS_REQUIRE_PUBLIC=1` to make this command fail until public launch is truly ready.
