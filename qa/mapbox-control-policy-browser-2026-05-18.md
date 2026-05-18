# Mapbox Control Policy Browser Check

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Route: `/t/x3m2c8cnws`
Browser session: Codex in-app Browser, session `Globe map policy QA`

## Purpose

Verify the map-control policy like a real public-share visitor after applying the global Mapbox control treatment.

## Result

- Public share route loaded as `5 Days in Athens Greece in mid september | Globe.travel`.
- Public CTA `Start your own trip` was present.
- No horizontal overflow was detected.
- No small app-owned visible targets were detected in the initial public-share viewport.
- Browser DOM check found 12 Mapbox zoom controls across the public itinerary maps.
- Every Mapbox zoom control measured `46 x 46`.
- No actionable Mapbox map controls measured below the `44px` target.

## Evidence

```json
{
  "controlCount": 12,
  "small": [],
  "sampleControls": [
    { "label": "Zoom in", "width": 46, "height": 46 },
    { "label": "Zoom out", "width": 46, "height": 46 }
  ]
}
```

## Related Automated Gate

`QA_TRIP_ID=f1239381-f38f-4ede-9e2c-9d5321c27a59 QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_RUN_ID=mapbox-policy QA_VISUAL_ROUTES=public-share,trip-studio npm run qa:visual`

Result: `10/10` route-viewports passed, with `0` small app targets and `0` small actionable map controls.
