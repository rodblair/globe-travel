# Production Regional Map-Trust Release

Date: 2026-05-20

Production URL: `https://globe-travel-two.vercel.app`

Deployment:

- Commit: `1fe9913` (`Expand regional planner map trust`)
- Vercel deployment: `dpl_4ZBBpAzit16xefLvw49qppK9tXSA`
- Deployment URL: `https://globe-travel-g9snxy9yg-rodney-blairs-projects.vercel.app`
- Status: Ready
- Aliases: `https://globe-travel-two.vercel.app`, `https://globe-travel-rodney-blairs-projects.vercel.app`, `https://globe-travel-git-main-rodney-blairs-projects.vercel.app`

## Scope

This release ships the Phase 1 regional planner/map-trust expansion after local generated-actual testing found and fixed real itinerary-map risks:

- Missing regional destination anchors.
- Weak or unmapped regional geocoding.
- Wrong-country Cape Town-style geocoding risk.
- Duplicate Istanbul pin reuse for distinct itinerary stops.
- Need for shared canonical regional place pins between planner generation and Trip Studio map hydration.

## Local Pre-Release Gates

- `npm run qa:prompt-suite`: `56/56`
- `npm run qa:geocode-quality`: `38/38`
- `npm run lint`: passed
- `npm run build`: passed
- Focused Istanbul generated-actual rerun: `3/3`
- `npm run qa:planner-actuals:regional-edge`: `6/6`
- `QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json npm run qa:prompt-suite`: `56/56`, `actualsChecked: 4`

## Browser Evidence

The in-app Browser spot-checked local `http://localhost:3000/t/x3m2c8cnws` after the regional planner/map-trust fixes:

- Page title remained `5 Days in Athens Greece in mid september | Globe.travel`.
- Athens public share content, feedback/reaction area, and `Start your own trip` CTA were visible.
- No application error was visible.
- Horizontal overflow was `0`.

## Production Release Gate

Command:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-regional-map-trust-2026-05-20-1fe9913 \
npm run qa:release-production
```

Result: `9/9` top-level production checks passed.

Passed checks:

- Production ops: `3/3`
- Production smoke: `8/8`
- Production auth and guest access: `14/14`
- Production commercial fail-safe checks: `4/4`
- Production public share: `5/5`
- Production public share viral loop: `5/5`
- Production public visual gate: `20/20`
- Production prompt actuals export: exported `athens-5-day-couples-rest`
- Prompt suite with production actuals: `56/56`, `actualsChecked: 1`

## Production Visual Artifact

- Artifact directory: `qa/visual-baseline-production-regional-map-trust-2026-05-20-1fe9913/`
- Routes checked: landing, login, signup, public share
- Viewports checked: phone `390`, tablet `768`, laptop `1280`, desktop `1440`, wide `1728`
- Visual result: `20/20`
- Pixel-compared stable shell routes: landing, login, signup
- Public share received screenshot, marker, overflow, touch-target, clipped-text, and overlap checks.

## Release Decision

Green. The regional map-trust expansion is live in production and the non-mutating production release gate passed after deploy.

The active multi-month platform completion goal remains open. The next tranche should continue regional map-trust expansion by promoting Seoul and Cape Town after dedicated trusted-place guidance and canonical pins are added for compact Seoul districts and Cape Town day-trip routing.
