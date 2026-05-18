# Trip Studio Recovery States

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Disposable fixture: `22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02`
Run id: `1ba54771`

## Purpose

Verify owner-side recovery states that must be solid before launch: failed optimization, failed sharing, failed workflow startup, destructive itinerary item deletion, and laptop layout overlap around the Trip Studio readiness panel.

## Fixes Covered

- `Optimize day` now checks API response status and shows a recovery message when the route/order optimization fails.
- `Share with friends`, `Copy link`, and `Share invite` now catch clipboard/share failures and show visible recovery copy.
- Planner workflow startup has a deterministic QA failure flag and visible recovery copy.
- Itinerary item delete is no longer one-click destructive; it opens an inline `Cancel` / `Delete item` confirmation.
- The desktop/laptop Trip Studio itinerary pane is shifted out of the right readiness panel hit area, preventing overlap and pointer interception at `1280px`.
- `npm run qa:visual` now accepts `QA_VISUAL_SETTLE_MS` for Mapbox-heavy or auth-hydrated pages that need a longer stable render window.

## Automated Recovery Gate

Command:

```bash
QA_TRIP_ID=22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02 QA_GUEST_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea npm run qa:studio-recovery
```

Result:

```json
{
  "checked": 6,
  "passed": 6,
  "failed": 0
}
```

Verified:

- Owner controls visible.
- Forced optimize failure message visible.
- Forced share failure message visible.
- Forced workflow failure message visible.
- Delete confirmation visible.
- No horizontal overflow.

## Focused Visual Gate

Command:

```bash
QA_TRIP_ID=22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02 QA_SHARE_SLUG=qa1ba54771 QA_VISUAL_RUN_ID=recovery-layout QA_VISUAL_ROUTES=trip-studio QA_VISUAL_PROGRESS=1 QA_VISUAL_SETTLE_MS=2200 npm run qa:visual
```

Result:

- Checked: `5`
- Passed: `5`
- Failed: `0`
- Artifact: `qa/visual-baseline-2026-05-18-recovery-layout/README.md`

## Browser Evidence

The in-app Browser loaded the owner-visible Trip Studio fixture with:

```text
/trips/22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02?qaOptimizeFailure=1&qaShareFailure=1&qaWorkflowFailure=1
```

It exposed the owner controls and itinerary action labels. Its click bridge timed out on this Mapbox-heavy page, so the durable Chrome-backed recovery gate above became the repeatable interaction proof.

## Cleanup

```bash
QA_CLEANUP_TRIP_ID=22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02 QA_CLEANUP_RUN_ID=1ba54771 npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were deleted successfully.
