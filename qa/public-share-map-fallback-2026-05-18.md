# Public Share Map Fallback QA

Date: 2026-05-18
Surface: `/t/x3m2c8cnws?qaMapFallback=1`
User lens: logged-out friend opening a shared itinerary when Mapbox is unavailable or intentionally disabled for QA.

## Finding

The public itinerary already had an SVG fallback for missing Mapbox rendering, but the fallback was too quiet on non-interactive share cards. It could still be labelled like a normal map even when the route was static, which weakens trust during provider outages or blocked map assets.

## Fix

- Added an explicit `forceStatic` map prop for deterministic fallback testing.
- Public share pages can now force static map cards in development with `?qaMapFallback=1`.
- Static route cards now label the map surface as `Static Route`.
- Static fallback cards now show a visible `Static route preview` badge on public share cards and poster cards.
- Added `npm run qa:map-fallback`.
- Integrated map fallback smoke into `npm run qa:release-candidate`.

## Browser Evidence

Checked in Browser on localhost:

- Opened `/t/x3m2c8cnws?qaMapFallback=1`.
- Confirmed the Athens title, day-by-day itinerary, friend feedback, and `Start your own trip` CTA remained visible.
- Confirmed `Static Route` appeared on static map cards.
- Confirmed `Static route preview` appeared on static map cards.
- Confirmed `mapboxCanvasCount` was `0`.
- Confirmed no horizontal overflow.

Browser state:

```json
{
  "staticRouteLabels": 6,
  "staticPreviewLabels": 6,
  "mapboxCanvasCount": 0,
  "hasAthensTitle": true,
  "hasDayByDay": true,
  "hasFeedback": true,
  "hasRecipientCta": true,
  "hasOverflow": false
}
```

## Automated Evidence

- `npm run qa:map-fallback` passed `1/1`.

The smoke verifies the forced public-share fallback keeps recipient CTA, itinerary, feedback, static route labels, no Mapbox canvas, no visible app error, and no horizontal overflow.
