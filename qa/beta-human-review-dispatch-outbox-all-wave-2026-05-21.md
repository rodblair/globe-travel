# Beta Human Review Dispatch Outbox

Date: 2026-05-21
Today: 2026-05-26
Status: pass
Source: qa/beta-human-review-all-wave-ops-2026-05-21.json

## Result

- Checked: 4
- Passed: 4
- Failed: 0
- Scope: all-waves
- Next wave: BETA-WAVE-01
- Catch-up overdue rows allowed: yes
- Message files: 25
- Dispatch due today: 5
- Dispatch overdue: 5
- Follow-ups due soon: 10
- Follow-ups overdue: 5

## Operator Workflow

- Assign a named human reviewer for each message before sending.
- Send the matching message file, packet path, start URL, and submission-template path to the reviewer.
- Record reviewer contact outside the repo.
- Follow up no later than the row's follow-up date.
- Do not edit `.template.json` files; completed reviews must arrive as non-template JSON files.
- Validate with `npm run qa:beta-review-intake`; import only with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` after validation is clean.

## Message Files

| ID | Reviewer | Destination | Send By | Follow Up | Due | Message File |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | mobile couple beta reviewer | Athens | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-001-athens.txt` |
| BETA-HR-002 | desktop friend group beta reviewer | Lisbon | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-002-lisbon.txt` |
| BETA-HR-003 | mobile friend group beta reviewer | Barcelona | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-003-barcelona.txt` |
| BETA-HR-004 | desktop couple beta reviewer | Paris | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-004-paris.txt` |
| BETA-HR-005 | desktop friend group beta reviewer | New York | 2026-05-22 | 2026-05-24 | 2026-05-25 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-005-new-york.txt` |
| BETA-HR-006 | mobile friend group beta reviewer | Istanbul | 2026-05-26 | 2026-05-26 | 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-006-istanbul.txt` |
| BETA-HR-007 | desktop friend group beta reviewer | Seoul | 2026-05-26 | 2026-05-26 | 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-007-seoul.txt` |
| BETA-HR-008 | mobile friend group beta reviewer | Bangkok | 2026-05-26 | 2026-05-26 | 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-008-bangkok.txt` |
| BETA-HR-009 | desktop couple beta reviewer | Marrakech | 2026-05-26 | 2026-05-26 | 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-009-marrakech.txt` |
| BETA-HR-010 | mobile friend group beta reviewer | Cape Town | 2026-05-26 | 2026-05-26 | 2026-05-27 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-010-cape-town.txt` |
| BETA-HR-011 | desktop friend group beta reviewer | Sydney | 2026-05-28 | 2026-05-28 | 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-011-sydney.txt` |
| BETA-HR-012 | mobile friend group beta reviewer | Vancouver | 2026-05-28 | 2026-05-28 | 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-012-vancouver.txt` |
| BETA-HR-013 | desktop friend group beta reviewer | Rio de Janeiro | 2026-05-28 | 2026-05-28 | 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-013-rio-de-janeiro.txt` |
| BETA-HR-014 | mobile couple beta reviewer | Reykjavik | 2026-05-28 | 2026-05-28 | 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-014-reykjavik.txt` |
| BETA-HR-015 | desktop family beta reviewer | Crete | 2026-05-28 | 2026-05-28 | 2026-05-29 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-015-crete.txt` |
| BETA-HR-016 | mobile family beta reviewer | Singapore | 2026-06-01 | 2026-06-01 | 2026-06-02 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-016-singapore.txt` |
| BETA-HR-017 | desktop family beta reviewer | Dubai | 2026-06-01 | 2026-06-01 | 2026-06-02 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-017-dubai.txt` |
| BETA-HR-018 | mobile couple beta reviewer | Madrid and Seville | 2026-06-01 | 2026-06-01 | 2026-06-02 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-018-madrid-and-seville.txt` |
| BETA-HR-019 | desktop solo beta reviewer | Kyoto | 2026-06-01 | 2026-06-01 | 2026-06-02 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-019-kyoto.txt` |
| BETA-HR-020 | mobile solo beta reviewer | Seattle | 2026-06-01 | 2026-06-01 | 2026-06-02 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-020-seattle.txt` |
| BETA-HR-021 | desktop solo beta reviewer | Bali | 2026-06-03 | 2026-06-03 | 2026-06-04 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-021-bali.txt` |
| BETA-HR-022 | mobile solo beta reviewer | Nairobi | 2026-06-03 | 2026-06-03 | 2026-06-04 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-022-nairobi.txt` |
| BETA-HR-023 | desktop family beta reviewer | Washington DC | 2026-06-03 | 2026-06-03 | 2026-06-04 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-023-washington-dc.txt` |
| BETA-HR-024 | mobile friend group beta reviewer | Mexico City | 2026-06-03 | 2026-06-03 | 2026-06-04 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-024-mexico-city.txt` |
| BETA-HR-025 | desktop friend group beta reviewer | London | 2026-06-03 | 2026-06-03 | 2026-06-04 | `qa/beta-human-review-dispatch-outbox-all-wave-2026-05-21/beta-hr-025-london.txt` |

## Checks

- Pass: dispatch outbox reads passing beta-review ops source
- Pass: dispatch outbox has one message file per beta-review ops row
- Pass: dispatch outbox message rows are send-ready
- Pass: dispatch outbox CSV includes every message file and completed-submission path

## Failures

- none

## Launch Rule

This dispatch outbox is assignment and outreach evidence, not completed review evidence. Public launch still requires completed non-template reviewer JSON submissions that pass intake and are explicitly imported.
