# Public Share Fixture Multi-Itinerary QA

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Browser profile used for fixture ownership: `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`

## Purpose

Expand public-share confidence beyond the stable Athens five-day baseline by generating multiple deterministic public itinerary fixtures with mapped stops and persisted routes. This proves `qa:share` can validate different trip lengths, countries, and public-page metadata without depending on hand-maintained production slugs.

## Added Tooling

```bash
npm run qa:share-fixtures
```

Create mode requires:

```bash
QA_OWNER_USER_ID=<local-profile-id> npm run qa:share-fixtures
```

Cleanup mode:

```bash
QA_CLEANUP_TRIP_IDS=<trip-id-one>,<trip-id-two> QA_CLEANUP_RUN_ID=<run-id> npm run qa:share-fixtures
```

The fixture generator creates:

- `QA 3 Days in Lisbon`
- `QA 4 Days in Kyoto`
- `QA 2 Days in Mexico City`

Each generated trip is public, has all itinerary items attached to places with coordinates/country codes, and has a persisted walking route for every day.

## Multi-Itinerary API And Metadata Gate

Created fixture run: `671ee6de`

Generated slugs:

- `qa671ee6de1` — Lisbon, 3 days, 7 items, 3 routes
- `qa671ee6de2` — Kyoto, 4 days, 9 items, 4 routes
- `qa671ee6de3` — Mexico City, 2 days, 5 items, 2 routes

Command:

```bash
QA_SHARE_SLUGS=qa671ee6de1,qa671ee6de2,qa671ee6de3 npm run qa:share
```

Result: passed `12/12`.

Validated for every generated public itinerary:

- Public trip API returned itinerary.
- Every day had itinerary items.
- Every item had a mapped place.
- Every day had exactly one country.
- Every day had at least one usable route.
- Public feedback API returned an array.
- Public page emitted title, description, Open Graph, and Twitter metadata.

Cleanup:

```bash
QA_CLEANUP_TRIP_IDS=a12f6a37-9fc2-4d60-81bd-250c245d04f2,ea9b26f2-e1df-480e-b8ec-008f6d7af716,cf11d355-5e5e-4e1c-9da9-6500a8cb4e2f QA_CLEANUP_RUN_ID=671ee6de npm run qa:share-fixtures
```

Result: deleted 3 trips and 21 fixture places.

## Browser Recipient Surface Check

Created fixture run: `c699634a`

Browser URL:

```text
http://localhost:3000/t/qac699634a1
```

Browser viewport:

- `390 x 844`

Confirmed on the Lisbon public share page:

- Page title: `QA 3 Days in Lisbon c699634a | Globe.travel`
- All three days were present:
  - `Alfama arrival`
  - `Belém and riverfront`
  - `Chiado finale`
- Recipient CTA text `Start your own trip` was present.
- Feedback fields were present and touch-sized:
  - `Your name` at `316 x 46`
  - `Email optional` at `316 x 46`
  - `Trip feedback` at `316 x 140`
- `documentElement.scrollWidth` matched `clientWidth` at `390px`.
- No visible error copy appeared.

Cleanup:

```bash
QA_CLEANUP_TRIP_IDS=5e3b7f2f-5c3d-4be3-9f97-93cd8dc9daf4,4df366bf-c6d7-484b-a3d4-830043365bba,0680c9c3-dd91-41a7-8943-3a70954374a2 QA_CLEANUP_RUN_ID=c699634a npm run qa:share-fixtures
```

Result: deleted 3 trips and 21 fixture places.

## Findings

- Pass: Multi-itinerary public share integrity now has deterministic local fixture coverage.
- Pass: Non-Athens public share page rendered correctly for a logged-out-recipient-style mobile read.
- Pass: Recipient CTA and feedback controls are reachable and touch-sized on mobile.
- Follow-up: Promote this gate into the release-candidate checklist after the team decides whether generated public fixtures should be part of every predeploy run or a scheduled weekly QA run.
