# Accessibility And Keyboard Guest Auth Evidence

Date: 2026-05-21

## Issue

The production accessibility smoke could report false planner coverage when protected routes were opened without a guest session. `/chat` redirected to the login screen, so the gate failed on missing planner markers instead of testing the first-time guest planner experience.

## Fix

- Added guest-session support to `npm run qa:a11y` through `QA_A11Y_AUTH_MODE=guest`.
- Added an explicit remote-safety flag, `QA_A11Y_ALLOW_REMOTE_GUEST=1`, before remote guest accessibility checks can create cleanup-required guest state.
- Added generated guest cleanup with Supabase service-role credentials, matching the visual QA safety pattern.
- Added auth metadata, protected route coverage, and cleanup status to the accessibility artifact.
- Added accessibility artifact checks to launch signoff so release approval now requires guest-auth protected route coverage.

## Verification

Local guest accessibility:

```bash
QA_A11Y_ARTIFACT_NAME=accessibility-keyboard-local-guest-2026-05-21 npm run qa:a11y
```

Result: `16/16` passed.

Production guest accessibility:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_A11Y_AUTH_MODE=guest QA_A11Y_ALLOW_REMOTE_GUEST=1 QA_A11Y_ARTIFACT_NAME=accessibility-keyboard-production-guest-2026-05-21 npm run qa:a11y
```

Result: `16/16` passed.

- Protected routes covered as guest: planner, saved trips, account profile, account billing
- Viewports covered: phone, desktop
- Axe critical/serious violations: `0`
- Keyboard failures: `0`
- Missing markers: `0`
- Generated guest cleanup: attempted and successful

Launch signoff:

```bash
QA_LAUNCH_EXPECTED_COMMIT=0d7d9e5716d54680407558fd092d2e56a956f166 npm run qa:launch-signoff
```

Result: `47/47` passed, including the new accessibility and keyboard artifact checks.
