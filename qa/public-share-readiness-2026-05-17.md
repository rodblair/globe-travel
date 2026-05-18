# Public Share Readiness

Date: 2026-05-17
Target slug: `x3m2c8cnws`
Status: Passed locally; production verification pending deployment

## Scope

This pass supports the public sharing and viral-loop roadmap track. The public trip link is the product's distribution surface, so it needs to work for people who are not signed in and it needs to produce a specific, compelling link preview.

## Fixes

- Split `/t/[shareSlug]` into a server page plus a client component so the route can emit trip-specific metadata while preserving the existing interactive share experience.
- Added dynamic metadata for public trip pages:
  - trip-specific `<title>`
  - trip-specific description
  - Open Graph title and description
  - Twitter summary card metadata
  - canonical URL
- Added `metadataBase` in the root layout so social metadata resolves against the production Globe.travel URL.
- Added `npm run qa:share`.
- Added recoverable UI errors for feedback submission failures.
- Added recoverable UI errors for copy/share failures.
- Added an `aria-live` copied confirmation for the share link.
- Added `aria-pressed` and descriptive accessible names to sentiment buttons.

## Browser Evidence

Browser checked `/t/x3m2c8cnws` at:

- 390 x 844
- 768 x 1024
- 1280 x 800

Results:

- Trip-specific document title rendered: `5 Days in Athens Greece in mid september | Globe.travel`.
- No document-level overflow.
- No missing app-owned labels.
- No undersized app-owned controls.
- No stale brand copy.
- No visible application error copy.
- Feedback form, friend feedback, share card, and `Start your own trip` CTA were visible.

## Local Command Evidence

`QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed `3/3`:

| Check | Result | Proof |
| --- | --- | --- |
| Public trip API | Pass | Returned the Athens trip and 5 itinerary days |
| Public feedback API | Pass | Returned feedback array with 2 entries |
| Public page metadata | Pass | Title, description, Open Graph, and Twitter metadata present |

`npm run lint` passed.

`npm run build` passed.

## Follow-Up

- Run `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` after deploy.
- Add generated Open Graph image support once a stable social-card renderer exists.
- Add analytics events for public page viewed, share copied, native share attempted, feedback submitted, and recipient started trip.
