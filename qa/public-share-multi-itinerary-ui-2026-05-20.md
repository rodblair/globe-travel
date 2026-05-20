# Public Share Multi-Itinerary UI Smoke

Date: 2026-05-20
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-multi-itinerary-ui`, a self-contained local browser smoke for the Month 4 public-share growth loop. The gate creates a disposable owner, generates the ten existing public share fixture trips, API-smokes the whole fixture set, Browser-tests three different itinerary shapes as logged-out recipients, submits feedback on each, verifies desktop reload/readback, checks share affordances, and cleans up all generated data.

## Coverage

- Creates a disposable QA share owner.
- Creates ten public share fixtures:
  - Lisbon
  - Porto
  - Mexico City
  - Tokyo
  - Rome
  - Barcelona
  - London
  - Paris
  - Copenhagen
  - Berlin
- Runs public share API/social-card smoke across all ten fixture slugs.
- Opens Lisbon, Porto, and Mexico City public share pages on a 390px phone viewport.
- Verifies each tested page shows the trip title, day count, day-by-day itinerary, feedback form, share card, and `Start your own trip` links without app errors or horizontal overflow.
- Submits one feedback reaction per tested itinerary:
  - Lisbon: `Love it`
  - Porto: `Curious`
  - Mexico City: `Practical note`
- Verifies feedback API readback for each inserted reaction.
- Reloads each tested itinerary on a 1280px desktop viewport and verifies feedback remains visible.
- Checks desktop copy-link success feedback.
- Checks native share payload is trip-specific and uses the expected public share URL.
- Deletes all inserted feedback rows.
- Deletes all ten disposable trips and 62 QA places.
- Deletes the disposable owner profile and auth user.

## Verified Commands

- `npm run qa:share-multi-itinerary-ui` passed `20/20`.
- `node --check scripts/platform-share-multi-itinerary-ui-smoke.mjs` passed.
- `git diff --check` passed.

## Latest Run

- Run id: `8cdaf8ed`
- Fixture count: `10`
- Browser-tested fixture keys: `lisbon`, `porto`, `mexico-city`
- Share slugs:
  - `qa8cdaf8ed1`
  - `qa8cdaf8ed2`
  - `qa8cdaf8ed3`
  - `qa8cdaf8ed4`
  - `qa8cdaf8ed5`
  - `qa8cdaf8ed6`
  - `qa8cdaf8ed7`
  - `qa8cdaf8ed8`
  - `qa8cdaf8ed9`
  - `qa8cdaf8ed10`
- Feedback rows created and deleted:
  - `82728a17-2847-4d98-8d05-be714b436a50`
  - `db41d09d-e9d8-4252-bcff-646437855f50`
  - `43e3ebf9-8742-40c8-a4ef-5e17396de2eb`
- Fixture cleanup: `10` trips and `62` places deleted.
- Owner cleanup: disposable owner profile and auth user deleted.

## Release Impact

This closes the first multi-itinerary public-share browser loop: the product is no longer only tested against one stable Athens public share. Remaining Month 4 expansion work is to add social-card image content assertions and owner-side feedback refresh coverage across multiple itinerary shapes.
