# Trip Studio Browser Action QA

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Browser profile: signed-in local profile `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`
Disposable fixture: `396044d2-153b-4de2-b0c0-ef62f7dd76a2`
Share slug: `qaa827f8c6`
Run id: `a827f8c6`

## Purpose

Verify that Trip Studio owner-only controls work through real Browser clicks and typing, not only through API scripts or source checks.

## Browser Actions Verified

- Opened the owner-visible Trip Studio fixture.
- Confirmed owner controls were visible:
  - `Save trip`
  - `Planner chat`
  - `Optimize day`
  - `Build maps`
  - `Share with friends`
  - `Group review`
  - `Crew brief`
  - `Friend feedback`
  - `Planner workflows`
- Clicked `Day 2` and confirmed:
  - `QA Browser Piraeus Ferry a827f8c6` was visible.
  - `Day 2 map` was visible.
- Clicked back to `Day 1` and confirmed:
  - `QA Browser Acropolis Museum a827f8c6` was visible.
  - `Day 1 map` was visible.
- Clicked the itinerary item edit control.
- Typed `QA Browser Edited a827f8c6`.
- Pressed `Enter` and confirmed the edited item appeared in Trip Studio.
- Clicked `Save trip` and confirmed the control reached `Saved`.
- Clicked `Share with friends` and confirmed:
  - `Link copied` state appeared.
  - `View share` became visible.
- Clicked `View share` and confirmed navigation to `/t/qaa827f8c6`.
- Confirmed the public share page showed:
  - `QA Browser Studio a827f8c6`
  - The edited item title `QA Browser Edited a827f8c6`
  - Day 1 and Day 2 itinerary maps
  - Feedback form
  - Copy/share controls
  - `Start your own trip`
- Confirmed the public share page did not expose owner-only `Save trip`.

## Follow-Up Fix From QA

The first fixture had mapped items but no persisted `trip_routes`, so strict public-share QA correctly failed route integrity. The Browser fixture helper now seeds route rows for both days, and the current disposable fixture was patched with routes before final verification.

## Commands Verified

```bash
QA_EXPECT_OWNER=0 QA_TRIP_ID=396044d2-153b-4de2-b0c0-ef62f7dd76a2 QA_SHARE_SLUG=qaa827f8c6 npm run qa:studio
```

Result: passed 7/7.

```bash
QA_SHARE_SLUG=qaa827f8c6 npm run qa:share
```

Result: passed 4/4.

```bash
QA_OWNER_USER_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea npm run qa:studio-browser-fixture
```

Result: created a routed Browser-owned fixture with `dayCount: 2`, `placeCount: 4`, `itemCount: 4`, and `routeCount: 2`.

```bash
QA_CLEANUP_TRIP_ID=396044d2-153b-4de2-b0c0-ef62f7dd76a2 QA_CLEANUP_RUN_ID=a827f8c6 npm run qa:studio-browser-fixture
QA_CLEANUP_TRIP_ID=6013be21-2ae2-4fdd-a9b3-d7d4e960d8f9 QA_CLEANUP_RUN_ID=824560cd npm run qa:studio-browser-fixture
```

Result: both disposable fixtures were cleaned up successfully.

## Remaining Trip Studio Browser Gaps

- Rewrite day failure state when planner chat is unavailable is covered with the dev-only Browser QA flag.
- Build maps failure state is covered with the dev-only Browser QA flag.
- Direct drag gesture coverage and mobile explicit move controls are now covered.
- Broader mobile-width click/type pass for rewrite, build-map, drag/reorder, and planner workflow controls.

## 2026-05-18 Swap And Mobile Follow-Up

Disposable fixture: `5ffd58d8-934d-4c73-b1e1-2682b524d9e0`
Share slug: `qaa2c199c6`
Run id: `a2c199c6`

Browser viewport:

- `390 x 844`
- `documentElement.scrollWidth: 390`
- `documentElement.clientWidth: 390`
- horizontal overflow: `false`

Browser actions verified:

