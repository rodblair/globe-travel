# Full Platform Route Inventory Smoke

Date: 2026-06-05
Base URL: https://globe-travel-two.vercel.app
Status: pass

## Result

- Checked: 22
- Passed: 22
- Failed: 0
- Public routes: 8
- Protected routes: 14
- Missing source files: 0

## Route Coverage

| Route | Access | Expected | Final URL | Status | Result |
| --- | --- | --- | --- | --- | --- |
| `/` | public | renders | https://globe-travel-two.vercel.app/ | 200 | Pass |
| `/login` | public | renders | https://globe-travel-two.vercel.app/login | 200 | Pass |
| `/signup` | public | renders | https://globe-travel-two.vercel.app/signup | 200 | Pass |
| `/reset-password` | public | renders | https://globe-travel-two.vercel.app/reset-password | 200 | Pass |
| `/callback` | public | renders | https://globe-travel-two.vercel.app/callback | 200 | Pass |
| `/auth/callback-client` | public | renders | https://globe-travel-two.vercel.app/auth/callback-client | 200 | Pass |
| `/t/x3m2c8cnws` | public | renders | https://globe-travel-two.vercel.app/t/x3m2c8cnws | 200 | Pass |
| `/chat` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fchat | 200 | Pass |
| `/explore` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fexplore | 200 | Pass |
| `/globe` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fglobe | 200 | Pass |
| `/map` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fmap | 200 | Pass |
| `/bucket-list` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fbucket-list | 200 | Pass |
| `/journal` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fjournal | 200 | Pass |
| `/saved` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fsaved | 200 | Pass |
| `/account` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Faccount | 200 | Pass |
| `/account?tab=billing` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Faccount%3Ftab%3Dbilling | 200 | Pass |
| `/pricing` | public | renders | https://globe-travel-two.vercel.app/pricing | 200 | Pass |
| `/profile` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fprofile | 200 | Pass |
| `/settings` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fsettings | 200 | Pass |
| `/trips` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fsaved | 200 | Pass |
| `/trips/new` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fchat | 200 | Pass |
| `/onboarding` | protected | login-redirect | https://globe-travel-two.vercel.app/login?next=%2Fonboarding | 200 | Pass |

## Failures

- none

## Operating Meaning

This gate covers the full top-level web route inventory that ships in the current app shell. It complements the deeper release-candidate, visual, accessibility, share, planner, billing, and Trip Studio gates by ensuring every public page, protected page, and compatibility redirect still resolves to an intentional destination.
