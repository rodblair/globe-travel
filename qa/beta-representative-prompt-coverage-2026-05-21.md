# Beta Representative Prompt Coverage

Date: 2026-05-21

## Issue

The launch risk register tracked beta representative trip coverage as an open P2, but the automated prompt contract only enforced general theme coverage. It did not explicitly prove the audience mix called out in the beta plan, and solo-traveler planning was not represented.

## Fix

- Expanded `client/qa/planner-prompt-fixtures.json` from `56` to `60` fixtures.
- Added solo representative trips for Kyoto, Seattle, Bali, and Nairobi.
- Added beta coverage enforcement to `npm run qa:prompt-suite`.
- The prompt suite now fails unless it covers:
  - Audiences: friend groups, couples, families, solo travelers.
  - Styles: budget, premium, food, nightlife, outdoors, culture.
  - Regions: Africa, Asia, Europe, Latin America, North America, Oceania.
- Added `npm run qa:planner-actuals:beta-representative`, a 25-trip generated-actuals preset for the later beta map-trust run.
- Hardened generated map trust so the actuals run now waits for the same automatic Trip Studio map hydration path a user receives, rejects wrong-country fallback pins, and requires country-correct mapped coverage for each generated day.

## Verification

```bash
npm run qa:prompt-suite
```

Result: `60/60` passed.

- Missing standard coverage: `[]`
- Missing beta audience coverage: `[]`
- Missing beta style coverage: `[]`
- Missing beta regional coverage: `[]`

```bash
node --check scripts/planner-prompt-suite.mjs
node --check scripts/platform-planner-generated-actuals.mjs
```

Result: passed.

```bash
npm run qa:planner-actuals:beta-representative
QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-beta-representative-2026-05-21.json npm run qa:prompt-suite
```

Result: 25 beta representative generated actuals checked, then `60/60` prompt-suite checks passed with all 25 generated actuals attached.

## Remaining Risk

This reduces `GT-P2-001` from an undefined coverage gap to a measured beta matrix with generated itinerary/map evidence. The risk remains open for 25-50 real or representative human trip reviews during invite beta, not for missing automated coverage.
