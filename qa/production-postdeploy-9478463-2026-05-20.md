# Production Post-Deploy Release Gate

Date: 2026-05-20
Commit: `94784636a5bb6d697ec921d5970d06f7d0836162`
Production alias: `https://globe-travel-two.vercel.app`
Deployment URL: `globe-travel-ohrtpqqjb-rodney-blairs-projects.vercel.app`
Stable public share slug: `x3m2c8cnws`

## Command

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-postdeploy-2026-05-20-9478463 \
npm run qa:release-production
```

## Result

Passed `9/9`.

| Gate | Result | Evidence |
| --- | --- | --- |
| Production ops | Pass | health endpoint ready, no-store contract, production metadata present |
| Production smoke | Pass | `8/8`; landing, auth redirects, login, signup, account/billing redirect, public share |
| Production auth and guest access | Pass | `14/14`; remote guest mutation skipped by policy |
| Production commercial | Pass | `4/4`; pricing route, checkout/portal safe 401, feedback validation safe 400 |
| Production share | Pass | `5/5`; Athens public itinerary, metadata, feedback API, share-card PNG |
| Production viral loop | Pass | `5/5`; recipient share/copy/start-own-trip affordances without remote guest mutation |
| Production visual gate | Pass | `20/20`; landing, login, signup, public share at phone/tablet/laptop/desktop/wide |
| Production prompt actuals export | Pass | exported `athens-5-day-couples-rest` |
| Prompt suite with production actuals | Pass | `56/56`; `actualsChecked: 1`; no missing coverage |

## Map And Itinerary Verification

The production Athens public share API returned `5 Days in Athens Greece in mid september` with five itinerary days.

- Day 1: 2 mapped stops, 2 unique mapped stops, Greece only, usable route.
- Day 2: 3 mapped stops, 3 unique mapped stops, Greece only, usable route.
- Day 3: 3 mapped stops, 3 unique mapped stops, Greece only, usable route.
- Day 4: 3 mapped stops, 3 unique mapped stops, Greece only, usable route.
- Day 5: 4 mapped stops, 4 unique mapped stops, Greece only, usable route.

No duplicate mapped stops or wrong-country itinerary stops were reported.

## Visual Evidence

Artifact: `qa/visual-baseline-production-postdeploy-2026-05-20-9478463/`

- Checked: `20`
- Passed: `20`
- Failed: `0`
- Pixel-compared routes: landing, login, signup
- Dynamic public share route: screenshot, marker, overflow, clipped-text, overlap, and touch-target checks
- No horizontal overflow, clipped text, overlapping controls, or small app-owned touch targets reported.

## Browser Spot Check

Codex in-app Browser checked the live production alias after the automated gate.

Routes checked:

- `/`
- `/saved`
- `/t/x3m2c8cnws`
- `/pricing`

Observed:

- No application error.
- No horizontal overflow.
- Landing page exposed primary planning CTA and current Globe.travel positioning.
- Public Athens share loaded with title `5 Days in Athens Greece in mid september | Globe.travel`.
- In the existing Browser guest/session context, `/saved` opened the returning-user app shell and `/pricing` resolved to account billing, both without layout failure.

## Release Decision

Production is green on commit `9478463` for the current non-mutating release gate. Keep the active launch-readiness goal open and continue the next platform-hardening slice.
