# Authenticated App Surfaces Smoke

Date: 2026-05-23
Base URL: http://localhost:3000
Status: pass
Auth mode: guest

## Result

- Checked: 22
- Passed: 22
- Failed: 0
- Routes: 11
- Viewports: 2
- Guest cleanup: attempted (ok)

## Coverage

| Surface | Viewport | Expected Destination | Final URL | Result |
| --- | --- | --- | --- | --- |
| explore-alias | phone | `/chat` | http://localhost:3000/chat | Pass |
| globe-alias | phone | `/chat` | http://localhost:3000/chat | Pass |
| map-alias | phone | `/chat` | http://localhost:3000/chat | Pass |
| bucket-list-alias | phone | `/saved` | http://localhost:3000/saved | Pass |
| journal-alias | phone | `/saved?tab=journal` | http://localhost:3000/saved?tab=journal | Pass |
| profile-alias | phone | `/account` | http://localhost:3000/account | Pass |
| settings-alias | phone | `/account` | http://localhost:3000/account | Pass |
| pricing-alias | phone | `/pricing` | http://localhost:3000/pricing | Pass |
| trips-index-compat | phone | `/saved` | http://localhost:3000/saved | Pass |
| new-trip-compat | phone | `/chat` | http://localhost:3000/chat | Pass |
| onboarding-fullscreen | phone | `/onboarding` | http://localhost:3000/onboarding | Pass |
| explore-alias | desktop | `/chat` | http://localhost:3000/chat | Pass |
| globe-alias | desktop | `/chat` | http://localhost:3000/chat | Pass |
| map-alias | desktop | `/chat` | http://localhost:3000/chat | Pass |
| bucket-list-alias | desktop | `/saved` | http://localhost:3000/saved | Pass |
| journal-alias | desktop | `/saved?tab=journal` | http://localhost:3000/saved?tab=journal | Pass |
| profile-alias | desktop | `/account` | http://localhost:3000/account | Pass |
| settings-alias | desktop | `/account` | http://localhost:3000/account | Pass |
| pricing-alias | desktop | `/pricing` | http://localhost:3000/pricing | Pass |
| trips-index-compat | desktop | `/saved` | http://localhost:3000/saved | Pass |
| new-trip-compat | desktop | `/chat` | http://localhost:3000/chat | Pass |
| onboarding-fullscreen | desktop | `/onboarding` | http://localhost:3000/onboarding | Pass |

## Failures

- none

## Operating Meaning

This gate verifies that Globe.travel's secondary authenticated routes, legacy trip entry paths, and compatibility aliases still land on useful user-facing surfaces after login or guest entry. It is intentionally smaller than the full release candidate suite, but catches broken redirects, empty pages, app errors, same-origin request failures, horizontal overflow, and missing core copy across phone and desktop.
