# Planner Start Confidence

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
User type: first-time planner / guest-style Browser session

## Scope

This pass advances Week 2 of `PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md`: planner start-to-trip confidence.

The target was the first value moment:

- A user arrives at `/chat`.
- They describe a real trip idea.
- Globe starts a Trip Studio draft.
- Slow or failed draft creation stays legible and recoverable.

## Finding

The planner empty state was clear, but the handoff from a trip idea to Trip Studio needed stronger resilience:

- Starter prompt cards stayed clickable while a draft was opening.
- The visible waiting state was mostly limited to the bottom input placeholder.
- A failed draft start only showed plain error copy.
- The typed or deep-linked prompt was not clearly preserved for retry.

Severity: P2. The happy path worked, but a slow or failed first planning action could feel like a dead click during the highest-leverage activation moment.

## Fix

Updated `client/app/(app)/chat/page.tsx`:

- Added a visible `Opening Trip Studio...` progress panel during draft creation.
- Shows the prompt being carried into the draft.
- Disables starter prompt cards while opening to prevent duplicate draft starts.
- Preserves the failed prompt in the input.
- Adds a `Try again` action after failed draft creation.
- Added local QA flags for repeatable Browser recovery checks:
  - `?qaPlannerDraftFailure=1`
  - `?qaPlannerDraftDelayMs=<ms>`

Updated `client/scripts/platform-planner-handoff-smoke.mjs`:

- The handoff gate now checks for visible opening-state source.
- The gate checks failed-prompt retry preservation.
- The gate checks duplicate-start prevention while opening.

## Browser Evidence

Test URL:

`/chat?q=Plan%20a%203%20day%20Athens%20trip%20for%20friends%20with%20food%20and%20history&qaPlannerDraftFailure=1&qaPlannerDraftDelayMs=1200`

Browser verified the delayed opening state:

- `Opening Trip Studio...` appeared.
- The draft prompt was shown.
- Starter prompt buttons were disabled.
- Composer was disabled with `Opening Trip Studio...`.

Browser then verified the forced failure recovery:

- Error copy appeared: `Could not open Trip Studio. Your trip idea is still here, so you can try again.`
- `Try again` appeared.
- The original Athens prompt was preserved in the input.
- Starter prompt buttons became usable again.
- No visible app error appeared.

Screenshot:

![Planner recovery state](/Users/rodneyblair/Documents/GitHub/globe-travel/qa/planner-start-recovery-browser-2026-05-18.png)

## Automated Gates

Planner handoff:

```bash
npm run qa:planner-handoff
```

Result: passed `13/13`.

Focused planner visual QA:

```bash
QA_VISUAL_RUN_ID=planner-start-recovery \
QA_VISUAL_ROUTES=planner \
QA_VISUAL_VIEWPORTS=phone,laptop,desktop \
QA_VISUAL_SETTLE_MS=1200 \
npm run qa:visual
```

Result: passed `3/3`.

Artifacts:

- `qa/visual-baseline-2026-05-18-planner-start-recovery/README.md`
- `qa/visual-baseline-2026-05-18-planner-start-recovery/summary.json`

Slow-network gate:

```bash
npm run qa:slow-network
```

Result: passed `7/7`.

Relevant planner assertion:

- `planner slow draft creation shows progress and reaches Trip Studio`
- Placeholder: `Opening Trip Studio...`
- Horizontal overflow: none at `390 x 844`
- Disposable draft cleanup: passed

Prompt-suite regression:

```bash
npm run qa:prompt-suite
```

Result: passed `52/52`.

Hard local checks:

```bash
npm run lint
npm run build
git diff --check
```

Result: all passed.

## Remaining Risk

This pass strengthens the first planner handoff and recovery state. The broader launch goal still requires continued Week 2 planner/map trust work: larger prompt actuals, more wrong-country repair evidence, and production-like generated itinerary sampling beyond the stable Athens baseline.
