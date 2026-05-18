# Trip Studio Mutation Action QA

Date: 2026-05-17
Status: Mutation-safe Trip Studio action runner added

## Scope

This pass advances Month 3 of the platform completion plan by testing Trip Studio actions against a disposable guest-owned fixture instead of a real itinerary.

## Added Gate

Added:

```bash
npm run qa:studio-actions
```

The runner:

- Creates a disposable guest trip through `/api/trips`.
- Seeds two days, four mapped places, and four itinerary items.
- Exercises the app APIs used by Trip Studio actions:
  - update item title
  - return deterministic swap options
  - apply a selected swap replacement
  - reorder items within a day
  - move an item across days
  - delete an item
  - optimize a day
  - build maps with route persistence
  - save trip title
  - enable public sharing
  - read the public share API
- Deletes the disposable trip and seeded places by default.

## Safety Controls

- The runner refuses to mutate non-local URLs unless `QA_ALLOW_REMOTE_MUTATION=1` is explicitly set.
- `QA_KEEP_FIXTURE=1` can keep a disposable fixture temporarily for Browser inspection.
- `QA_AUTH_MODE=dev` creates the disposable fixture under the local development user, which is useful when Browser needs to test owner-only controls.
- `QA_GUEST_ID=<browser-guest-cookie>` creates the disposable fixture under a Browser-owned guest session for UI click/type checks.
- `QA_CLEANUP_TRIP_ID=<trip-id>` cleans up a kept or partial trip.
- `QA_CLEANUP_RUN_ID=<run-id>` removes seeded QA places for a kept fixture.
- `npm run qa:studio-browser-fixture` creates a routed disposable Trip Studio fixture for a supplied `QA_OWNER_USER_ID`, which is the preferred path for testing owner-only controls in the signed-in in-app Browser profile.

## Evidence

Local command:

```bash
npm run qa:studio-actions
```

Original result:

- Passed `18/18`.
- Verified a disposable guest trip could be created, mutated, published, read through public share, and cleaned up.
- Browser inspection of a kept disposable fixture confirmed the Trip Studio displayed the saved QA title, read-only shared-preview state, public link, group review, crew brief, friend feedback, planner workflows, itinerary, and mapped Day 1 route.

Updated result on 2026-05-18:

- Passed `21/21`.
- Added deterministic Athens swap coverage using fixture `constraints.destination_query = "Athens, Greece"`.
- Verified swap options returned three replacements for the fixture cafe item.
- Verified applying `Little Tree Books & Coffee` persisted the replacement title and mapped place before the item was moved/deleted by later mutation checks.

Updated result after Build maps coverage on 2026-05-18:

- Passed `23/23`.
- Added `hydrate-map` coverage.
- Verified Build maps completes or fails safely without Mapbox.
- Verified at least one usable route persists after Build maps when Mapbox is configured.

## Browser Click/Type Follow-Up

See `qa/trip-studio-browser-actions-2026-05-18.md`.

Completed:

- Owner-visible day switching.
- Item title edit through click, typing, and Enter.
- Save trip state.
- Share with friends state.
- View share navigation.
- Public read-only handoff check.
- Mobile-width swap menu opening at 390 x 844 with no horizontal overflow.
- Mobile-width apply-swap click coverage for `Little Tree Books & Coffee` after improving the swap preference chooser.
- Mobile-width Build maps click coverage with a visible `Maps built` success state.
- Mobile-width Rewrite day click coverage with Planner chat opening, visible pending state, generated Day 1 replacement stops, and post-rewrite share integrity checks.
- Mobile-width reorder click coverage through explicit `Move earlier` / `Move later` controls. This found and fixed a real display bug: timed items were sorted by `start_time`, so a reorder could persist without changing the visible itinerary. Explicit moves now swap adjacent time slots with the order mutation.
- Mobile-width direct-drag coverage through the itinerary grip. Direct drag now uses pointer gestures, updates the same visible time/order semantics as explicit move controls, persists after reload, and avoids horizontal overflow.
- Mobile-width Build maps failure coverage using the dev-only `?qaBuildMapsFailure=1` Browser QA flag.
- Mobile-width Rewrite day unavailable coverage using the dev-only `?qaRewriteUnavailable=1` Browser QA flag.
- Responsive geometry baseline for Trip Studio owner action surfaces at `390 x 844`, `768 x 1024`, and `1280 x 800`, with no horizontal overflow and `44px` touch-target coverage for checked actions.

## Remaining Month 3 Work

- Add durable screenshot artifacts for the action rail at phone, tablet, and desktop widths. Browser geometry coverage exists, but `Page.captureScreenshot` timed out on the Mapbox-heavy Trip Studio page.
