# Planner Generated Actuals QA

Date: 2026-05-18
Environment: local app at `http://localhost:3000`

## Scope

This pass adds a live generated-itinerary QA gate for planner/map trust. Unlike static prompt fixtures, the script creates a disposable guest, creates a draft trip, sends a real planner prompt to `/api/chat`, reads back the resulting itinerary and mapped places, verifies every day, and then deletes the temporary trip and guest.

The stable default gate currently covers:

- `lisbon-3-day-friends-nightlife`

The broader discovery run also sampled Mexico City and Tokyo. That run helped expose and fix multiple wrong-place and wrong-country map risks, but remains a Month 2 expansion target because stochastic generation can still select long-tail venues that need stronger place resolution or curated city coverage.

## Commands

Stable generated actual:

```bash
QA_GENERATED_ACTUALS_OUT=../qa/planner-generated-actuals-lisbon-2026-05-18.json npm run qa:planner-actuals
```

Result: `3/3` checks passed, `actualsChecked: 1`, `failed: 0`.

Prompt-suite cross-check:

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-lisbon-2026-05-18.json npm run qa:prompt-suite
```

Result: `56/56` prompt-suite checks passed with `actualsChecked: 1`.

## Verified Behavior

The generated Lisbon trip produced:

- `3` expected day tabs
- `15` itinerary items
- `15` mapped items
- `0` unmapped items
- `0` duplicate mapped stops
- `3` usable route rows
- all mapped items in `Portugal`
- successful disposable trip and guest cleanup

## Fixes Driven By This Pass

- Added a repeatable `qa:planner-actuals` script for live planner/map output.
- Added canonical destination anchors for Athens, Lisbon, Mexico City, and Tokyo so ambiguous city names do not seed wrong-country geocoding.
- Added canonical pins for common Lisbon, Mexico City, and Tokyo planner venues where Mapbox's first result can otherwise resolve to streets, districts, or wrong places.
- Added planner guidance to keep generated days to `3-5` mapped stops and avoid district-only items.
- Added a bounded straight-line route fallback when Mapbox directions returns no usable route for otherwise valid city-scale mapped stops.

## Follow-Up

Month 2 should expand generated actuals from Lisbon into a larger multi-city gate after the next place-resolution hardening pass. The discovery sample already showed the next targets:

- reject or repair generic district-level place hits before they become itinerary pins
- add stronger candidate scoring instead of trusting one geocoder result
- continue building canonical coverage for high-value launch cities
- detect empty day shells from transient planner/tool failures and retry or recover visibly
