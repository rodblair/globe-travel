# Full Responsive Visual Baseline

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: guest (generated guest id)
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 3
- Passed: 3
- Failed: 0
- Artifact JSON: `qa/visual-baseline-2026-05-18-planner-word-duration/summary.json`
- Artifact directory: `qa/visual-baseline-2026-05-18-planner-word-duration`
- Protected routes: planner
- Guest cleanup: attempted (ok)

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| planner | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-planner-word-duration/screenshots/planner-phone-390x844.png | Pass |
| planner | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-planner-word-duration/screenshots/planner-laptop-1280x800.png | Pass |
| planner | desktop | 1440 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-planner-word-duration/screenshots/planner-desktop-1440x950.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
