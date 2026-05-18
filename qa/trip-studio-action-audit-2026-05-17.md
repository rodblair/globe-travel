# Trip Studio Action Audit

Date: 2026-05-17
Status: Trip Studio action surface restored and smoke-gated

## Scope

This pass advances Month 3 of the platform completion plan: Trip Studio completion. It focused on whether the Studio exposes the owner actions, collaboration controls, map controls, public-share path, and read-only shared-preview state needed for a traveler to complete the core workflow clearly.

## Browser Finding

Browser inspection of the Trip Studio showed that the group review, crew brief, friend feedback, and planner workflow controls were present in code but hard-hidden from the interface. Browser also showed a read-only public trip session where owner-style actions were still visually active even though the page displayed the shared-preview warning.

## Fixes

- Restored the hidden Trip Studio readiness dock as a visible responsive panel.
- Kept the dock compact on the Trip Studio surface and positioned it as a right-side readiness rail on large screens.
- Restored access to:
  - group review
  - public link status
  - copy/share invite controls
  - crew brief
  - friend feedback summary
  - planner workflows
- Made shared-preview state clearer by disabling owner-only save, share, public-toggle, and planner workflow actions when the current user is not the owner.
- Added explicit read-only labels: `View only` and `Shared preview`.
- Added `npm run qa:studio`.
- Updated optional `QA_TRIP_ID` route smoke coverage so it validates the Trip Studio API contract instead of checking server HTML markers for a client-rendered page.

## Automation Evidence

Local command:

```bash
QA_TRIP_ID=bc1031dc-0df5-4c0d-9902-2aaaa7193ae0 \
QA_SHARE_SLUG=x3m2c8cnws \
npm run qa:studio
```

Optional route smoke command:

```bash
QA_TRIP_ID=bc1031dc-0df5-4c0d-9902-2aaaa7193ae0 npm run qa:smoke
```

Expected coverage:

- Trip Studio owner action controls remain present in source.
- Collaboration and workflow controls remain present in source.
- Read-only shared preview state remains explicit in source.
- Itinerary day and item actions remain present in source.
- Readiness controls are not hard-hidden.
- The dev-owned Athens Studio trip returns an editable mapped itinerary.
- The stable Athens public share baseline remains logged-out readable and fully mapped.
- Optional route smoke validates `/api/trips/<trip-id>` for the Studio fixture.

## Remaining Month 3 Work

- Browser-test edit, delete, reorder, swap, apply swap, optimize, rewrite, save, share, and open-public-link actions end to end.
- Add mutation-safe test fixtures or dry-run support for item edit/swap/delete actions.
- Add mobile screenshot evidence at 390 px and desktop evidence at 1440 px for the restored readiness rail.
