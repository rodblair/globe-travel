# Full Responsive Visual Baseline

Date: 2026-05-21
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: guest (generated guest id)
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 18
- Passed: 18
- Failed: 0
- Artifact JSON: `qa/visual-baseline-2026-05-21-continuation-route-sweep/summary.json`
- Artifact directory: `qa/visual-baseline-2026-05-21-continuation-route-sweep`
- Protected routes: planner, saved-trips, saved-journal, account-profile, account-billing
- Guest cleanup: attempted (ok)

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| landing | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/landing-phone-390x844.png | Pass |
| planner | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/planner-phone-390x844.png | Pass |
| saved-trips | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/saved-trips-phone-390x844.png | Pass |
| saved-journal | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/saved-journal-phone-390x844.png | Pass |
| account-profile | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/account-profile-phone-390x844.png | Pass |
| account-billing | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/account-billing-phone-390x844.png | Pass |
| login | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/login-phone-390x844.png | Pass |
| signup | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/signup-phone-390x844.png | Pass |
| public-share | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/public-share-phone-390x844.png | Pass |
| landing | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/landing-laptop-1280x800.png | Pass |
| planner | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/planner-laptop-1280x800.png | Pass |
| saved-trips | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/saved-trips-laptop-1280x800.png | Pass |
| saved-journal | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/saved-journal-laptop-1280x800.png | Pass |
| account-profile | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/account-profile-laptop-1280x800.png | Pass |
| account-billing | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/account-billing-laptop-1280x800.png | Pass |
| login | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/login-laptop-1280x800.png | Pass |
| signup | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/signup-laptop-1280x800.png | Pass |
| public-share | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-21-continuation-route-sweep/screenshots/public-share-laptop-1280x800.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
