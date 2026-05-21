# Production Postdeploy Visual And Browser Gate

Date: 2026-05-21
Commit: `ec53a97b15ccb8a4e8a854b79a22d69f321a8cbc`
Production alias: `https://globe-travel-two.vercel.app`
Deployment URL: `https://globe-travel-51b9wilos-rodney-blairs-projects.vercel.app`

## Goal

Close the postdeploy evidence gap after the billing subscription-state release by rerunning the full non-mutating production release gate with public visual QA enabled, then spot-checking the live product through the in-app Browser.

## Production Health

`https://globe-travel-two.vercel.app/api/health` reported:

- Status: `ok`
- Environment: `production`
- Commit: `ec53a97b15ccb8a4e8a854b79a22d69f321a8cbc`
- Checks: `11/11` OK
- Critical missing: `0`
- Warning missing: `0`

## Full Production Gate

Command:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-postdeploy-2026-05-21-ec53a97 \
npm run qa:release-production
```

Result: `10/10` passed.

Covered:

- Production ops `3/3`
- Production route smoke `8/8`
- Production Trip Studio recovery UI `1/1`
- Production auth and guest access `13/13`
- Production commercial fail-safe checks `4/4`
- Production public share and social card `5/5`
- Production public share viral loop `5/5`
- Production public visual gate `20/20`
- Production prompt actual export for `athens-5-day-couples-rest`
- Prompt suite with production actuals `56/56`

Visual evidence:

- `qa/visual-baseline-production-postdeploy-2026-05-21-ec53a97/README.md`
- `qa/visual-baseline-production-postdeploy-2026-05-21-ec53a97/summary.json`
- `qa/visual-baseline-production-postdeploy-2026-05-21-ec53a97/screenshots/`

## In-App Browser Spot Checks

The in-app Browser checked the live production alias after the automated gate.

Stable Athens public share: `https://globe-travel-two.vercel.app/t/x3m2c8cnws`

- Page title: `5 Days in Athens Greece in mid september | Globe.travel`
- Athens itinerary text present
- Day 5 / Central Athens finale content present
- Reaction or feedback content present
- Copy/share controls present
- Start your own trip CTA present
- No application error
- No horizontal overflow
- One page-level `main` landmark

Saved returning-user surface: `https://globe-travel-two.vercel.app/saved`

- Saved itinerary surface present
- Planner CTA present
- No application error
- No horizontal overflow
- One page-level `main` landmark

Account billing surface: `https://globe-travel-two.vercel.app/account?tab=billing`

- Plan and billing surface present
- Plan comparison present
- Upgrade or billing-management path present
- No application error
- No horizontal overflow
- One page-level `main` landmark

Note: the in-app Browser screenshot path timed out while capturing the live page, so screenshot evidence for this pass comes from the Chrome-backed visual baseline artifact above.

