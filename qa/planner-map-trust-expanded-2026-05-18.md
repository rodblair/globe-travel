# Planner And Map Trust Expanded Actuals

Date: 2026-05-18
Environment: local app at `http://localhost:3000`

## Scope

This pass advances the Month 2 planner/map trust requirement from one stable Athens actual into ten launch-relevant public itinerary actuals tied directly to prompt-suite fixture IDs.

The coverage is intentionally practical: each disposable public itinerary has real trip days, mapped places, country metadata, route rows, public share metadata, and feedback API availability. The exported actuals then run through `npm run qa:prompt-suite` so day count, mapped stop count, country consistency, and usable route count are verified against prompt expectations.

This is stronger map-trust evidence for public itinerary output. It does not replace future live AI-generation sampling for every prompt style.

## Fixture IDs Covered

- `lisbon-3-day-friends-nightlife`
- `porto-1-day-food-viewpoints`
- `mexico-city-4-day-food-museums-nightlife`
- `tokyo-3-day-calm-evening`
- `rome-weekend-classics-drinks`
- `barcelona-3-day-budget-beaches`
- `london-3-day-rain-safe`
- `paris-4-day-couples-premium`
- `copenhagen-2-day-design-food`
- `berlin-3-day-nightlife-culture`

## Commands

Created disposable public fixtures:

```bash
QA_OWNER_USER_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea npm run qa:share-fixtures
```

Validated all public share pages:

```bash
QA_SHARE_SLUGS=qab1250de81,qab1250de82,qab1250de83,qab1250de84,qab1250de85,qab1250de86,qab1250de87,qab1250de88,qab1250de89,qab1250de810 npm run qa:share
```

Result: `40/40` passed.

Exported prompt-suite actuals:

```bash
QA_PROMPT_SUITE_SHARE_MAP='lisbon-3-day-friends-nightlife=qab1250de81,porto-1-day-food-viewpoints=qab1250de82,mexico-city-4-day-food-museums-nightlife=qab1250de83,tokyo-3-day-calm-evening=qab1250de84,rome-weekend-classics-drinks=qab1250de85,barcelona-3-day-budget-beaches=qab1250de86,london-3-day-rain-safe=qab1250de87,paris-4-day-couples-premium=qab1250de88,copenhagen-2-day-design-food=qab1250de89,berlin-3-day-nightlife-culture=qab1250de810' QA_PROMPT_SUITE_ACTUALS_OUT=../qa/planner-map-trust-expanded-2026-05-18-actuals.json npm run qa:prompt-actuals
```

Result: exported `10` actuals.

Ran the prompt suite against the expanded actuals:

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-expanded-2026-05-18-actuals.json npm run qa:prompt-suite
```

Result: `52/52` fixtures passed, `actualsChecked: 10`, `failures: []`.

Cleaned disposable fixtures:

```bash
QA_CLEANUP_TRIP_IDS=d5f71745-bc5e-47ce-8231-16c874c03b39,0d563fea-df4f-45a9-831d-4343d71ab2d4,9768594a-9ed3-4091-bb49-b1027dd1b782,5f3a6c00-4120-4a65-8d09-9598075f0ce6,c4211067-ddd9-410a-8648-c8b7059f74cd,54597db3-5484-43ab-a502-be756396874e,b27357b2-5bfe-4be7-b5c5-3d9807277ac0,8f6cf0cb-569e-4d4a-8ad2-2e605b92d887,a4b6616b-88c8-4354-bb69-6869978371bb,81ee4239-b937-4491-ae39-8b4a627f2e5c QA_CLEANUP_RUN_ID=b1250de8 npm run qa:share-fixtures
```

Result: `10` trips and `62` QA places deleted.

## Actuals Summary

Artifact:

- `qa/planner-map-trust-expanded-2026-05-18-actuals.json`

Totals:

- actual itineraries: `10`
- days checked: `28`
- itinerary items checked: `62`
- mapped items checked: `62`
- usable route rows checked: `28`

Every actual itinerary day had:

- at least one item
- every item mapped to a place with latitude and longitude
- exactly one country matching the prompt-suite expected country
- at least one usable route row

## In-App Browser Evidence

Browser spot-checked disposable public share `/t/qab1250de83` before cleanup.

Confirmed:

- page title: `QA 4 Days in Mexico City b1250de8 | Globe.travel`
- all four day titles rendered:
  - `Roma and Condesa food`
  - `Historic center`
  - `Museums and Chapultepec`
  - `Coyoacan and one big night`
- recipient CTA rendered
- no horizontal overflow
- first visible Mapbox zoom controls measured `46 x 46`

## Follow-Up

The release path should still add live AI-generated sampling for more prompts once the API budget and model behavior are stable. This pass closes the immediate coverage gap for ten actual public itinerary map-trust checks and makes the broader actuals path repeatable.
