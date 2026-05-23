# Beta Human Review Assignment Board

Date: 2026-05-21
Base URL: https://globe-travel-two.vercel.app
Status: ready for assignment

## Operator Instructions

- Assign each row to one reviewer, or split rows across reviewer cohorts while preserving the assigned device lens.
- Send the reviewer the packet path and matching JSON submission template path.
- Keep template files ending in `.template.json` unchanged; save completed reviews as non-template `.json` files in `qa/beta-human-review-submissions-2026-05-21`.
- After submissions arrive, run `npm run qa:beta-review-intake`, then `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` only when validation is clean.
- Run `npm run qa:beta-review-progress`, `npm run qa:launch-refresh`, and `npm run qa:launch-signoff` after import.

## Assignment Matrix

| ID | Destination | Audience | Style | Region | Device | Surfaces | Packet | Submission Template |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | Athens | couple | culture | Europe | phone 390x844 | planner, trip-studio, map, public-share, feedback, save-reopen | `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json` |
| BETA-HR-002 | Lisbon | friend-group | nightlife | Europe | desktop 1440x950 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.template.json` |
| BETA-HR-003 | Barcelona | friend-group | budget | Europe | phone 390x844 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.template.json` |
| BETA-HR-004 | Paris | couple | premium | Europe | desktop 1440x950 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.template.json` |
| BETA-HR-005 | New York | friend-group | food | North America | desktop 1440x950 | planner, trip-studio, map, save-reopen, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.template.json` |
| BETA-HR-006 | Istanbul | friend-group | culture | Asia | phone 390x844 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.template.json` |
| BETA-HR-007 | Seoul | friend-group | food | Asia | desktop 1440x950 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.template.json` |
| BETA-HR-008 | Bangkok | friend-group | food | Asia | phone 390x844 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.template.json` |
| BETA-HR-009 | Marrakech | couple | culture | Africa | desktop 1440x950 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.template.json` |
| BETA-HR-010 | Cape Town | friend-group | outdoors | Africa | phone 390x844 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.template.json` |
| BETA-HR-011 | Sydney | friend-group | outdoors | Oceania | desktop 1440x950 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.template.json` |
| BETA-HR-012 | Vancouver | friend-group | outdoors | North America | phone 390x844 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.template.json` |
| BETA-HR-013 | Rio de Janeiro | friend-group | nightlife | Latin America | desktop 1440x950 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.template.json` |
| BETA-HR-014 | Reykjavik | couple | outdoors | Europe | phone 390x844 | planner, trip-studio, map, save-reopen | `qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.template.json` |
| BETA-HR-015 | Crete | family | outdoors | Europe | desktop 1440x950 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.template.json` |
| BETA-HR-016 | Singapore | family | food | Asia | phone 390x844 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-016-singapore.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-016-singapore.template.json` |
| BETA-HR-017 | Dubai | family | premium | Asia | desktop 1440x950 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-017-dubai.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-017-dubai.template.json` |
| BETA-HR-018 | Madrid and Seville | couple | culture | Europe | phone 390x844 | planner, trip-studio, map, save-reopen, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-018-madrid-and-seville.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-018-madrid-and-seville.template.json` |
| BETA-HR-019 | Kyoto | solo | culture | Asia | desktop 1440x950 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-019-kyoto.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-019-kyoto.template.json` |
| BETA-HR-020 | Seattle | solo | budget | North America | phone 390x844 | planner, trip-studio, map, save-reopen | `qa/beta-human-review-packets-2026-05-21/BETA-HR-020-seattle.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-020-seattle.template.json` |
| BETA-HR-021 | Bali | solo | outdoors | Asia | desktop 1440x950 | planner, trip-studio, map, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-021-bali.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-021-bali.template.json` |
| BETA-HR-022 | Nairobi | solo | culture | Africa | phone 390x844 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-022-nairobi.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-022-nairobi.template.json` |
| BETA-HR-023 | Washington DC | family | culture | North America | desktop 1440x950 | planner, trip-studio, map, save-reopen, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-023-washington-dc.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-023-washington-dc.template.json` |
| BETA-HR-024 | Mexico City | friend-group | nightlife | Latin America | phone 390x844 | planner, trip-studio, map, public-share, feedback | `qa/beta-human-review-packets-2026-05-21/BETA-HR-024-mexico-city.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-024-mexico-city.template.json` |
| BETA-HR-025 | London | friend-group | budget | Europe | desktop 1440x950 | planner, trip-studio, map, save-reopen, public-share | `qa/beta-human-review-packets-2026-05-21/BETA-HR-025-london.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-025-london.template.json` |

## Launch Rule

Public launch still requires 25 completed reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts. This board is an assignment aid, not completed review evidence.
