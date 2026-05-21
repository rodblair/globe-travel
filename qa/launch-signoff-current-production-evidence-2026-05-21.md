# Launch Signoff Current Production Evidence

Date: 2026-05-21

## Issue

`npm run qa:launch-signoff` verified live production health but allowed its default postdeploy evidence artifact to point at an older same-day release note. That older note contained generic Vercel, `11/11`, and `9/9` evidence, so the gate could pass without proving the postdeploy evidence belonged to the currently deployed production commit.

## Fix

- Changed the default production evidence artifact to `qa/full-release-candidate-planner-promotion-2026-05-21.md`.
- Passed the live `/api/health` response into the production-evidence check.
- Added a required `current production commit` evidence matcher so the production evidence must contain either `QA_LAUNCH_EXPECTED_COMMIT` or the commit reported by live production health.
- Kept support for generated production logs and the current markdown evidence wording.

## Verification

Positive signoff:

```bash
npm run qa:launch-signoff
```

Result: `32/32` passed.

- Production health: `ok`, `11/11`
- Production deployment commit required in evidence: `c2933cd0211cb12c05bcb09096298b505faa926e`
- Production evidence artifact: `qa/full-release-candidate-planner-promotion-2026-05-21.md`
- Missing production evidence: `[]`

Stale-evidence negative test:

```bash
QA_LAUNCH_PRODUCTION_EVIDENCE=qa/release-candidate-share-multi-integration-2026-05-21/README.md npm run qa:launch-signoff
```

Result: exited `1` as expected.

- Failed check: `postdeploy production release evidence is present`
- Missing evidence: `current production commit`
- Expected evidence commit: `c2933cd0211cb12c05bcb09096298b505faa926e`

Production public-share viral Browser smoke:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral
```

Result: `5/5` passed.

- Phone and desktop public-share viral affordances visible
- Copy-link feedback visible
- Native share payload trip-specific
- Remote guest-start mutation skipped safely
- No app error or horizontal overflow

## Result

Launch signoff now proves that postdeploy production evidence is tied to the exact production commit under test, instead of accepting a fresh but unrelated same-day deployment note.

## Postdeploy Evidence

Commit `b634fee74687159c515b8446c94efc3536f3acdd` deployed to Vercel production.

- Production alias: `https://globe-travel-two.vercel.app`
- Deployment URL: `globe-travel-rdcrwbm1r-rodney-blairs-projects.vercel.app`
- Production health: `ok`, `11/11`
- Production release gate passed `10/10`
- Production accessibility and keyboard QA: `16/16`
- Beta human review readiness: `12/12`
- Production monitoring readiness: `9/9`
- Design-system readiness: `10/10`
- Current launch signoff gate passed `66/66`
- Production visual QA: `20/20`
- Production visual artifact: `qa/visual-baseline-production-beta-review-evidence-2026-05-21-b634fee/`
- Production accessibility artifact: `qa/accessibility-keyboard-production-guest-2026-05-21/`
- Production monitoring artifact: `qa/production-monitoring-readiness-2026-05-21.md`
- Design-system artifact: `qa/design-system-readiness-2026-05-21.json`
- Athens public share/map integrity: `5/5`, with 5 itinerary days, mapped stops, usable routes, share metadata, and share-card image.
- Public share viral loop: `5/5`
- Prompt suite with production actuals: `60/60`
- Current-commit launch signoff evidence requirement: enabled
