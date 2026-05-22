# Beta Human Review All-Wave Ops

Date: 2026-05-21
Today: 2026-05-22
Scope: all-waves
Status: pass

## Result

- Checked: 4
- Passed: 4
- Failed: 0
- Next wave: BETA-WAVE-01
- Waves covered: 5/5
- Rows ready to send: 25
- Due: 2026-05-25

## Operator Workflow

- Assign a named human reviewer to each row before sending.
- Send the packet path, start URL, and completed-submission filename from the row.
- Keep `.template.json` files unchanged; completed reviews must be non-template JSON files.
- Run `npm run qa:beta-review-intake`; only import with `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` after validation is clean.
- Re-run `npm run qa:beta-review-progress`, `npm run qa:beta-review-command-center`, `npm run qa:beta-review-next-wave-ops`, `npm run qa:public-launch-status`, and `npm run qa:launch-signoff`.

## Operator Rows

| ID | Cohort | Device | Destination | Due | Packet | Completed File |
| --- | --- | --- | --- | --- | --- | --- |
| BETA-HR-001 | continuity reviewer | phone 390x844 | Athens | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json` |
| BETA-HR-002 | share-feedback reviewer | desktop 1440x950 | Lisbon | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json` |
| BETA-HR-003 | mobile planner reviewer | phone 390x844 | Barcelona | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json` |
| BETA-HR-004 | share-feedback reviewer | desktop 1440x950 | Paris | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json` |
| BETA-HR-005 | continuity reviewer | desktop 1440x950 | New York | 2026-05-25 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json` |
| BETA-HR-006 | share-feedback reviewer | phone 390x844 | Istanbul | 2026-05-27 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json` |
| BETA-HR-007 | desktop trip-studio reviewer | desktop 1440x950 | Seoul | 2026-05-27 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json` |
| BETA-HR-008 | share-feedback reviewer | phone 390x844 | Bangkok | 2026-05-27 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json` |
| BETA-HR-009 | desktop trip-studio reviewer | desktop 1440x950 | Marrakech | 2026-05-27 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json` |
| BETA-HR-010 | share-feedback reviewer | phone 390x844 | Cape Town | 2026-05-27 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json` |
| BETA-HR-011 | desktop trip-studio reviewer | desktop 1440x950 | Sydney | 2026-05-29 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json` |
| BETA-HR-012 | share-feedback reviewer | phone 390x844 | Vancouver | 2026-05-29 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json` |
| BETA-HR-013 | share-feedback reviewer | desktop 1440x950 | Rio de Janeiro | 2026-05-29 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json` |
| BETA-HR-014 | continuity reviewer | phone 390x844 | Reykjavik | 2026-05-29 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json` |
| BETA-HR-015 | share-feedback reviewer | desktop 1440x950 | Crete | 2026-05-29 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json` |
| BETA-HR-016 | mobile planner reviewer | phone 390x844 | Singapore | 2026-06-02 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-016-singapore.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-016-singapore.json` |
| BETA-HR-017 | share-feedback reviewer | desktop 1440x950 | Dubai | 2026-06-02 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-017-dubai.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-017-dubai.json` |
| BETA-HR-018 | continuity reviewer | phone 390x844 | Madrid and Seville | 2026-06-02 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-018-madrid-and-seville.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-018-madrid-and-seville.json` |
| BETA-HR-019 | desktop trip-studio reviewer | desktop 1440x950 | Kyoto | 2026-06-02 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-019-kyoto.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-019-kyoto.json` |
| BETA-HR-020 | continuity reviewer | phone 390x844 | Seattle | 2026-06-02 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-020-seattle.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-020-seattle.json` |
| BETA-HR-021 | desktop trip-studio reviewer | desktop 1440x950 | Bali | 2026-06-04 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-021-bali.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-021-bali.json` |
| BETA-HR-022 | share-feedback reviewer | phone 390x844 | Nairobi | 2026-06-04 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-022-nairobi.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-022-nairobi.json` |
| BETA-HR-023 | continuity reviewer | desktop 1440x950 | Washington DC | 2026-06-04 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-023-washington-dc.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-023-washington-dc.json` |
| BETA-HR-024 | share-feedback reviewer | phone 390x844 | Mexico City | 2026-06-04 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-024-mexico-city.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-024-mexico-city.json` |
| BETA-HR-025 | continuity reviewer | desktop 1440x950 | London | 2026-06-04 | `qa/beta-human-review-packets-2026-05-21/BETA-HR-025-london.md` | `qa/beta-human-review-submissions-2026-05-21/BETA-HR-025-london.json` |

