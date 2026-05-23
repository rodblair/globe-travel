# Accessibility And Keyboard Smoke

Date: 2026-05-23
Environment: http://localhost:3000
Public share slug: x3m2c8cnws
Trip Studio fixture: 1a81be2f-5691-40aa-b598-30fef2840abd
Auth mode: guest (external guest id)

## Result

- Checked: 2
- Passed: 2
- Failed: 0
- Artifact JSON: `qa/accessibility-keyboard-trip-studio-owner-2026-05-23/summary.json`
- Protected routes: trip-studio
- Guest cleanup: external guest id provided; owner cleanup remains with the caller
- Operator cleanup: temporary trip `1a81be2f-5691-40aa-b598-30fef2840abd` was deleted through `/api/trips/:id`, then guest profile/user `36d5213a-65f8-42be-950a-97f50fdda563` was removed with the Supabase service role.

| Route | Viewport | Axe Critical/Serious | Axe Moderate | Keyboard Issues | Missing Markers | Result |
| --- | --- | ---: | ---: | ---: | --- | --- |
| trip-studio | phone | 0 | 0 | 0 | none | Pass |
| trip-studio | desktop | 0 | 0 | 0 | none | Pass |

## Failure Detail

No failures.

## Notes

- This gate injects `axe-core` into local Chrome and fails on critical/serious WCAG violations.
- Moderate axe findings are recorded as warnings so they can be triaged without blocking unrelated release work.
- The keyboard smoke tabs through the first 12 focus stops and fails hidden, unnamed, or trapped/empty focus paths.
- The release shell now includes a global skip link to `#main-content` so keyboard users can bypass repeated navigation.
- Guest auth can be enabled with `QA_A11Y_AUTH_MODE=guest`; remote guest checks require `QA_A11Y_ALLOW_REMOTE_GUEST=1` so protected launch routes are not accidentally replaced by login-screen coverage.
