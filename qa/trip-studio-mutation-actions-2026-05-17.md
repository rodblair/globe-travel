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
  - reorder items within a day
  - move an item across days
  - delete an item
  - optimize a day
  - save trip title
  - enable public sharing
  - read the public share API
- Deletes the disposable trip and seeded places by default.

## Safety Controls

- The runner refuses to mutate non-local URLs unless `QA_ALLOW_REMOTE_MUTATION=1` is explicitly set.
- `QA_KEEP_FIXTURE=1` can keep a disposable fixture temporarily for Browser inspection.
- `QA_CLEANUP_TRIP_ID=<trip-id>` cleans up a kept or partial trip.
- `QA_CLEANUP_RUN_ID=<run-id>` removes seeded QA places for a kept fixture.

## Evidence

Local command:

```bash
npm run qa:studio-actions
```

Result:

- Passed `18/18`.
- Verified a disposable guest trip could be created, mutated, published, read through public share, and cleaned up.
- Browser inspection of a kept disposable fixture confirmed the Trip Studio displayed the saved QA title, read-only shared-preview state, public link, group review, crew brief, friend feedback, planner workflows, itinerary, and mapped Day 1 route.

## Remaining Month 3 Work

- Add true Browser click/type coverage for edit, day switching, public link opening, and share-link copying.
- Add swap-option coverage with a deterministic fixture or stubbed recommendation source.
- Add responsive screenshots for the action rail at phone, tablet, and desktop widths.
