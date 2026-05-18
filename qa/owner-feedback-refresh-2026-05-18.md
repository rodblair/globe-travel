# Owner Feedback Refresh QA

Date: 2026-05-18
Surface: Trip Studio owner feedback loop
Goal: verify that feedback submitted from a public share link appears in the owner planning surface and can drive the feedback refresh workflow.

## Fixture

- Owner profile: Browser-authenticated local profile `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`
- Fixture run: `6705e657`
- Trip: `df05fa45-f029-4f54-a110-ffadd5a81024`
- Public share slug: `qa6705e6571`
- Feedback id kept for Browser inspection: `06fd91c1-fddb-47fd-8ed3-2cc6a366ff9b`

## Automated Gate

Command:

```bash
QA_SHARE_SLUG=qa6705e6571 QA_TRIP_ID=df05fa45-f029-4f54-a110-ffadd5a81024 QA_VERIFY_TRIP_FEEDBACK=1 QA_KEEP_FEEDBACK=1 npm run qa:share-feedback
```

Result: passed `6/6`.

Verified:

- Public feedback API was readable before submission.
- Invalid feedback was rejected with `400` and `Invalid feedback`.
- Valid friend feedback was accepted with `201`.
- Submitted feedback appeared in public readback.
- Trip Studio feedback feed included the same submitted friend reaction.
- Inserted feedback was kept temporarily for Browser inspection.

## Browser Evidence

Browser URL:

```text
http://localhost:3000/trips/df05fa45-f029-4f54-a110-ffadd5a81024
```

Viewport: in-app Browser desktop viewport, `1103px` client width.

Owner UI verified:

- Trip title rendered: `QA 3 Days in Lisbon 6705e657`.
- Owner mode was active: `Save trip` was present and the shared-preview warning was absent.
- `Friend feedback` panel rendered.
- `1 review` rendered.
- `QA Friend e8d89a4f` rendered.
- Feedback comment rendered: `QA feedback e8d89a4f: Day 2 looks strong...`.
- Readiness copy reflected feedback: `crew reacting`.
- `Refresh plan from feedback` action was visible.
- No horizontal overflow was detected.
- Only third-party Mapbox controls appeared below the 44px app-owned target bar.

Workflow verification:

- Browser clicked `Refresh plan from feedback`.
- The latest workflow rendered as `Feedback Refresh`.
- Workflow status rendered as `COMPLETED`.
- Result included `"status": "ready"`.
- Result summary included: `The planner should rebalance Lisbon, Portugal around: there are practical concerns to address.`
- Suggested prompt included: `Rework this Lisbon, Portugal itinerary to address the latest friend feedback while keeping it fun for the group.`

## Cleanup

Disposable cleanup commands:

```bash
QA_CLEANUP_FEEDBACK_ID=06fd91c1-fddb-47fd-8ed3-2cc6a366ff9b npm run qa:share-feedback
QA_CLEANUP_TRIP_IDS=df05fa45-f029-4f54-a110-ffadd5a81024,61c5f2d0-5b34-422e-9df0-bc8be4e205bd,feb68f87-39b5-4647-a4a6-53ef450b2bad QA_CLEANUP_RUN_ID=6705e657 npm run qa:share-fixtures
QA_CLEANUP_TRIP_IDS=d58f0714-f885-4b31-b78d-02d0452e1cb6,632df807-18ba-405e-a0d9-d3c2c14815a2,293a707c-cd55-4ea1-85ee-a95146c7cd63 QA_CLEANUP_RUN_ID=47de7d63 npm run qa:share-fixtures
```

## Findings

- P0/P1: none.
- P2: Browser viewport override remains unreliable in the in-app Browser runtime, so this evidence is desktop-width. The full responsive visual baseline remains a separate sprint.
- P2: third-party Mapbox controls remain below the app-owned `44px` target standard; app-owned controls were not the failing controls in this check.

