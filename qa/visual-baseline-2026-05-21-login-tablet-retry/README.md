# Full Responsive Visual Baseline

Date: 2026-05-21
Environment: http://localhost:3000
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
- Artifact JSON: `qa/visual-baseline-2026-05-21-login-tablet-retry/summary.json`
- Artifact directory: `qa/visual-baseline-2026-05-21-login-tablet-retry`
- Protected routes: none
- Guest cleanup: guest visual auth not used

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| login | tablet | 768 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-login-tablet-retry/screenshots/login-tablet-768x1024.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
