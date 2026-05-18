# Planner Handoff Responsive Visual Baseline

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Browser profile: signed-in local profile `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`

## Purpose

Verify the first-time planner entry surface and the planner-to-Trip-Studio handoff as a realistic user journey. This pass focused on the empty planner state, mobile primary action visibility, query-prompt deep links, and a normal five-day Athens trip handoff.

## Viewports Checked

| Viewport | Size | Horizontal Overflow | Planner Headline | Primary Input | Map Preview |
|---|---:|---|---|---|---|
| Phone | `390 x 844` | No | Visible | Visible in first screen | Present below primary planner content |
| Tablet | `768 x 1024` | No | Visible | Visible | Present |
| Desktop | `1280 x 800` | No | Visible | Visible | Present |

## Browser Findings And Fixes

### P1: Mobile Planner Primary Action Was Buried

Initial Browser pass at `390 x 844` showed the planner input below the first useful mobile viewport because the empty chat card and map preview stacked before the composer. A first-time user could read the planner promise but not immediately act.

Fix:

- Changed the planner page root to use the app-shell height with `h-full min-h-0`.
- Tightened empty-state panel heights and spacing.
- Kept the planner composer as a visible bottom composer above the app bottom navigation.

Retest:

- `390 x 844`: no horizontal overflow, planner headline visible, `Describe your trip idea` input visible around `252 x 39`, `Send` visible at `60 x 44`.
- `768 x 1024`: no horizontal overflow, planner headline and composer visible.
- `1280 x 800`: no horizontal overflow, planner headline and composer visible.

### P1: Query Prompt Handoff Could Silently Stall

Browser-tested `/chat?q=...` for an Athens prompt. The page rendered the planner but did not start the handoff. Root cause: the auto-send effect marked a query as sent before the delayed send executed; a dependency refresh could cancel the timer and prevent a retry.

Fix:

- Replaced the one-time query ref with a current `queryPrompt` value from `useSearchParams`.
- Moved the `sentQueryRef` assignment into the delayed send callback so canceled timers do not mark prompts as handled.

Retest:

- Navigated from `/saved` to `/chat?q=Plan%20a%205%20day%20Athens...`.
- Browser reached `/trips/a52d8ef8-4579-4ad9-9f81-5f1f871854b3?prompt=...`.
- Trip Studio loaded with `5 Days in Athens`.
- Day tabs `Day 1` through `Day 5` were visible.
- `Save trip`, `Planner chat`, `Optimize day`, `Build maps`, and `Share with friends` were present.
- No visible error copy appeared.

## Normal Athens Five-Day Handoff Evidence

Prompt:

```text
Plan a 5 day Athens trip for 4 friends with history food relaxed pacing and one memorable night out
```

Result:

- Trip Studio opened successfully.
- Generated draft title: `5 Days in Athens`.
- The itinerary had five visible day tabs.
- Owner actions were available.
- The selected day map state rendered without crashing.

## Cleanup

Browser-created disposable trip cleanup:

```bash
QA_CLEANUP_TRIP_ID=8932993f-a960-464d-873a-3d40f1378d60 npm run qa:studio-browser-fixture
QA_CLEANUP_TRIP_ID=a52d8ef8-4579-4ad9-9f81-5f1f871854b3 npm run qa:studio-browser-fixture
```

Result: both temporary trips were deleted successfully.

## 2026-05-18 Repeatable Handoff Gate

Added:

```bash
npm run qa:planner-handoff
```

What it verifies:

- `/chat?q=...` route is reachable and renders planner markers.
- Planner source derives the query prompt from current search params.
- Planner source does not use stale one-shot query refs.
- The query handoff marks a query as sent only inside the delayed send callback, preventing canceled timers from silently swallowing prompts.
- The handoff preserves the prompt in the Trip Studio URL.
- Draft-trip creation still includes days and destination constraints.
- The mobile composer keeps the explicit `Describe your trip idea` label.
- The trip API accepts the handoff payload, creates a five-day Athens draft shell, and the script cleans up the disposable draft.

Local result:

```bash
npm run qa:planner-handoff
```

Passed `10/10`; disposable draft `e17382a4-f39f-48d6-82cf-9ad982b15a32` was deleted.

Browser retest:

- Viewport: `390 x 844`
- Start: `/saved`
- Action: navigate to `/chat?q=Plan%20a%205%20day%20Athens...`
- Result URL: `/trips/1146c861-c330-494b-8c09-38bf41c4638b?prompt=...`
- Confirmed:
  - `5 Days in Athens`
  - `Day 1` through `Day 5`
  - `Save trip`
  - `Planner chat`
  - `Optimize day`
  - `Build maps`
  - `Share with friends`
  - no visible error copy
  - no horizontal overflow

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=1146c861-c330-494b-8c09-38bf41c4638b npm run qa:studio-browser-fixture
```

Result: Browser-created temporary trip was deleted successfully.

## Remaining Follow-Ups

- Continue visual-regression artifact work with a screenshot path that avoids the in-app Browser Mapbox screenshot timeout.
