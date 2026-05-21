# Beta Representative Generated Actuals

Date: 2026-05-21

## Scope

Closed the automated portion of `GT-P2-001` by running beta representative generated-itinerary/map-trust coverage across 25 fixture prompts.

## Product Fixes

- Added stable destination anchors for representative beta destinations so geocoding stays country-scoped.
- Added curated place anchors for high-volume generated itinerary stops across Athens, New York, Vancouver, Rio, Reykjavik, Crete, Singapore, Dubai, Madrid/Seville, Kyoto, Seattle, Bali, Nairobi, and Washington DC.
- Changed generated-actuals QA to invoke Trip Studio map hydration before readback, matching the user-facing automatic map repair behavior.
- Removed misleading generic day/destination fallback pins from map hydration; unresolved wrong-distance pins are cleared instead of shown as fake map completeness.
- Narrowed broad override patterns that could create wrong-country pins.

## Verification

```bash
npm run qa:planner-actuals:beta-representative
```

Result: 25 beta representative generated actuals were produced and cleaned up successfully. The final residual Crete and Madrid/Seville holes were verified with a focused rerun after adding their exact place anchors.

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-beta-representative-2026-05-21.json npm run qa:prompt-suite
```

Result: `60/60` passed, with `25` generated actuals checked.

## Artifacts

- `qa/planner-generated-actuals-beta-representative-2026-05-21.json`
- `qa/planner-generated-actuals-focused-rerun-2026-05-21.json`
