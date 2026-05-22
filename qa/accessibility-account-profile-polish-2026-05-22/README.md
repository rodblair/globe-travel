# Accessibility And Keyboard Smoke

Date: 2026-05-22
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: not included
Auth mode: guest (generated guest id)

## Result

- Checked: 2
- Passed: 2
- Failed: 0
- Artifact JSON: `qa/accessibility-account-profile-polish-2026-05-22/summary.json`
- Protected routes: account-profile
- Guest cleanup: attempted (ok)

| Route | Viewport | Axe Critical/Serious | Axe Moderate | Keyboard Issues | Missing Markers | Result |
| --- | --- | ---: | ---: | ---: | --- | --- |
| account-profile | phone | 0 | 0 | 0 | none | Pass |
| account-profile | desktop | 0 | 0 | 0 | none | Pass |

## Failure Detail

No failures.

## Notes

- This gate injects `axe-core` into local Chrome and fails on critical/serious WCAG violations.
- Moderate axe findings are recorded as warnings so they can be triaged without blocking unrelated release work.
- The keyboard smoke tabs through the first 12 focus stops and fails hidden, unnamed, or trapped/empty focus paths.
- The release shell now includes a global skip link to `#main-content` so keyboard users can bypass repeated navigation.
- Guest auth can be enabled with `QA_A11Y_AUTH_MODE=guest`; remote guest checks require `QA_A11Y_ALLOW_REMOTE_GUEST=1` so protected launch routes are not accidentally replaced by login-screen coverage.