- Opened a fresh owner-visible Trip Studio fixture at mobile width.
- Confirmed `Share with friends` and `Day 1 map` were visible with no horizontal overflow.
- Scrolled to the itinerary item actions.
- Opened the swap menu for `QA Browser Plaka Cafe a2c199c6`.
- Confirmed the menu exposed:
  - `Similar nearby`
  - `More relaxed`
  - `More iconic`

Browser limitation observed:

- A follow-up click on `More relaxed` hit a stale DOM target after the menu shifted and navigated to `Plan`. The Browser evidence therefore confirms visible swap-menu availability at mobile width, but not Browser-level apply-swap completion.
- The apply-swap behavior is covered by `npm run qa:studio-actions`, which now verifies deterministic swap options and applying `Little Tree Books & Coffee`.

Focused checks:

```bash
QA_EXPECT_OWNER=0 QA_TRIP_ID=5ffd58d8-934d-4c73-b1e1-2682b524d9e0 QA_SHARE_SLUG=qaa2c199c6 npm run qa:studio
```

Result: passed 7/7 after publishing the disposable fixture.

```bash
QA_SHARE_SLUG=qaa2c199c6 npm run qa:share
```

Result: passed 4/4 after publishing the disposable fixture.

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=5ffd58d8-934d-4c73-b1e1-2682b524d9e0 QA_CLEANUP_RUN_ID=a2c199c6 npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.

## 2026-05-18 Browser Direct-Drag Completion

UI fix:

- Replaced the grip's native HTML5 `draggable` dependency with a pointer-driven drag fallback so mouse/touch drag works in the in-app Browser and on touch-first surfaces.
- Centralized same-day reorder operations so direct drag and explicit move controls both update `order_index` and the visible time slots.
- The drag grip now updates drop highlighting during pointer movement and uses the same persisted mutation path as the verified move controls.

Disposable fixture: `37f2185a-4a66-4e6e-8faf-07811442c24e`
Run id: `14bb4605`

Browser viewport:

- `390 x 844`
- horizontal overflow after direct drag: `false`

Browser actions verified:

- Opened a fresh owner-visible Trip Studio fixture.
- Scrolled to the Day 1 itinerary controls.
- Dragged the `QA Browser Lycabettus View 14bb4605` grip above `QA Browser Acropolis Museum 14bb4605`.
- Confirmed the visible Day 1 order changed:
  - `QA Browser Lycabettus View 14bb4605`
  - `QA Browser Acropolis Museum 14bb4605`
  - `QA Browser Plaka Cafe 14bb4605`
- Confirmed the time slots followed the reordered items:
  - Lycabettus became `09:00-10:30`
  - Acropolis became `11:00-12:00`
  - Plaka Cafe became `13:00-14:00`
- Reloaded the Trip Studio page and confirmed the direct-drag order persisted.
- Confirmed no horizontal overflow.

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=37f2185a-4a66-4e6e-8faf-07811442c24e QA_CLEANUP_RUN_ID=14bb4605 npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.

## 2026-05-18 Browser Failure-State Coverage

UI/testability fix:

- Added dev-only URL flags for Browser QA:
  - `?qaBuildMapsFailure=1` forces the Trip Studio Build maps control through its visible rebuild error path.
  - `?qaRewriteUnavailable=1` forces Rewrite day through the existing planner-connecting failure path.
- Improved Build maps error handling so a real `Mapbox token not configured` API response produces clearer user copy instead of a generic failure.

Disposable fixture: `c8dbe3d4-a30b-4944-89c1-f0216b300030`
Run id: `e010ca3c`

Browser viewport:

- `390 x 844`
- horizontal overflow after Build maps failure: `false`
- horizontal overflow after Rewrite day failure: `false`

Browser actions verified:

- Opened the owner-visible Trip Studio fixture with `?qaBuildMapsFailure=1`.
- Clicked `Build maps`.
- Confirmed:
  - `Could not rebuild the maps. Try again, or refresh the page if the trip changed.`
  - no false `Maps built` success state
  - page remained on the Trip Studio URL
  - no horizontal overflow
