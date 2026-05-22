# Itinerary Map Trust Repair

Date: 2026-05-22

## Issue

The beta-representative generated actuals exposed itinerary map pins that were country-correct but city-wrong:

- Athens 5-day actual: `Avli` resolved to Crete instead of Athens.
- Kyoto solo actual: `Kyoto Imperial Palace` resolved to Tokyo Imperial Palace.
- Madrid and Seville multi-city actual: Seville stops resolved to Madrid-area places.
- A rerun also caught a broad `farewell dinner` override that could send Athens meals to Lisbon.

The old map trust check only required same-country mapped pins, so these outliers could pass.

## Fix

- Added context-specific place overrides for Athens, Kyoto, and Seville ambiguous places.
- Removed the generic Lisbon `farewell dinner` override from map hydration.
- Added trusted Athens planning guidance so generated Athens trips prefer routeable, known-good places.
- Hardened generated-actual and prompt-suite map trust to reject geographic outliers, while allowing legitimate transfer/day-trip days.
- Refreshed the 25-trip beta-representative generated actuals with fixed Athens, Kyoto, and Madrid/Seville evidence.

## Verification

```bash
npm run qa:geocode-quality
```

Result: `44/44` passed, including contextual override checks for Athens, Crete, Kyoto, and Seville.

```bash
QA_BASE_URL=http://127.0.0.1:3000 QA_GENERATED_ACTUAL_IDS=athens-5-day-couples-rest QA_GENERATED_ACTUALS_OUT=../qa/planner-generated-actuals-athens-map-repair-2026-05-22.json node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/platform-planner-generated-actuals.mjs
```

Result: Athens 5-day generated actual passed map trust with `5/5` days and no bad days.

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-beta-representative-2026-05-21.json npm run qa:prompt-suite
```

Result: `60/60` prompt-suite checks passed with `25` generated actuals checked.

