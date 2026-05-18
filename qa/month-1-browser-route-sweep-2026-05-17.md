# Month 1 Browser Route Sweep

Date: 2026-05-17
Target: `http://localhost:3000`
Tooling: Codex Browser plugin against the in-app browser
Status: Passed with one P2 accessibility fix applied and retested

## Scope

This sweep supports the Month 1 QA foundation in `PLATFORM_READINESS_ROADMAP.md`.

Routes checked:

- `/`
- `/chat`
- `/saved`
- `/saved?tab=journal`
- `/account`
- `/account?tab=billing`
- `/login`
- `/signup`
- `/trips/0746a2c6-2b9b-4753-bbb7-8c3e9b193d38`
- `/t/x3m2c8cnws`

Viewports checked:

- Phone: 390 x 844
- Laptop: 1280 x 800

Automated Browser checks:

- Document-level horizontal overflow
- Missing accessible labels on app-owned controls
- App-owned undersized tap targets on phone viewport
- Stale `Arcki` brand copy
- Visible error copy such as `Unhandled`, `undefined`, `NaN`, `Could not`, `Failed to`, `Unauthorized`, `Not found`, or `Application error`
- Route identity through primary heading
- Trip/public-share map render state
- Athens five-day day-tab and map-stop relationship

## Findings

### P2: Account Avatar Link Was Unlabeled

The circular account/profile link in the sidebar had no accessible name. It appeared on app shell routes including planner, saved, account, billing, and Trip Studio.

Fix:

- Added `aria-label="Open account settings"` to the sidebar account link in `client/components/layout/Sidebar.tsx`.

Retest:

- Browser retest found `0` missing labels on every checked route at 390 x 844 and 1280 x 800.

## Route Retest Summary

| Route | Mobile overflow | Desktop overflow | Missing labels | Stale brand/error text | Key proof |
| --- | --- | --- | --- | --- | --- |
| `/` | Pass | Pass | 0 | Pass | Landing headline renders |
| `/chat` | Pass | Pass | 0 | Pass | Planner surface renders |
| `/saved` | Pass | Pass | 0 | Pass | Saved trips list renders |
| `/saved?tab=journal` | Pass | Pass | 0 | Pass | Journal tab renders |
| `/account` | Pass | Pass | 0 | Pass | Profile surface renders |
| `/account?tab=billing` | Pass | Pass | 0 | Pass | Billing plan surface renders |
| `/login` | Pass | Pass | 0 | Pass | Guest and login entry render |
| `/signup` | Pass | Pass | 0 | Pass | Guest and signup entry render |
| `/trips/0746a2c6-2b9b-4753-bbb7-8c3e9b193d38` | Pass | Pass | 0 | Pass | Athens Trip Studio renders with Day 1-5 tabs and map canvas |
| `/t/x3m2c8cnws` | Pass | Pass | 0 | Pass | Athens public share renders with public map and feedback sections |

## Athens Five-Day Map Relationship

The Browser pass opened the Athens five-day Trip Studio route and exercised every day tab.

| Day | Map visible | Marker/stop proof |
| --- | --- | --- |
| Day 1 | Pass | 3 markers, `3 stops` |
| Day 2 | Pass | 3 markers, `3 stops` |
| Day 3 | Pass | 3 markers, `3 stops` |
| Day 4 | Pass | 3 markers, `3 stops` |
| Day 5 | Pass | 4 markers, `4 stops` |

The public Athens share page also rendered without auth, showed the trip title, itinerary content, map state, reactions, and the `Send the Globe.travel map link` sharing section.

## Evidence Notes

- Browser screenshots were attempted but the in-app browser timed out during `Page.captureScreenshot` in this session.
- DOM and rendered-state checks succeeded through the Browser plugin and were used as the release evidence for this pass.
- Desktop checks currently report some small secondary icon controls under 40 px. Phone checks report `0` undersized app-owned targets, so this is not treated as a mobile release blocker.

## Next QA Targets

- Add an automated screenshot capture path outside the currently timing-out Browser screenshot command.
- Expand this route sweep to tablet, desktop, and wide desktop as listed in the roadmap.
- Move the Browser DOM checks into a reusable visual QA script once the route matrix stabilizes.
- Continue Month 1 with full first-time planner creation, public feedback submission, account/billing entry, and saved-trip reopen/delete safety checks.