- Opened the same fixture with `?qaRewriteUnavailable=1`.
- Scrolled to the itinerary action controls.
- Clicked `Rewrite day`.
- Confirmed:
  - `Planner chat is still connecting. Try Rewrite day again in a moment.`
  - no pending `Rewrite request for Day` notice
  - page remained on the Trip Studio URL
  - no horizontal overflow

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=c8dbe3d4-a30b-4944-89c1-f0216b300030 QA_CLEANUP_RUN_ID=e010ca3c npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.

## 2026-05-18 Browser Reorder Completion

UI fix:

- Added explicit `Move earlier` and `Move later` controls to each editable itinerary item so reorder is usable on mobile and does not depend on desktop-only drag precision.
- Restricted drag start to the grip handle instead of making the entire item card draggable, preventing accidental drags when users tap edit, swap, delete, or reorder controls.
- Updated the explicit move action to swap the adjacent time slots as well as `order_index`; this fixes the user-visible bug where a reorder mutation could succeed but the itinerary still appeared unchanged because timed items were sorted by `start_time`.

Disposable fixture: `e78bb398-0cc4-461b-804d-1b72d8ef948a`
Run id: `c7616ad4`

Browser viewport:

- `390 x 844`
- horizontal overflow after reorder: `false`

Browser actions verified:

- Opened a fresh owner-visible Trip Studio fixture.
- Confirmed accessible reorder controls existed for Day 1 items:
  - `Move QA Browser Acropolis Museum c7616ad4 earlier`
  - `Move QA Browser Acropolis Museum c7616ad4 later`
  - `Move QA Browser Plaka Cafe c7616ad4 earlier`
  - `Move QA Browser Plaka Cafe c7616ad4 later`
- Scrolled the mobile Trip Studio surface to the Day 1 itinerary controls.
- Clicked `Move QA Browser Plaka Cafe c7616ad4 earlier`.
- Confirmed the visible Day 1 order changed from Acropolis first to Plaka Cafe first.
- Confirmed the time slots moved with the reordered item:
  - `QA Browser Plaka Cafe c7616ad4` became `09:00-10:30`
  - `QA Browser Acropolis Museum c7616ad4` became `11:00-12:00`
- Reloaded the Trip Studio page and confirmed the reordered sequence persisted.
- Confirmed no horizontal overflow.

## 2026-05-18 Browser Rewrite-Day Completion

UI fix:

- Rewrite day now opens Planner chat automatically.
- Rewrite day shows an immediate pending notice while the planner request is being sent.
- Rewrite day disables rewrite controls while the request is active.
- Rewrite day has explicit failure copy if planner chat is not ready or the request cannot be sent.

Disposable fixture: `5f0b4e67-3068-4f3e-bc2a-a3489b968540`
Share slug: `qa56cbea9d`
Run id: `56cbea9d`

Browser viewport:

- `390 x 844`
- horizontal overflow before rewrite: `false`
- horizontal overflow after rewrite: `false`

Browser actions verified:

- Opened the owner-visible Trip Studio fixture.
- Scrolled to the itinerary header.
- Clicked `Rewrite day`.
- Confirmed:
  - Planner chat opened.
  - `Rewrite request for Day 1 is opening in Planner chat.`
  - `Requesting...` state appeared.
  - no rewrite error copy appeared.
  - page stayed on the Trip Studio URL.
  - no horizontal overflow.
- Confirmed the planner request appeared in chat.
- Confirmed Day 1 updated with generated stops including `Ancient Agora of Athens` and `Kuzina`.

Focused checks:

```bash
QA_EXPECT_OWNER=0 QA_TRIP_ID=5f0b4e67-3068-4f3e-bc2a-a3489b968540 QA_SHARE_SLUG=qa56cbea9d npm run qa:studio
```

Result: passed 7/7 after publishing the disposable fixture. Day 1 had 8 mapped items and 1 usable route; Day 2 had 1 mapped item and 1 usable route.

```bash
QA_SHARE_SLUG=qa56cbea9d npm run qa:share
```

