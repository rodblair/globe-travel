# Full Responsive Visual Baseline

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: 6rl69n3xgr
Trip Studio fixture: b629a572-49a5-498d-931c-e50abfef9710
Auth mode: guest (external guest id)
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 6
- Passed: 6
- Failed: 0
- Artifact JSON: `qa/visual-authenticated-owner-fixture-2026-05-18/summary.json`
- Artifact directory: `qa/visual-authenticated-owner-fixture-2026-05-18`
- Protected routes: saved-trips, account-billing, trip-studio
- Guest cleanup: external guest id provided; owner cleanup remains with the caller

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| saved-trips | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-owner-fixture-2026-05-18/screenshots/saved-trips-phone-390x844.png | Pass |
| account-billing | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-owner-fixture-2026-05-18/screenshots/account-billing-phone-390x844.png | Pass |
| trip-studio | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-owner-fixture-2026-05-18/screenshots/trip-studio-phone-390x844.png | Pass |
| saved-trips | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-owner-fixture-2026-05-18/screenshots/saved-trips-laptop-1280x800.png | Pass |
| account-billing | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-owner-fixture-2026-05-18/screenshots/account-billing-laptop-1280x800.png | Pass |
| trip-studio | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-owner-fixture-2026-05-18/screenshots/trip-studio-laptop-1280x800.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
