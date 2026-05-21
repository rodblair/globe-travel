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

## Remaining Risk

This reduces `GT-P2-001` from an undefined coverage gap to a measurable beta matrix. The risk remains open until the 25-trip `qa:planner-actuals:beta-representative` run is executed against a live local or beta environment and reviewed with generated itinerary/map evidence.
