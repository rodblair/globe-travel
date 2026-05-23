# Full Responsive Visual Baseline

Date: 2026-05-23
Environment: http://localhost:3000
Deployment: local visual target
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: none
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 1
- Passed: 1
- Failed: 0
- Artifact JSON: `qa/visual-public-share-title-polish-2026-05-23/summary.json`
- Artifact directory: `qa/visual-public-share-title-polish-2026-05-23`
- Protected routes: none
- Guest cleanup: guest visual auth not used

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| public-share | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-public-share-title-polish-2026-05-23/screenshots/public-share-phone-390x844.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
