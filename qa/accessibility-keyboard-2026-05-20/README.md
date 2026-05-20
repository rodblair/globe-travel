# Accessibility And Keyboard Smoke

Date: 2026-05-20
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: not included

## Result

- Checked: 16
- Passed: 16
- Failed: 0
- Artifact JSON: `qa/accessibility-keyboard-2026-05-20/summary.json`

| Route | Viewport | Axe Critical/Serious | Axe Moderate | Keyboard Issues | Missing Markers | Result |
| --- | --- | ---: | ---: | ---: | --- | --- |
| landing | phone | 0 | 2 | 0 | none | Pass |
| planner | phone | 0 | 0 | 0 | none | Pass |
| saved-trips | phone | 0 | 0 | 0 | none | Pass |
| account-profile | phone | 0 | 0 | 0 | none | Pass |
| account-billing | phone | 0 | 0 | 0 | none | Pass |
| login | phone | 0 | 2 | 0 | none | Pass |
| signup | phone | 0 | 2 | 0 | none | Pass |
| public-share | phone | 0 | 1 | 0 | none | Pass |
| landing | desktop | 0 | 2 | 0 | none | Pass |
| planner | desktop | 0 | 1 | 0 | none | Pass |
| saved-trips | desktop | 0 | 0 | 0 | none | Pass |
| account-profile | desktop | 0 | 0 | 0 | none | Pass |
| account-billing | desktop | 0 | 0 | 0 | none | Pass |
| login | desktop | 0 | 2 | 0 | none | Pass |
| signup | desktop | 0 | 2 | 0 | none | Pass |
| public-share | desktop | 0 | 1 | 0 | none | Pass |

## Failure Detail

No failures.

## Notes

- This gate injects `axe-core` into local Chrome and fails on critical/serious WCAG violations.
- Moderate axe findings are recorded as warnings so they can be triaged without blocking unrelated release work.
- The keyboard smoke tabs through the first 12 focus stops and fails hidden, unnamed, or trapped/empty focus paths.
- The release shell now includes a global skip link to `#main-content` so keyboard users can bypass repeated navigation.
