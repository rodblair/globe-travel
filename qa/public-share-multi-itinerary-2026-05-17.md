# Public Share Multi-Itinerary QA

Date: 2026-05-17
Status: Multi-slug QA support added; production verified with the current stable Athens slug

## Scope

This pass advances the Month 4 sharing and viral-loop track. Public trip links are the product's main distribution surface, and launch QA needs to validate more than one public itinerary without duplicating commands by hand.

## What Changed

- `npm run qa:share` now supports either:
  - `QA_SHARE_SLUG=<slug>`
  - `QA_SHARE_SLUGS=<slug-one>,<slug-two>,<slug-three>`
- Each slug is validated with the same checks:
  - public trip API returns itinerary data
  - every itinerary day has mapped stops
  - every itinerary day maps to one country
  - every itinerary day has at least one usable route
  - public feedback API returns an array
  - public page emits trip-specific metadata
- The command now returns a combined summary with per-slug results and a shared failure list.

## Production Evidence

Current stable public QA slug:

- `x3m2c8cnws`

The production command remains:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUGS=x3m2c8cnws npm run qa:share
```

Production result:

- Pass `4/4`
- Trip title: `5 Days in Athens Greece in mid september`
- Day count: `5`
- Country integrity: `Greece` for every mapped day

Backward compatibility was also verified:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
```

Result:

- Pass `4/4`
- Same Athens five-day integrity evidence

## Remaining Work

- Add more stable public share slugs as prompt-suite trips are generated.
- Keep Athens five-day as the required baseline slug.
- Add at least one non-Greece city share slug before launch candidate signoff.
- Add one multi-city public share slug once multi-city generation has Browser evidence.
