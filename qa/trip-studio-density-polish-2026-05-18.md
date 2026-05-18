# Trip Studio Density Polish

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
User type: returning guest owner, Browser profile `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`

## Scope

This pass advances Week 1 of `PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md`: Trip Studio density and owner confidence.

The Browser-owned fixture was:

- Trip ID: `e4078deb-d26a-48c2-866f-bef409aa62ff`
- Share slug: `qa37baea50`
- Run ID: `37baea50`
- Destination context: Athens, Greece

## Browser Finding

Before the fix, the active in-app Browser viewport opened Trip Studio with the readiness cards ahead of the itinerary. The first working view showed:

- Top owner actions.
- Group review.
- Crew brief.
- Friend feedback.
- Planner workflows beginning below the fold.

The actual itinerary, selected route map, day tabs, and pinned stops were pushed out of the first working view. This made a functioning Trip Studio feel like an admin checklist before it felt like a trip plan.

Screenshot:

![Trip Studio before density polish](/Users/rodneyblair/Documents/GitHub/globe-travel/qa/trip-studio-density-browser-before-2026-05-18.png)

Severity: P2. The trip was usable, but the hierarchy worked against the primary owner job: reviewing and editing the itinerary.

## Fix

Updated `client/app/(app)/trips/[tripId]/page.tsx` so non-wide Trip Studio layouts prioritize the itinerary surface before readiness/workflow panels.

Changes:

- The Trip Studio root now uses a column flow below the wide-desktop layout.
- Top owner actions stay first.
- Itinerary/map/day controls now come next.
- Readiness, feedback, crew brief, and planner workflow panels move after the itinerary on non-wide layouts.
- Wide-desktop still keeps the established absolute workspace layout with itinerary and readiness panels side by side.
- Group review copy was shortened.
- Crew brief metadata now uses a denser responsive grid on non-wide layouts.

## Browser Retest

Retest URL:

`http://localhost:3000/trips/e4078deb-d26a-48c2-866f-bef409aa62ff`

Visible result in the in-app Browser:

- Itinerary title is visible immediately after the owner action bar.
- Day tabs are visible in the first working view.
- Selected route and map are visible in the first working view.
- Pinned stops are visible without needing to scroll through readiness cards first.
- Group review is still available below the itinerary.
- Horizontal overflow: `0`.

Measured Browser geometry after the fix:

- Viewport: `1103 x 745`
- `Itinerary` top: `171`
- `Selected route` top: `323`
- `Group review` top: `1620`
- Horizontal overflow: `0`

Screenshot:

![Trip Studio after density polish](/Users/rodneyblair/Documents/GitHub/globe-travel/qa/trip-studio-density-browser-after-2026-05-18.png)

## Function Checks

Browser verified:

- Day 2 switch works.
- Day 2 selected route changes to the Piraeus stop.
- Day 2 itinerary item remains visible and mapped to Greece.
- Save action enters a visible saving state and returns to the stable owner toolbar.
- No visible app error appeared.

## Automated Gates

Focused visual QA:

```bash
QA_TRIP_ID=e4078deb-d26a-48c2-866f-bef409aa62ff \
QA_SHARE_SLUG=qa37baea50 \
QA_GUEST_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea \
QA_VISUAL_AUTH_MODE=guest \
QA_VISUAL_RUN_ID=trip-studio-density-polish \
QA_VISUAL_ROUTES=trip-studio \
QA_VISUAL_VIEWPORTS=phone,laptop,desktop \
QA_VISUAL_SETTLE_MS=1500 \
npm run qa:visual
```

Result: passed `3/3`.

Artifacts:

- `qa/visual-baseline-2026-05-18-trip-studio-density-polish/README.md`
- `qa/visual-baseline-2026-05-18-trip-studio-density-polish/summary.json`

Trip Studio action regression:

```bash
npm run qa:studio-actions
```

Result: passed `23/23`.

Trip Studio recovery regression:

```bash
QA_TRIP_ID=e4078deb-d26a-48c2-866f-bef409aa62ff \
QA_SHARE_SLUG=qa37baea50 \
QA_GUEST_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea \
npm run qa:studio-recovery
```

Result: passed `6/6`.

## Remaining Risk

This pass improves the non-wide Trip Studio hierarchy and verifies the owner fixture. The broader active goal still needs the remaining 12-week plan: planner/map trust expansion, saved/account density, public-share viral loop depth, auth edge cases, paid path checks, accessibility depth, production rehearsal, and launch-candidate signoff.
