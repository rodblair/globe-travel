# Beta Human Review Command Center

Date: 2026-05-21
Today: 2026-05-26
Status: fail

## Result

- Checked: 5
- Passed: 4
- Failed: 1
- Planned reviews: 25
- Completed reviews: 0
- Remaining for public launch: 25
- Open P0/P1 review ids: 0

## Next Operator Move

Run BETA-WAVE-01: 5/5 reviews still need completed submissions by 2026-05-25.

Immediate workflow:
- Assign or confirm real reviewers for the next open wave.
- Send each reviewer their packet path and submission template.
- Save completed submissions as non-template JSON files in `qa/beta-human-review-submissions-2026-05-21`.
- Run `npm run qa:beta-review-intake`; if clean, run `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake`.
- Re-run `npm run qa:beta-review-progress`, `npm run qa:beta-review-command-center`, `npm run qa:launch-refresh`, and `npm run qa:launch-signoff`.

## Wave Board

| Wave | Kickoff | Due | Status | Completed | Remaining | Cohorts |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-WAVE-01 | 2026-05-22 | 2026-05-25 | overdue | 0/5 | 5 | continuity reviewer, share-feedback reviewer, mobile planner reviewer |
| BETA-WAVE-02 | 2026-05-26 | 2026-05-27 | open | 0/5 | 5 | share-feedback reviewer, desktop trip-studio reviewer |
| BETA-WAVE-03 | 2026-05-28 | 2026-05-29 | open | 0/5 | 5 | desktop trip-studio reviewer, share-feedback reviewer, continuity reviewer |
| BETA-WAVE-04 | 2026-06-01 | 2026-06-02 | open | 0/5 | 5 | mobile planner reviewer, share-feedback reviewer, continuity reviewer, desktop trip-studio reviewer |
| BETA-WAVE-05 | 2026-06-03 | 2026-06-04 | open | 0/5 | 5 | desktop trip-studio reviewer, share-feedback reviewer, continuity reviewer |

## Due Soon

- BETA-WAVE-02: 5 remaining, due 2026-05-27
- BETA-WAVE-03: 5 remaining, due 2026-05-29

## Overdue

- BETA-WAVE-01: 5 remaining, due 2026-05-25

## Checks

- Pass: beta command center inputs are passing and aligned
- Pass: beta command center has one scheduled packet-backed row per planned review
- Pass: beta command center exposes the next executable wave
- Fail: beta command center has no overdue review waves
- Pass: beta command center keeps launch blockers explicit

## Evidence Inputs

- Register: `qa/beta-human-review-register.json`
- Schedule: `qa/beta-human-review-schedule-2026-05-21.json`
- Packet manifest: `qa/beta-human-review-packet-manifest-2026-05-21.json`
- Progress: `qa/beta-human-review-progress-2026-05-21.json`
- Intake: `qa/beta-human-review-intake-2026-05-21.json`

## Launch Rule

This command center is an operating artifact, not completed review evidence. Public launch still requires 25 completed beta human reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts.
