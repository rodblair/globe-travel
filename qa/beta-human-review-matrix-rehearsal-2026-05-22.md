# Beta Human Review Wave Rehearsal

Date: 2026-05-22
Scope: matrix
Status: pass
Next-wave ops: `qa/beta-human-review-next-wave-ops-2026-05-21.json`
Packet manifest: `qa/beta-human-review-packet-manifest-2026-05-21.json`

## Result

- Checked: 25
- Passed: 25
- Failed: 0
- Expected review count: 25
- Non-mutating: yes
- Remote guest start exercised: no
- Remote guest start exercise count: 0
- Remote guest start cleanup failures: 0

## Coverage

| Review | Destination | Viewport | Start result | Packet/template result | Screenshot |
| --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | Athens | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-001-athens.png` |
| BETA-HR-002 | Lisbon | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-002-lisbon.png` |
| BETA-HR-003 | Barcelona | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-003-barcelona.png` |
| BETA-HR-004 | Paris | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-004-paris.png` |
| BETA-HR-005 | New York | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-005-new-york.png` |
| BETA-HR-006 | Istanbul | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-006-istanbul.png` |
| BETA-HR-007 | Seoul | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-007-seoul.png` |
| BETA-HR-008 | Bangkok | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-008-bangkok.png` |
| BETA-HR-009 | Marrakech | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-009-marrakech.png` |
| BETA-HR-010 | Cape Town | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-010-cape-town.png` |
| BETA-HR-011 | Sydney | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-011-sydney.png` |
| BETA-HR-012 | Vancouver | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-012-vancouver.png` |
| BETA-HR-013 | Rio de Janeiro | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-013-rio-de-janeiro.png` |
| BETA-HR-014 | Reykjavik | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-014-reykjavik.png` |
| BETA-HR-015 | Crete | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-015-crete.png` |
| BETA-HR-016 | Singapore | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-016-singapore.png` |
| BETA-HR-017 | Dubai | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-017-dubai.png` |
| BETA-HR-018 | Madrid and Seville | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-018-madrid-and-seville.png` |
| BETA-HR-019 | Kyoto | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-019-kyoto.png` |
| BETA-HR-020 | Seattle | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-020-seattle.png` |
| BETA-HR-021 | Bali | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-021-bali.png` |
| BETA-HR-022 | Nairobi | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-022-nairobi.png` |
| BETA-HR-023 | Washington DC | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-023-washington-dc.png` |
| BETA-HR-024 | Mexico City | 390x844 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-024-mexico-city.png` |
| BETA-HR-025 | London | 1440x950 | Pass | Pass | `qa/beta-human-review-matrix-rehearsal-2026-05-22/screenshots/beta-hr-025-london.png` |

## Failures

- none

## Operating Meaning

This preflight does not count as a completed beta review and does not replace human evidence. It proves the planned beta reviewer matrix opens cleanly in a browser, every start URL preserves the assigned prompt through auth and guest-entry handoff, and each reviewer packet/template pair matches the packet manifest record before people spend time on the review.

When `QA_BETA_REVIEW_WAVE_REHEARSAL_ALLOW_REMOTE_GUEST_START=1` is set, the rehearsal also clicks a limited number of guest-start links, confirms the Planner handoff, and removes the disposable guest account. That mode is intentionally opt-in because it touches production guest state.
