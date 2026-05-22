# Beta Human Review Schedule

Date: 2026-05-21
Status: pass

## Operator Instructions

- Assign every scheduled row to a real reviewer before kickoff.
- Keep each reviewer on the scheduled device and viewport lens.
- Send the reviewer the packet path and matching JSON submission template path.
- Copy a template to a non-template `.json` file only after that review is actually complete.
- Run `npm run qa:beta-review-intake`, then `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` only when validation is clean.
- Re-run `npm run qa:beta-review-progress`, `npm run qa:beta-review-schedule`, `npm run qa:public-launch-status`, and `npm run qa:launch-signoff` after import.

## Wave Summary

- BETA-WAVE-01: 2026-05-22 to 2026-05-25; 5 reviews
- BETA-WAVE-02: 2026-05-26 to 2026-05-27; 5 reviews
- BETA-WAVE-03: 2026-05-28 to 2026-05-29; 5 reviews
- BETA-WAVE-04: 2026-06-01 to 2026-06-02; 5 reviews
- BETA-WAVE-05: 2026-06-03 to 2026-06-04; 5 reviews

## Scheduled Review Matrix

| ID | Wave | Due | Cohort | Device | Destination | Packet | Submission Template |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | BETA-WAVE-01 | 2026-05-25 | continuity reviewer | phone 390x844 | Athens | `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json` |
| BETA-HR-002 | BETA-WAVE-01 | 2026-05-25 | share-feedback reviewer | desktop 1440x950 | Lisbon | `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json` |
| BETA-HR-003 | BETA-WAVE-01 | 2026-05-25 | mobile planner reviewer | phone 390x844 | Barcelona | `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json` |
| BETA-HR-004 | BETA-WAVE-01 | 2026-05-25 | share-feedback reviewer | desktop 1440x950 | Paris | `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json` |
| BETA-HR-005 | BETA-WAVE-01 | 2026-05-25 | continuity reviewer | desktop 1440x950 | New York | `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json` |
| BETA-HR-006 | BETA-WAVE-02 | 2026-05-27 | share-feedback reviewer | phone 390x844 | Istanbul | `qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.template.json` |
| BETA-HR-007 | BETA-WAVE-02 | 2026-05-27 | desktop trip-studio reviewer | desktop 1440x950 | Seoul | `qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.template.json` |
| BETA-HR-008 | BETA-WAVE-02 | 2026-05-27 | share-feedback reviewer | phone 390x844 | Bangkok | `qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.template.json` |
| BETA-HR-009 | BETA-WAVE-02 | 2026-05-27 | desktop trip-studio reviewer | desktop 1440x950 | Marrakech | `qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.template.json` |
| BETA-HR-010 | BETA-WAVE-02 | 2026-05-27 | share-feedback reviewer | phone 390x844 | Cape Town | `qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.template.json` |
| BETA-HR-011 | BETA-WAVE-03 | 2026-05-29 | desktop trip-studio reviewer | desktop 1440x950 | Sydney | `qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.template.json` |
| BETA-HR-012 | BETA-WAVE-03 | 2026-05-29 | share-feedback reviewer | phone 390x844 | Vancouver | `qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.template.json` |
| BETA-HR-013 | BETA-WAVE-03 | 2026-05-29 | share-feedback reviewer | desktop 1440x950 | Rio de Janeiro | `qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.template.json` |
| BETA-HR-014 | BETA-WAVE-03 | 2026-05-29 | continuity reviewer | phone 390x844 | Reykjavik | `qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.template.json` |
| BETA-HR-015 | BETA-WAVE-03 | 2026-05-29 | share-feedback reviewer | desktop 1440x950 | Crete | `qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.template.json` |
| BETA-HR-016 | BETA-WAVE-04 | 2026-06-02 | mobile planner reviewer | phone 390x844 | Singapore | `qa/beta-human-review-packets-2026-05-21/BETA-HR-016-singapore.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-016-singapore.template.json` |
| BETA-HR-017 | BETA-WAVE-04 | 2026-06-02 | share-feedback reviewer | desktop 1440x950 | Dubai | `qa/beta-human-review-packets-2026-05-21/BETA-HR-017-dubai.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-017-dubai.template.json` |
| BETA-HR-018 | BETA-WAVE-04 | 2026-06-02 | continuity reviewer | phone 390x844 | Madrid and Seville | `qa/beta-human-review-packets-2026-05-21/BETA-HR-018-madrid-and-seville.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-018-madrid-and-seville.template.json` |
| BETA-HR-019 | BETA-WAVE-04 | 2026-06-02 | desktop trip-studio reviewer | desktop 1440x950 | Kyoto | `qa/beta-human-review-packets-2026-05-21/BETA-HR-019-kyoto.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-019-kyoto.template.json` |
| BETA-HR-020 | BETA-WAVE-04 | 2026-06-02 | continuity reviewer | phone 390x844 | Seattle | `qa/beta-human-review-packets-2026-05-21/BETA-HR-020-seattle.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-020-seattle.template.json` |
| BETA-HR-021 | BETA-WAVE-05 | 2026-06-04 | desktop trip-studio reviewer | desktop 1440x950 | Bali | `qa/beta-human-review-packets-2026-05-21/BETA-HR-021-bali.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-021-bali.template.json` |
| BETA-HR-022 | BETA-WAVE-05 | 2026-06-04 | share-feedback reviewer | phone 390x844 | Nairobi | `qa/beta-human-review-packets-2026-05-21/BETA-HR-022-nairobi.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-022-nairobi.template.json` |
| BETA-HR-023 | BETA-WAVE-05 | 2026-06-04 | continuity reviewer | desktop 1440x950 | Washington DC | `qa/beta-human-review-packets-2026-05-21/BETA-HR-023-washington-dc.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-023-washington-dc.template.json` |
| BETA-HR-024 | BETA-WAVE-05 | 2026-06-04 | share-feedback reviewer | phone 390x844 | Mexico City | `qa/beta-human-review-packets-2026-05-21/BETA-HR-024-mexico-city.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-024-mexico-city.template.json` |
| BETA-HR-025 | BETA-WAVE-05 | 2026-06-04 | continuity reviewer | desktop 1440x950 | London | `qa/beta-human-review-packets-2026-05-21/BETA-HR-025-london.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-025-london.template.json` |

## Launch Rule

Public launch still requires 25 completed reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts. This schedule is an execution aid, not completed review evidence.
