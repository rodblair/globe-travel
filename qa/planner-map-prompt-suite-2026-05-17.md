# Planner And Map Prompt Suite

Date: 2026-05-17
Status: Static prompt-suite gate added; generated-output coverage still expanding

## Scope

This pass advances Month 2 of the platform completion plan: planner and map trust. It adds a repeatable prompt-suite QA command so destination anchoring, day-count parsing, and initial planning tool selection can be checked before deeper Browser generation tests.

## What Changed

- Added `client/qa/planner-prompt-fixtures.json` with 52 trip prompts across cities, budgets, group sizes, trip lengths, and travel styles.
- Added `npm run qa:prompt-suite`.
- The suite checks:
  - at least 50 prompt fixtures
  - required coverage for one-day, five-day, multi-city, rest-day, food, viewpoints, beach, museums, nightlife, budget, premium, family, rain-safe, and walkable scenarios
  - destination extraction against expected primary destination
  - prompt day-count consistency
  - initial planning intent selects full-plan tools with `createTrip`, `setFullTripPlan`, and `resolvePlace`
  - optional generated-output files through `QA_PROMPT_SUITE_ACTUALS`
- Fixed destination extraction regressions found while creating the suite:
  - `Plan a 5-day Athens trip in mid September...` must extract `Athens`, not `mid September`.
  - `Plan a 1-day Porto food and viewpoints trip...` must extract `Porto`, not `Plan Porto`.

## Fixture Coverage

The suite passed `52/52` static prompt checks. It includes the required baseline scenarios:

- Athens five-day couples trip with one rest day
- Porto one-day food and viewpoints trip
- Lisbon friends food/nightlife trip
- Tokyo first-time visit
- Rome weekend
- Barcelona budget beach/culture trip
- Mexico City food/museums/nightlife trip
- London rain-safe trip
- Paris premium couples trip
- New York repeat-visitor trip

It also broadens coverage across Europe, Asia, North America, South America, Africa, Oceania, family trips, premium trips, budget trips, weather-safe trips, beach trips, multi-city trips, and rest-day planning.

## Exit Criteria Advanced

This does not yet prove that every generated itinerary is correct. It does make the next Browser and generated-output QA work repeatable:

- Use Browser to generate the fixture trips in batches.
- Export generated day integrity into the `QA_PROMPT_SUITE_ACTUALS` schema.
- Run `QA_PROMPT_SUITE_ACTUALS=<file> npm run qa:prompt-suite` to validate day count, item count, mapped stop count, country consistency, and usable route count.

## Remaining Month 2 Work

- Generate actual trips for the full fixture suite or a representative launch subset.
- Add a small exporter for generated trip integrity so Browser-created trips can be checked automatically.
- Add wrong-country recovery evidence for failed geocodes and partial map hydration.
- Keep Athens five-day as a required launch fixture.
