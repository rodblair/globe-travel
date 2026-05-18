# Full Responsive Visual Baseline

Date: 2026-05-18
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: none
Baseline comparison: not enabled
Pixel-compared routes: none
Diff threshold: 1.50%

## Result

- Checked: 6
- Passed: 6
- Failed: 0
- Artifact JSON: `qa/visual-baseline-2026-05-18-auth-next-handoff/summary.json`
- Artifact directory: `qa/visual-baseline-2026-05-18-auth-next-handoff`
- Protected routes: none
- Guest cleanup: guest visual auth not used

| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| login | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-auth-next-handoff/screenshots/login-phone-390x844.png | Pass |
| signup | phone | 390 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-auth-next-handoff/screenshots/signup-phone-390x844.png | Pass |
| login | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-auth-next-handoff/screenshots/login-laptop-1280x800.png | Pass |
| signup | laptop | 1280 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-auth-next-handoff/screenshots/signup-laptop-1280x800.png | Pass |
| login | desktop | 1440 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-auth-next-handoff/screenshots/login-desktop-1440x950.png | Pass |
| signup | desktop | 1440 | No | 0 | 0 | 0 | 0 | n/a | qa/visual-baseline-2026-05-18-auth-next-handoff/screenshots/signup-desktop-1440x950.png | Pass |

## Failure Detail

No failures.

## Notes

- This runner uses installed Chrome through `playwright-core` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below `44px` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When `QA_VISUAL_BASELINE_DIR` is set, screenshots are compared with `pixelmatch`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set `QA_VISUAL_DIFF_ROUTES` to override.
