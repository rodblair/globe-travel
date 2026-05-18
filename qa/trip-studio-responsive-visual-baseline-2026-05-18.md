# Trip Studio Responsive Visual Baseline

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Browser profile: signed-in local profile `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`
Disposable fixture: `6cede65c-df12-4d7d-9067-f49cc7537645`
Share slug: `qaf10c1049`
Run id: `f10c1049`

## Purpose

Create the first responsive visual QA baseline for Trip Studio owner action surfaces after the action-audit fixes. This pass covers the top action rail and itinerary action controls at phone, tablet, and desktop widths.

## Screenshot Status

Browser screenshot capture was attempted, but `Page.captureScreenshot` timed out on the Trip Studio page. This matches the earlier Month 1 route-sweep limitation. The baseline below therefore records Browser-derived viewport, geometry, control visibility, touch-target, and overflow evidence. Screenshot artifact capture remains a follow-up item for the visual-regression track.

## Viewports Checked

| Viewport | Size | Horizontal Overflow | Top Actions | Itinerary Actions |
|---|---:|---|---|---|
| Phone | `390 x 844` | No | Visible, no overlaps | Visible after page scroll |
| Tablet | `768 x 1024` | No | Visible, no overlaps | Visible after page scroll |
| Desktop | `1280 x 800` | No | Visible, no overlaps | Visible after itinerary-pane scroll |

## Phone Baseline

Top action rail:

- `Save trip`, `Planner chat`, `Optimize day`, `Build maps`, and `Share with friends` were all visible.
- Every checked top action had a `44px` height or larger.
- No top-action overlaps.
- `documentElement.scrollWidth` matched `clientWidth` at `390px`.

Itinerary controls after scrolling:

- `Rewrite this day` visible at `298 x 44`.
- `Move QA Browser Acropolis Museum f10c1049 later` visible at `44 x 44`.
- `Move QA Browser Plaka Cafe f10c1049 earlier` visible at `44 x 44`.
- `Swap QA Browser Plaka Cafe f10c1049` visible at `71 x 44`.
- `Delete QA Browser Plaka Cafe f10c1049` visible at `44 x 44`.
- No horizontal overflow.

## Tablet Baseline

Top action rail:

- All five owner top actions were visible.
- Every checked top action met the `44px` touch-target height.
- No top-action overlaps.
- `documentElement.scrollWidth` matched `clientWidth` at `768px`.

Itinerary controls after scrolling:

- `Rewrite this day` visible at `137 x 44`.
- Move, swap, and delete controls visible with `44px` or larger heights.
- No horizontal overflow.

## Desktop Baseline

Top action rail:

- All five owner top actions were visible within the first viewport.
- Every checked top action met the `44px` touch-target height.
- No top-action overlaps.
- `documentElement.scrollWidth` matched `clientWidth` at `1280px`.

Itinerary controls:

- The desktop page shell is fixed-height at `xl`, so the body does not scroll. The itinerary pane itself is the correct scroll surface.
- After scrolling the itinerary pane, the itinerary action controls became visible:
  - `Rewrite this day` visible at `137 x 44`.
  - `Move QA Browser Acropolis Museum f10c1049 later` visible at `44 x 44`.
  - `Move QA Browser Plaka Cafe f10c1049 earlier` visible at `44 x 44`.
  - `Swap QA Browser Plaka Cafe f10c1049` visible at `71 x 44`.
- No horizontal overflow.

## Findings

- Pass: Top action rail is responsive across phone, tablet, and desktop.
- Pass: Core itinerary item actions meet touch-target sizing across checked widths.
- Pass: No horizontal overflow across checked widths.
- Pass: Desktop Trip Studio requires scrolling the itinerary pane, not the body; controls are reachable through the intended pane scroll surface.
- Follow-up: Screenshot capture needs a more reliable capture path for visual-regression artifacts because in-app Browser screenshot capture timed out on this Mapbox-heavy page.

## Cleanup

```bash
QA_CLEANUP_TRIP_ID=6cede65c-df12-4d7d-9067-f49cc7537645 QA_CLEANUP_RUN_ID=f10c1049 npm run qa:studio-browser-fixture
```

Result: fixture and seeded places were cleaned up successfully.
