# Planner Generated Actuals QA

Date: 2026-05-18
Environment: local app at `http://localhost:3000`

## Scope

This pass adds a live generated-itinerary QA gate for planner/map trust. Unlike static prompt fixtures, the script creates a disposable guest, creates a draft trip, sends a real planner prompt to `/api/chat`, reads back the resulting itinerary and mapped places, verifies every day, and then deletes the temporary trip and guest.

The stable default gate currently covers:

- `lisbon-3-day-friends-nightlife`

The launch-city gate now covers:

- `lisbon-3-day-friends-nightlife`
- `porto-1-day-food-viewpoints`
- `mexico-city-4-day-food-museums-nightlife`
- `tokyo-3-day-calm-evening`

The newest Lisbon reliability pass added strict geocoder candidate scoring, exact destination anchors, a dedicated geocode-quality smoke, Browser verification of a generated public share page, and Lisbon trusted-place guidance so generated itineraries prefer known routeable venues before falling back to strict Mapbox lookup.

The newest launch-city pass extends the same map-trust approach to Porto, Mexico City, and Tokyo with trusted planner place sets, additional canonical pins, retry-tolerant generated-actual cleanup, and prompt-suite cross-checking against real generated outputs.

## Commands

Stable generated actual:

```bash
QA_GENERATED_ACTUALS_OUT=../qa/planner-generated-actuals-lisbon-2026-05-18.json npm run qa:planner-actuals
```

Result: `3/3` checks passed, `actualsChecked: 1`, `failed: 0`.

Geocode-quality smoke:

```bash
npm run qa:geocode-quality
```

Result: `14/14` checks passed. Athens, Lisbon, Mexico City, and Tokyo destination anchors resolve to the expected country with both bare and country-qualified labels, and strict geocoding rejects known weak false-positive hits.

Prompt-suite cross-check:

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-lisbon-2026-05-18.json npm run qa:prompt-suite
```

Result: `56/56` prompt-suite checks passed with `actualsChecked: 1`.

Launch-city generated actuals:

```bash
npm run qa:planner-actuals:launch-cities
```

Result: `6/6` generated-actual checks passed across `4` actual trips, `failed: 0`, and all disposable trip/profile/auth cleanup passed. Output: `qa/planner-generated-actuals-launch-cities-2026-05-18.json`.

Launch-city prompt-suite cross-check:

```bash
QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-launch-cities-2026-05-18.json npm run qa:prompt-suite
```

Result: `56/56` prompt-suite checks passed with `actualsChecked: 4` and `missingCoverage: []`.

## Verified Behavior

The latest generated Lisbon trip produced:

- `3` expected day tabs
- `15` itinerary items
- `15` mapped items
- `0` unmapped items
- `0` duplicate mapped stops
- `3` usable route rows
- all mapped items in `Portugal`
- successful disposable trip and guest cleanup

The latest launch-city generated actuals produced:

- Lisbon: `3 Days in Lisbon`, all days mapped in Portugal, no bad days
- Porto: `1 Day in Porto`, all days mapped in Portugal, no bad days
- Mexico City: `4 Days in Mexico City`, all days mapped in Mexico, no bad days
- Tokyo: `3 Days in Tokyo`, all days mapped in Japan, no bad days
- all four disposable trips, profiles, and guest auth users cleaned up successfully

Browser public-share check:

- Opened a kept disposable generated trip at `/t/god4jj9fi9`
- Verified the public page rendered `3 Days in Lisbon`
- Verified day-by-day itinerary copy, known mapped stops, share/copy actions, Mapbox canvas, and map markers
- Verified no Browser console errors
- Deleted the kept disposable trip, guest profile, and guest auth user after inspection

## Fixes Driven By This Pass

- Added a repeatable `qa:planner-actuals` script for live planner/map output.
- Added canonical destination anchors for Athens, Lisbon, Mexico City, and Tokyo so ambiguous city names do not seed wrong-country geocoding.
- Added canonical pins for common Lisbon, Mexico City, and Tokyo planner venues where Mapbox's first result can otherwise resolve to streets, districts, or wrong places.
- Added planner guidance to keep generated days to `3-5` mapped stops and avoid district-only items.
- Added Lisbon trusted-place guidance so the planner prefers routeable known-good venues for first-pass generated plans.
- Added Porto, Mexico City, and Tokyo trusted-place guidance so launch-city generated plans favor reliable mapped venues over fragile long-tail guesses.
- Added canonical pins for launch-risk Porto, Mexico City, and Tokyo venues surfaced by generated actuals, including Porto viewpoints/food stops, Tostadas Coyoacán, and multiple Tokyo restaurant and landmark variants.
- Added a `qa:planner-actuals:launch-cities` preset for repeatable multi-city generated itinerary checks.
- Made generated-actual QA tolerate recoverable planner stream interruptions and retry cleanup/fetch operations so transient network failures do not leave disposable guests or trips behind.
- Added strict Mapbox candidate scoring, destination anchors, and false-positive rejection for item geocoding.
- Added `qa:geocode-quality` and included it in the release-candidate gate.
- Added a bounded straight-line route fallback when Mapbox directions returns no usable route for otherwise valid city-scale mapped stops.

## Follow-Up

Month 2 should continue expanding generated actuals beyond the first launch-city gate. Lisbon, Porto, Mexico City, and Tokyo are now covered; the next recurring targets are Rome, Barcelona, London, Paris, Copenhagen, and Berlin.

- reject or repair generic district-level place hits before they become itinerary pins
- add stronger candidate scoring instead of trusting one geocoder result
- continue building canonical coverage for high-value launch cities
- detect empty day shells from transient planner/tool failures and retry or recover visibly
