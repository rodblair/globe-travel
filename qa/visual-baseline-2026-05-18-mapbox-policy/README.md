# Full Responsive Visual Baseline

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: f1239381-f38f-4ede-9e2c-9d5321c27a59
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 10
- Passed: 10
- Failed: 0
- Artifact JSON: `qa/visual-baseline-2026-05-18-mapbox-policy/summary.json`
- Artifact directory: `qa/visual-baseline-2026-05-18-mapbox-policy`

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| public-share | phone | 390 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/public-share-phone-390x844.png | Pass |
| trip-studio | phone | 390 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/trip-studio-phone-390x844.png | Pass |
| public-share | tablet | 768 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/public-share-tablet-768x1024.png | Pass |
| trip-studio | tablet | 768 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/trip-studio-tablet-768x1024.png | Pass |
| public-share | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/public-share-laptop-1280x800.png | Pass |
| trip-studio | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/trip-studio-laptop-1280x800.png | Pass |
| public-share | desktop | 1440 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/public-share-desktop-1440x950.png | Pass |
| trip-studio | desktop | 1440 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/trip-studio-desktop-1440x950.png | Pass |
| public-share | wide | 1728 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/public-share-wide-1728x1050.png | Pass |
| trip-studio | wide | 1728 | No | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-mapbox-policy/screenshots/trip-studio-wide-1728x1050.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