## Reviewer Message Drafts

### BETA-HR-001: Athens

Subject: [Globe.travel beta] BETA-HR-001 Athens review due 2026-05-25

You are assigned BETA-HR-001 for wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+restful+5-day+Athens+trip+for+a+couple+with+culture%2C+food%2C+and+recovery+time. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-001-athens.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-002: Lisbon

Subject: [Globe.travel beta] BETA-HR-002 Lisbon review due 2026-05-25

You are assigned BETA-HR-002 for wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Lisbon+trip+for+friends+who+want+food%2C+viewpoints%2C+and+nightlife. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-002-lisbon.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-002-lisbon.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-003: Barcelona

Subject: [Globe.travel beta] BETA-HR-003 Barcelona review due 2026-05-25

You are assigned BETA-HR-003 for wave BETA-WAVE-01. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+budget+3-day+Barcelona+beach+and+neighborhood+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-003-barcelona.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-003-barcelona.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-004: Paris

Subject: [Globe.travel beta] BETA-HR-004 Paris review due 2026-05-25

You are assigned BETA-HR-004 for wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+premium+4-day+Paris+trip+for+a+couple+with+restaurants%2C+art%2C+and+romantic+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-004-paris.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-004-paris.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-005: New York

Subject: [Globe.travel beta] BETA-HR-005 New York review due 2026-05-25

You are assigned BETA-HR-005 for wave BETA-WAVE-01. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+New+York+trip+for+repeat+visitors+who+want+neighborhoods%2C+food%2C+and+fresh+ideas. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-005-new-york.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-005-new-york.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-006: Istanbul

Subject: [Globe.travel beta] BETA-HR-006 Istanbul review due 2026-05-27

You are assigned BETA-HR-006 for wave BETA-WAVE-02. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Istanbul+history+and+markets+trip+for+a+small+group. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-006-istanbul.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-006-istanbul.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-007: Seoul

Subject: [Globe.travel beta] BETA-HR-007 Seoul review due 2026-05-27

You are assigned BETA-HR-007 for wave BETA-WAVE-02. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Seoul+food+and+shopping+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-007-seoul.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-007-seoul.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-008: Bangkok

Subject: [Globe.travel beta] BETA-HR-008 Bangkok review due 2026-05-27

You are assigned BETA-HR-008 for wave BETA-WAVE-02. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Bangkok+trip+with+temples%2C+street+food%2C+and+easy+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-008-bangkok.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-008-bangkok.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-009: Marrakech

Subject: [Globe.travel beta] BETA-HR-009 Marrakech review due 2026-05-27

You are assigned BETA-HR-009 for wave BETA-WAVE-02. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Marrakech+trip+around+markets%2C+riads%2C+food%2C+and+culture. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-009-marrakech.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-009-marrakech.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-010: Cape Town

Subject: [Globe.travel beta] BETA-HR-010 Cape Town review due 2026-05-27

You are assigned BETA-HR-010 for wave BETA-WAVE-02. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Cape+Town+outdoors+and+food+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-010-cape-town.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-010-cape-town.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-011: Sydney

Subject: [Globe.travel beta] BETA-HR-011 Sydney review due 2026-05-29

You are assigned BETA-HR-011 for wave BETA-WAVE-03. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Sydney+trip+for+beaches%2C+neighborhoods%2C+and+easy+food+stops. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-011-sydney.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-011-sydney.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-012: Vancouver

Subject: [Globe.travel beta] BETA-HR-012 Vancouver review due 2026-05-29

You are assigned BETA-HR-012 for wave BETA-WAVE-03. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Vancouver+outdoors+and+food+trip+for+a+mixed+group. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-012-vancouver.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-012-vancouver.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-013: Rio de Janeiro

Subject: [Globe.travel beta] BETA-HR-013 Rio de Janeiro review due 2026-05-29

You are assigned BETA-HR-013 for wave BETA-WAVE-03. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Rio+beach+and+nightlife+trip+for+friends. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-013-rio-de-janeiro.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-013-rio-de-janeiro.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-014: Reykjavik

Subject: [Globe.travel beta] BETA-HR-014 Reykjavik review due 2026-05-29

