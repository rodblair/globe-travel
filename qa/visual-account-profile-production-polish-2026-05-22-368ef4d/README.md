# Full Responsive Visual Baseline

Date: 2026-05-22
Environment: https://globe-travel-two.vercel.app
Deployment: 368ef4d26bfe96fb4e6e3ce476045e6e2a48a0b1 (globe-travel-7cr0hafed-rodney-blairs-projects.vercel.app)
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: guest (generated guest id)
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 5
- Passed: 5
- Failed: 0
- Artifact JSON: `qa/visual-account-profile-production-polish-2026-05-22-368ef4d/summary.json`
- Artifact directory: `qa/visual-account-profile-production-polish-2026-05-22-368ef4d`
- Protected routes: account-profile
- Guest cleanup: attempted (ok)

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| account-profile | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-account-profile-production-polish-2026-05-22-368ef4d/screenshots/account-profile-phone-390x844.png | Pass |
| account-profile | tablet | 768 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-account-profile-production-polish-2026-05-22-368ef4d/screenshots/account-profile-tablet-768x1024.png | Pass |
| account-profile | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-account-profile-production-polish-2026-05-22-368ef4d/screenshots/account-profile-laptop-1280x800.png | Pass |
| account-profile | desktop | 1440 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-account-profile-production-polish-2026-05-22-368ef4d/screenshots/account-profile-desktop-1440x950.png | Pass |
| account-profile | wide | 1728 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-account-profile-production-polish-2026-05-22-368ef4d/screenshots/account-profile-wide-1728x1050.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
