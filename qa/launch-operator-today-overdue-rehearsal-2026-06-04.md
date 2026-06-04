# Launch Operator Overdue Rehearsal

Date: 2026-06-04
Simulated today: 2026-05-23
Status: pass

## Result

- Checked: 7
- Passed: 7
- Failed: 0
- Launch operator exit code: 1
- Beta dispatch overdue rows detected: 5
- Visual overdue rows detected: 0
- Raw failure artifacts cleaned up: yes

## Operating Meaning

This rehearsal proves `npm run qa:launch-today` fails when launch execution rows become overdue, names simulated-date artifacts away from the real current-day board, and leaves the current actionable board intact.

## Checks

- Pass: overdue rehearsal produced a launch-operator artifact
- Pass: overdue rehearsal uses isolated simulated date
- Pass: overdue rehearsal exits non-zero
- Pass: overdue rehearsal fails the daily board
- Pass: overdue rehearsal detects overdue launch execution rows
- Pass: overdue rehearsal failure reason is explicit
- Pass: current launch operator artifact remains actionable

## Failures

- none
