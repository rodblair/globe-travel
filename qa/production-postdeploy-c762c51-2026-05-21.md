# Production Post-Deploy Verification

Date: 2026-05-21
Commit: `c762c51`
Deployment: `https://globe-travel-h5nwsq0zy-rodney-blairs-projects.vercel.app`
Alias: `https://globe-travel-two.vercel.app`
Status: Passed

## Deployment Health

Live health reported:

- Environment: `production`
- Commit: `c762c51011143f64c21bc192a876fd2477365d17`
- Operational checks: `11/11`
- Critical missing: `0`
- Warning missing: `0`

## Full Production Gate

Command:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-postdeploy-c762c51-2026-05-21 npm run qa:release-production
```

Result:

- Passed `10/10`.
- Production ops passed `3/3`.
- Production smoke passed `8/8`.
- Production Trip Studio recovery UI passed `1/1`.
- Production auth and guest access passed `13/13`.
- Production commercial checks passed `4/4`.
- Production share integrity passed `5/5`.
- Production public share viral loop passed `5/5`.
- Production public visual gate passed `20/20`.
- Production prompt actual export returned `athens-5-day-couples-rest`.
- Prompt suite with production actuals passed `56/56`.

## Athens Itinerary Map Integrity

The stable Athens public itinerary `/t/x3m2c8cnws` passed all five public-share integrity checks:

- Public trip API returned `5 Days in Athens Greece in mid september`.
- All five days had mapped stops and usable routes.
- Every mapped stop country was `Greece`.
- No duplicate mapped stops were reported.
- Public feedback, metadata, and share-card image rendered successfully.

## Visual Artifact

Artifact:

- `qa/visual-baseline-production-postdeploy-c762c51-2026-05-21/`

Routes captured at phone, tablet, laptop, desktop, and wide viewports:

- Landing
- Login
- Signup
- Public share
