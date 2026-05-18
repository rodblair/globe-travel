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

- Checked: 8
- Passed: 8
- Failed: 0
- Artifact JSON: `qa/visual-authenticated-guest-2026-05-18/summary.json`
- Artifact directory: `qa/visual-authenticated-guest-2026-05-18`
- Protected routes: saved-trips, saved-journal, account-profile, account-billing
- Guest cleanup: attempted (ok)

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| saved-trips | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/saved-trips-phone-390x844.png | Pass |
| saved-journal | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/saved-journal-phone-390x844.png | Pass |
| account-profile | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/account-profile-phone-390x844.png | Pass |
| account-billing | phone | 390 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/account-billing-phone-390x844.png | Pass |
| saved-trips | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/saved-trips-laptop-1280x800.png | Pass |
| saved-journal | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/saved-journal-laptop-1280x800.png | Pass |
| account-profile | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/account-profile-laptop-1280x800.png | Pass |
| account-billing | laptop | 1280 | No | 0 | 0 | n/a | qa/visual-authenticated-guest-2026-05-18/screenshots/account-billing-laptop-1280x800.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
