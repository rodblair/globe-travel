# Public Share Social Preview QA

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Stable share slug: `x3m2c8cnws`

## Scope

This pass strengthens the public-share viral loop. Public trip links already exposed title, description, Open Graph, and Twitter card metadata, but `summary_large_image` did not have a real image URL behind it. A shared itinerary should render as a polished visual artifact in social apps, not just a plain link.

## Fix

- Added a dynamic PNG share-card endpoint at `/api/share-card/[shareSlug]`.
- Added public share metadata images:
  - `og:image`
  - `og:image:width`
  - `og:image:height`
  - `og:image:alt`
  - `twitter:image`
- Strengthened `npm run qa:share` so it fetches the generated card and fails unless the image returns a non-trivial `image/png` response.

## Verification

Stable Athens public share:

```bash
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
```

Result: `5/5` passed.

The new share-card image check returned:

- status: `200`
- content type: `image/png`
- byte length: `81579`

Downloaded visual artifact:

- `qa/share-card-athens-2026-05-18.png`
- format: PNG
- dimensions: `1200 x 630`

Rendered metadata on `/t/x3m2c8cnws`:

- `og:image`: `https://globe-travel-two.vercel.app/api/share-card/x3m2c8cnws`
- `og:image:width`: `1200`
- `og:image:height`: `630`
- `og:image:alt`: `5 Days in Athens Greece in mid september Globe.travel itinerary map`
- `twitter:card`: `summary_large_image`
- `twitter:image`: `https://globe-travel-two.vercel.app/api/share-card/x3m2c8cnws`

In-app Browser verified:

- public share title loaded
- day 1 and day 5 itinerary content loaded
- feedback form loaded
- public CTA present
- no horizontal overflow
- generated social preview metadata present in the document head

Browser screenshot artifact:

- `qa/public-share-browser-social-preview-2026-05-18.png`

## Artifact Preview

![Athens social preview card](/Users/rodneyblair/Documents/GitHub/globe-travel/qa/share-card-athens-2026-05-18.png)
