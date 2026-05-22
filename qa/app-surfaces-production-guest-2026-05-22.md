# Authenticated App Surfaces Smoke

Date: 2026-05-22
Base URL: https://globe-travel-two.vercel.app
Status: pass
Auth mode: guest

## Result

- Checked: 18
- Passed: 18
- Failed: 0
- Routes: 9
- Viewports: 2
- Guest cleanup: remote guest cleanup skipped

## Coverage

| Surface | Viewport | Expected Destination | Final URL | Result |
| --- | --- | --- | --- | --- |
| explore-alias | phone | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| globe-alias | phone | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| map-alias | phone | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| bucket-list-alias | phone | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| journal-alias | phone | `/saved?tab=journal` | https://globe-travel-two.vercel.app/saved?tab=journal | Pass |
| profile-alias | phone | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| settings-alias | phone | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| pricing-alias | phone | `/account?tab=billing` | https://globe-travel-two.vercel.app/account?tab=billing | Pass |
| onboarding-fullscreen | phone | `/onboarding` | https://globe-travel-two.vercel.app/onboarding | Pass |
| explore-alias | desktop | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| globe-alias | desktop | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| map-alias | desktop | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| bucket-list-alias | desktop | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| journal-alias | desktop | `/saved?tab=journal` | https://globe-travel-two.vercel.app/saved?tab=journal | Pass |
| profile-alias | desktop | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| settings-alias | desktop | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| pricing-alias | desktop | `/account?tab=billing` | https://globe-travel-two.vercel.app/account?tab=billing | Pass |
| onboarding-fullscreen | desktop | `/onboarding` | https://globe-travel-two.vercel.app/onboarding | Pass |

## Failures

- none

## Operating Meaning

This gate verifies that Globe.travel's secondary authenticated routes and compatibility aliases still land on useful user-facing surfaces after login or guest entry. It is intentionally smaller than the full release candidate suite, but catches broken redirects, empty pages, app errors, same-origin request failures, horizontal overflow, and missing core copy across phone and desktop.