You are assigned BETA-HR-014 for wave BETA-WAVE-03. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Reykjavik+outdoors+trip+with+weather-safe+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-014-reykjavik.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-014-reykjavik.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-015: Crete

Subject: [Globe.travel beta] BETA-HR-015 Crete review due 2026-05-29

You are assigned BETA-HR-015 for wave BETA-WAVE-03. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Crete+family+beach+trip+with+culture+and+relaxed+travel+days. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-015-crete.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-015-crete.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-016: Singapore

Subject: [Globe.travel beta] BETA-HR-016 Singapore review due 2026-06-02

You are assigned BETA-HR-016 for wave BETA-WAVE-04. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Singapore+family+food+trip+with+easy+transit+and+heat-aware+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-016-singapore.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-016-singapore.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-017: Dubai

Subject: [Globe.travel beta] BETA-HR-017 Dubai review due 2026-06-02

You are assigned BETA-HR-017 for wave BETA-WAVE-04. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+luxury+Dubai+family+trip+with+indoor+options+and+clear+logistics. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-017-dubai.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-017-dubai.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-018: Madrid and Seville

Subject: [Globe.travel beta] BETA-HR-018 Madrid and Seville review due 2026-06-02

You are assigned BETA-HR-018 for wave BETA-WAVE-04. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+Madrid+and+Seville+trip+with+food%2C+culture%2C+and+intercity+flow. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-018-madrid-and-seville.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-018-madrid-and-seville.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-019: Kyoto

Subject: [Globe.travel beta] BETA-HR-019 Kyoto review due 2026-06-02

You are assigned BETA-HR-019 for wave BETA-WAVE-04. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+solo+Kyoto+trip+with+temples%2C+food%2C+and+calm+pacing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-019-kyoto.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-019-kyoto.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-020: Seattle

Subject: [Globe.travel beta] BETA-HR-020 Seattle review due 2026-06-02

You are assigned BETA-HR-020 for wave BETA-WAVE-04. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+2-day+solo+Seattle+coffee+and+music+trip. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-020-seattle.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-020-seattle.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-021: Bali

Subject: [Globe.travel beta] BETA-HR-021 Bali review due 2026-06-04

You are assigned BETA-HR-021 for wave BETA-WAVE-05. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+5-day+solo+Bali+reset+trip+with+wellness%2C+food%2C+and+gentle+exploration. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-021-bali.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-021-bali.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-022: Nairobi

Subject: [Globe.travel beta] BETA-HR-022 Nairobi review due 2026-06-04

You are assigned BETA-HR-022 for wave BETA-WAVE-05. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+solo+Nairobi+culture+and+nature+trip. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-022-nairobi.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-022-nairobi.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-023: Washington DC

Subject: [Globe.travel beta] BETA-HR-023 Washington DC review due 2026-06-04

You are assigned BETA-HR-023 for wave BETA-WAVE-05. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+Washington+DC+museums+trip+for+a+family. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-023-washington-dc.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-023-washington-dc.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-024: Mexico City

Subject: [Globe.travel beta] BETA-HR-024 Mexico City review due 2026-06-04

You are assigned BETA-HR-024 for wave BETA-WAVE-05. Please use phone 390x844, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+4-day+Mexico+City+trip+with+food%2C+museums%2C+and+nightlife. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-024-mexico-city.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-024-mexico-city.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.

### BETA-HR-025: London

Subject: [Globe.travel beta] BETA-HR-025 London review due 2026-06-04

You are assigned BETA-HR-025 for wave BETA-WAVE-05. Please use desktop 1440x950, start here: https://globe-travel-two.vercel.app/chat?q=Plan+a+3-day+rain-safe+London+trip+for+friends+with+museums%2C+food%2C+and+flexible+timing. Read the packet at qa/beta-human-review-packets-2026-05-21/BETA-HR-025-london.md, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as qa/beta-human-review-submissions-2026-05-21/BETA-HR-025-london.json. Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.


## Checks

- Pass: all-waves ops inputs are passing and aligned
- Pass: all-waves ops exposes the expected review scope
- Pass: all-waves ops has one actionable row per remaining scoped review
- Pass: all-waves ops CSV includes every scoped review id

## Failures

- none

## Launch Rule

This all-wave ops pack is an assignment and outreach artifact, not completed review evidence. Public launch still requires 25 completed beta human reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts.
