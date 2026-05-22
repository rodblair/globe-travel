# Full Responsive Visual Baseline

Date: 2026-05-22
Environment: https://globe-travel-two.vercel.app
Deployment: 45b64b0e1d3d96dda640a74229b484bb30d07afd (globe-travel-47jcqjnvu-rodney-blairs-projects.vercel.app)
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: none
Baseline comparison: /Users/rodneyblair/Documents/GitHub/globe-travel/qa/visual-baseline-production-2026-05-18
Pixel-compared routes: landing, login, signup
Diff threshold: 1.50%

## Result

- Checked: 20
- Passed: 20
- Failed: 0
- Artifact JSON: `qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/summary.json`
- Artifact directory: `qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0`
- Protected routes: none
- Guest cleanup: guest visual auth not used

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| landing | phone | 390 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/landing-phone-390x844.png | Pass |
| login | phone | 390 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/login-phone-390x844.png | Pass |
| signup | phone | 390 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/signup-phone-390x844.png | Pass |
| public-share | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/public-share-phone-390x844.png | Pass |
| landing | tablet | 768 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/landing-tablet-768x1024.png | Pass |
| login | tablet | 768 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/login-tablet-768x1024.png | Pass |
| signup | tablet | 768 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/signup-tablet-768x1024.png | Pass |
| public-share | tablet | 768 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/public-share-tablet-768x1024.png | Pass |
| landing | laptop | 1280 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/landing-laptop-1280x800.png | Pass |
| login | laptop | 1280 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/login-laptop-1280x800.png | Pass |
| signup | laptop | 1280 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/signup-laptop-1280x800.png | Pass |
| public-share | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/public-share-laptop-1280x800.png | Pass |
| landing | desktop | 1440 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/landing-desktop-1440x950.png | Pass |
| login | desktop | 1440 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/login-desktop-1440x950.png | Pass |
| signup | desktop | 1440 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/signup-desktop-1440x950.png | Pass |
| public-share | desktop | 1440 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/public-share-desktop-1440x950.png | Pass |
| landing | wide | 1728 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/landing-wide-1728x1050.png | Pass |
| login | wide | 1728 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/login-wide-1728x1050.png | Pass |
| signup | wide | 1728 | No | 0 | 0 | 0 | 0 | 0.000% | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/signup-wide-1728x1050.png | Pass |
| public-share | wide | 1728 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-production-upgrade-dialog-polish-2026-05-22-45b64b0/screenshots/public-share-wide-1728x1050.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
