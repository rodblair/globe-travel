# Beta Human Review Wave Rehearsal

Date: 2026-05-22
Scope: wave
Status: pass
Next-wave ops: `qa/beta-human-review-next-wave-ops-2026-05-21.json`
Packet manifest: `qa/beta-human-review-packet-manifest-2026-05-21.json`

## Result

- Checked: 5
- Passed: 5
- Failed: 0
- Expected review count: 5
- Non-mutating: no
- Remote guest start exercised: yes
- Remote guest start exercise count: 1
- Remote guest start cleanup failures: 0

## Coverage

| Review | Destination | Viewport | Start result | Packet/template result | Screenshot |
| --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | Athens | 390x844 | Pass | Pass | `qa/beta-human-review-guest-start-rehearsal-2026-05-22/screenshots/beta-hr-001-athens.png` |
| BETA-HR-002 | Lisbon | 1440x950 | Pass | Pass | `qa/beta-human-review-guest-start-rehearsal-2026-05-22/screenshots/beta-hr-002-lisbon.png` |
| BETA-HR-003 | Barcelona | 390x844 | Pass | Pass | `qa/beta-human-review-guest-start-rehearsal-2026-05-22/screenshots/beta-hr-003-barcelona.png` |
| BETA-HR-004 | Paris | 1440x950 | Pass | Pass | `qa/beta-human-review-guest-start-rehearsal-2026-05-22/screenshots/beta-hr-004-paris.png` |
| BETA-HR-005 | New York | 1440x950 | Pass | Pass | `qa/beta-human-review-guest-start-rehearsal-2026-05-22/screenshots/beta-hr-005-new-york.png` |

## Failures

- none

## Operating Meaning

This preflight does not count as a completed beta review and does not replace human evidence. It proves the active reviewer wave opens cleanly in a browser, every start URL preserves the assigned prompt through auth and guest-entry handoff, and each reviewer packet/template pair matches the operator row before people spend time on the review.

When `QA_BETA_REVIEW_WAVE_REHEARSAL_ALLOW_REMOTE_GUEST_START=1` is set, the rehearsal also clicks a limited number of guest-start links, confirms the Planner handoff, and removes the disposable guest account. That mode is intentionally opt-in because it touches production guest state.
