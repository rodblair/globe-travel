# Planner Initial Generation State QA

Date: 2026-05-18
Goal slice: Week 2 planner start-to-trip confidence and map-trust expansion

## Finding

Browser testing found a P1 first-time planner trust issue on localhost.

Route tested:

```text
/chat?q=Plan a 3 day Porto food and viewpoints trip for four friends in October. Keep it walkable and include a shareable map.
```

The handoff correctly opened Trip Studio, but the first loaded Trip Studio state briefly showed three empty days, `0 stops`, and `Ask the AI to build this day` while the initial URL prompt was still generating the real itinerary in the background.

That made a working generation look like an empty failed result.

The same Browser pass also exposed a destination extraction bug:

```text
Plan a 3 day Copenhagen design and food trip for four friends in October...
```

was titled:

```text
3 Days in Copenhagen design and
```

## Fix

- Trip Studio now treats an empty URL-prompt trip as an active initial-generation state until items arrive or chat errors.
- The itinerary panel now shows `Building the first itinerary from your trip idea.` while named stops and map context are being created.
- Empty day copy now says `Building named stops and map context...` instead of `0 stops` / `Ask the AI to build this day`.
- Empty-map panels are suppressed during this initial generation state.
- Rewrite controls are disabled while the initial itinerary is building.
- Destination cleanup now strips trailing theme words such as design, architecture, shops, and bakeries from extracted destination candidates.
- Added a prompt-suite fixture for the Copenhagen design-and-food phrasing.

## Browser Verification

Local Browser verified a fresh first-time guest flow:

```text
/signup -> Continue as guest -> /chat
```

Then verified URL-prompt handoff:

```text
/chat?q=Plan a 3 day Copenhagen design and food trip for four friends in October. Keep it walkable and include a shareable map.
```

Interim Trip Studio state:

- title: `3 Days in Copenhagen`
- bad title `Copenhagen design and`: absent
- visible progress copy: `Building the first itinerary from your trip idea.`
- visible day copy: `Building named stops and map context...`
- empty-failure copy `Ask the AI to build this day`: absent
- `0 stops`: absent
- horizontal overflow: absent
- Browser console errors: none

Final generated Trip Studio state:

- title: `3 Days in Copenhagen`
- Day 1 title: `Design classics & canals`
- Day 1 map: `7 stops`
- route summary: `3.5 km • 43 min walk`
- country labels: `Denmark`
- visible actions: Save trip, Planner chat, Optimize day, Maps built, Share with friends
- horizontal overflow: absent
- Browser console errors: none

Disposable Browser trips cleaned up:

- `6683d65e-df65-47f6-ae54-e2a427970f89`
- `83169964-c610-43aa-99ab-788e269858c5`
- `ed73e594-6884-4909-a4f8-26726b7862fd`
- `20fcc314-2304-4335-ba70-1971f50c25e5`

## Command Verification

```bash
npm run qa:planner-handoff
```

Passed `14/14`.

```bash
npm run qa:prompt-suite
```

Passed `53/53`.

```bash
npm run lint
```

Passed.

```bash
npm run build
```

Passed.

```bash
git diff --check
```

Passed.

## Remaining Risk

This pass improves the first Trip Studio generation state and a concrete destination extraction regression. It does not replace the broader Month 2 requirement for more naturally generated prompt actuals across many destinations and repeated production-like planner runs.
