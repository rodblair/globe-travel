# Planner And Map Prompt Suite

Date: 2026-05-17
Status: Static prompt-suite gate added; first generated-output fixture verified

## Scope

This pass advances Month 2 of the platform completion plan: planner and map trust. It adds a repeatable prompt-suite QA command so destination anchoring, day-count parsing, and initial planning tool selection can be checked before deeper Browser generation tests.

## What Changed

- Added `client/qa/planner-prompt-fixtures.json` with 52 trip prompts across cities, budgets, group sizes, trip lengths, and travel styles.
- Added `npm run qa:prompt-suite`.
- Added `npm run qa:prompt-actuals` to export live public-share itineraries into the `QA_PROMPT_SUITE_ACTUALS` schema.
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

## Generated-Output Evidence

The first generated-output fixture is now wired through production public-share data:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_PROMPT_SUITE_SHARE_MAP=athens-5-day-couples-rest=x3m2c8cnws \
QA_PROMPT_SUITE_ACTUALS_OUT=/tmp/globe-travel-prompt-actuals.json \
npm run qa:prompt-actuals
```

Then:

```bash
QA_PROMPT_SUITE_ACTUALS=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-suite
```

Result:

- Static prompt checks passed `52/52`.
- Actual generated-output checks passed for `athens-5-day-couples-rest`.
- Athens output had 5 days, every day had mapped stops, every mapped day stayed in `Greece`, and every day had at least one usable route.

## Exit Criteria Advanced

This does not yet prove that every generated itinerary is correct. It does make the next Browser and generated-output QA work repeatable, and it proves the first stable public generated itinerary against the prompt-suite actuals contract:

- Use Browser to generate the fixture trips in batches.
- Export generated day integrity into the `QA_PROMPT_SUITE_ACTUALS` schema with `npm run qa:prompt-actuals`.
- Run `QA_PROMPT_SUITE_ACTUALS=<file> npm run qa:prompt-suite` to validate day count, item count, mapped stop count, country consistency, and usable route count.

## Remaining Month 2 Work

- Generate actual trips for the full fixture suite or a representative launch subset.
- Add more generated trip integrity exports for Browser-created trips.
- Add wrong-country recovery evidence for failed geocodes and partial map hydration.
- Keep Athens five-day as a required launch fixture.
