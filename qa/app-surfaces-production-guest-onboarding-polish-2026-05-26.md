# Authenticated App Surfaces Smoke

Date: 2026-05-26
Base URL: https://globe-travel-two.vercel.app
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
| explore-alias | phone | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| globe-alias | phone | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| map-alias | phone | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| bucket-list-alias | phone | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| journal-alias | phone | `/saved?tab=journal` | https://globe-travel-two.vercel.app/saved?tab=journal | Pass |
| profile-alias | phone | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| settings-alias | phone | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| pricing-alias | phone | `/pricing` | https://globe-travel-two.vercel.app/pricing | Pass |
| trips-index-compat | phone | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| new-trip-compat | phone | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| onboarding-fullscreen | phone | `/onboarding` | https://globe-travel-two.vercel.app/onboarding | Pass |
| explore-alias | desktop | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| globe-alias | desktop | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| map-alias | desktop | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| bucket-list-alias | desktop | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| journal-alias | desktop | `/saved?tab=journal` | https://globe-travel-two.vercel.app/saved?tab=journal | Pass |
| profile-alias | desktop | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| settings-alias | desktop | `/account` | https://globe-travel-two.vercel.app/account | Pass |
| pricing-alias | desktop | `/pricing` | https://globe-travel-two.vercel.app/pricing | Pass |
| trips-index-compat | desktop | `/saved` | https://globe-travel-two.vercel.app/saved | Pass |
| new-trip-compat | desktop | `/chat` | https://globe-travel-two.vercel.app/chat | Pass |
| onboarding-fullscreen | desktop | `/onboarding` | https://globe-travel-two.vercel.app/onboarding | Pass |

## Failures

- none

## Operating Meaning

This gate verifies that Globe.travel's secondary authenticated routes, legacy trip entry paths, and compatibility aliases still land on useful user-facing surfaces after login or guest entry. It is intentionally smaller than the full release candidate suite, but catches broken redirects, empty pages, app errors, same-origin request failures, horizontal overflow, and missing core copy across phone and desktop.
