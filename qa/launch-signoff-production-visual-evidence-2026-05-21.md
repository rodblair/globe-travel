# Launch Signoff Production Visual Evidence

Date: 2026-05-21

## Issue

The scheduled production release workflow runs `npm run qa:release-production` with production visual QA enabled by default, but launch signoff still recognized older non-visual `9/9` production evidence. A visual-enabled production release produced `10/10` plus production visual QA `20/20`, and the generated log did not expose the deployment commit, so `npm run qa:launch-signoff` could reject the workflow-style evidence even after a healthy production run.

## Fix

- `npm run qa:ops` now includes deployment `commit`, `url`, and `region` in the production metadata result.
- `npm run qa:launch-signoff` now requires visual-inclusive production evidence: production release gate `10/10`, production visual QA `20/20`, production health `11/11`, and the current production commit.
- The current postdeploy evidence note records the visual-enabled production release gate and visual artifact.

## Verification

Full production release gate with visual QA after deploy:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-rollback-current-2026-05-21-969d252 \
npm run qa:release-production
```

Result: `10/10` passed.

- Production commit: `969d252249505e3ba99554cf2b749705f06168fa`
- Production deployment URL: `globe-travel-73le5w4y6-rodney-blairs-projects.vercel.app`
- Production ops: `3/3`
- Production route smoke: `8/8`
- Production Trip Studio recovery UI: `1/1`
- Production auth and guest access: `13/13`
- Production commercial: `4/4`
- Athens public share/map integrity: `5/5`
- Public share viral loop: `5/5`
- Production visual QA: `20/20`
- Prompt suite with production actuals: `56/56`

Workflow-style log-driven launch signoff:

```bash
QA_LAUNCH_PRODUCTION_EVIDENCE=/tmp/globe-production-release-visual-969d252.log npm run qa:launch-signoff
```

Result: `33/33` passed.

- Required production evidence: Vercel production deploy, production health `11/11`, visual-inclusive production release gate `10/10`, production visual QA `20/20`, current production commit.
- Expected production commit: `969d252249505e3ba99554cf2b749705f06168fa`
- Missing production evidence: `[]`

Markdown evidence launch signoff:

```bash
QA_LAUNCH_EXPECTED_COMMIT=969d252249505e3ba99554cf2b749705f06168fa npm run qa:launch-signoff
```

Result: `34/34` passed.

## Result

Launch signoff now aligns with the scheduled production release workflow's default visual-enabled gate instead of accepting non-visual release evidence as the launch-ready path.