Result: passed 4/4 after publishing the disposable fixture. Public share integrity showed Day 1 title `Acropolis & Plaka`, all items mapped in Greece, and usable routes for both days.

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=5f0b4e67-3068-4f3e-bc2a-a3489b968540 QA_CLEANUP_RUN_ID=56cbea9d npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.

## 2026-05-18 Browser Build-Maps Completion

UI fix:

- Added a brief `Maps built` success state to the top-level Trip Studio Build maps action.
- The button now mirrors the existing save/optimize/share success pattern with a green check state.

Disposable fixture: `f5eb0f94-910d-4216-9f0c-5dd12b66e978`
Share slug: `qa946392b8`
Run id: `946392b8`

Browser viewport:

- `390 x 844`
- horizontal overflow before Build maps: `false`
- horizontal overflow after Build maps: `false`

Browser actions verified:

- Opened the owner-visible Trip Studio fixture.
- Confirmed `Build maps` was visible in the mobile action grid.
- Clicked `Build maps`.
- Confirmed:
  - `Maps built`
  - no `Could not rebuild the maps` error
  - page remained on the Trip Studio URL
  - no horizontal overflow

Mutation-safe gate:

```bash
npm run qa:studio-actions
```

Result: passed 23/23 after adding:

- `build maps completes or fails safely without Mapbox`
- `build maps persists at least one usable route when Mapbox is configured`

Focused checks:

```bash
QA_EXPECT_OWNER=0 QA_TRIP_ID=f5eb0f94-910d-4216-9f0c-5dd12b66e978 QA_SHARE_SLUG=qa946392b8 npm run qa:studio
```

Result: passed 7/7 after publishing the disposable fixture.

```bash
QA_SHARE_SLUG=qa946392b8 npm run qa:share
```

Result: passed 4/4 after publishing the disposable fixture.

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=f5eb0f94-910d-4216-9f0c-5dd12b66e978 QA_CLEANUP_RUN_ID=946392b8 npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.

## 2026-05-18 Browser Apply-Swap Completion

UI fix:

- Changed the mobile swap preference chooser from an absolute dropdown inside the item action row to a fixed bottom-sheet style panel above the bottom navigation.
- Kept the original compact dropdown behavior on larger screens.
- Added `destination_query: "Athens, Greece"` to Browser-owned fixtures so Browser swap tests use the same deterministic Athens replacement catalog as `qa:studio-actions`.

Disposable fixture: `5546faab-5906-4d55-89ea-cab95e165dfa`
Share slug: `qa5a3f765e`
Run id: `5a3f765e`

Browser viewport:

- `390 x 844`
- horizontal overflow before swap: `false`
- horizontal overflow after apply-swap: `false`

Browser actions verified:

- Opened the owner-visible Trip Studio fixture.
- Scrolled to `QA Browser Plaka Cafe 5a3f765e`.
- Opened the mobile swap preference chooser.
- Clicked `More relaxed`.
- Confirmed replacement candidates appeared with `Little Tree Books & Coffee`.
- Clicked `Little Tree Books & Coffee`.
- Confirmed:
  - `Swapped to Little Tree Books & Coffee`
  - `Little Tree Books & Coffee` visible in the itinerary
  - original `QA Browser Plaka Cafe 5a3f765e` absent
  - page remained on the Trip Studio URL
  - no horizontal overflow

Focused checks:

```bash
QA_EXPECT_OWNER=0 QA_TRIP_ID=5546faab-5906-4d55-89ea-cab95e165dfa QA_SHARE_SLUG=qa5a3f765e npm run qa:studio
```

Result: passed 7/7 after publishing the disposable fixture.

```bash
QA_SHARE_SLUG=qa5a3f765e npm run qa:share
```

Result: passed 4/4 after publishing the disposable fixture.

Cleanup:

```bash
QA_CLEANUP_TRIP_ID=5546faab-5906-4d55-89ea-cab95e165dfa QA_CLEANUP_RUN_ID=5a3f765e npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.
