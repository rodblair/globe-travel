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
- Decodes all ten social-card PNGs and verifies exact `1200x630` dimensions, nonblank/branded pixel content, visible dark/brass visual elements, and unique hashes/byte lengths across trip shapes.
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

- `npm run qa:share-multi-itinerary-ui` passed `31/31`.
- `node --check scripts/platform-share-multi-itinerary-ui-smoke.mjs` passed.
- `git diff --check` passed.

## Latest Run

- Run id: `86fee606`
- Fixture count: `10`
- Browser-tested fixture keys: `lisbon`, `porto`, `mexico-city`
- Share slugs:
  - `qa86fee6061`
  - `qa86fee6062`
  - `qa86fee6063`
  - `qa86fee6064`
  - `qa86fee6065`
  - `qa86fee6066`
  - `qa86fee6067`
  - `qa86fee6068`
  - `qa86fee6069`
  - `qa86fee60610`
- Feedback rows created and deleted:
  - `c04b3105-265c-4265-8cbb-874b56237906`
  - `93af4033-8927-44c7-a720-63866525ab86`
  - `e2904473-4012-4d86-bbae-25416b2f1101`
- Fixture cleanup: `10` trips and `62` places deleted.
- Owner cleanup: disposable owner profile and auth user deleted.

## Social-Card Image Assertions

All ten fixture cards passed:

- Response status: `200`
- Content type: `image/png`
- Dimensions: `1200x630`
- Byte length: `74666` to `80981`
- Unique color buckets: `56` to `58`
- Non-paper pixel ratio: `0.0641` to `0.0734`
- Dark text/line pixel ratio: `0.0282` to `0.0356`
- Brass accent pixel ratio: `0.0048`
- Unique SHA-256 hashes: `10/10`
- Unique byte lengths: `10/10`

## Release Impact

This closes the first multi-itinerary public-share browser loop and the first multi-card social preview content gate: the product is no longer only tested against one stable Athens public share, and social cards are no longer checked only for existence. Remaining Month 4 expansion work is owner-side feedback refresh coverage across multiple itinerary shapes.
