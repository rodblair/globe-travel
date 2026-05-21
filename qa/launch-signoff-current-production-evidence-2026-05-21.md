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

Commit `43ae6627da1211bd7f6c619b143575eccae0363b` deployed to Vercel production.

- Production alias: `https://globe-travel-two.vercel.app`
- Deployment URL: `globe-travel-2ie04qr7z-rodney-blairs-projects.vercel.app`
- Production health: `ok`, `11/11`
- Production release gate passed `10/10`
- Production accessibility and keyboard QA: `16/16`
- Beta human review readiness: `13/13`
- Beta human review intake: `4/4`
- Beta human review intake artifact: `qa/beta-human-review-intake-2026-05-21.json`
- Paid-path readiness: `6/6`
- Paid-path readiness artifact: `qa/paid-path-readiness-2026-05-21.json`
- Production monitoring readiness: `9/9`
- Design-system readiness: `10/10`
- Current launch signoff gate passed `85/85`
- Public-launch status: `beta-ready-public-blocked`
- Public-launch status artifact: `qa/public-launch-status-2026-05-21.json`
- Public-launch signoff mode fails as expected until `25/25` beta reviews are completed and production visual review history reaches four distinct passing review dates.
- Beta human-review reviewer packet manifest: `qa/beta-human-review-packet-manifest-2026-05-21.json`
- Beta human-review reviewer packets: `25/25`
- Beta human-review progress artifact: `qa/beta-human-review-progress-2026-05-21.json`
- Beta human-review progress status: intake passed `6/6`; public-progress mode fails as expected until completed beta reviews reach `25/25` and completed-review matrix coverage is present.
- Beta human-review submission directory: `qa/beta-human-review-submissions-2026-05-21`
- Beta human-review intake status: dry-run intake passed `4/4`; no completed submission files are currently imported.
- Production visual QA: `20/20`
- Production visual artifact: `qa/visual-baseline-production-release-2026-05-21-43ae662/`
- Production visual review schedule: `3/3`, covering the remaining planned public-launch visual-review dates for 2026-05-28, 2026-06-04, and 2026-06-11.
- Production visual review intake: `4/4`
- Production visual review intake artifact: `qa/production-visual-review-intake-2026-05-21.json`
- Production accessibility artifact: `qa/accessibility-keyboard-production-guest-2026-05-21/`
- Production monitoring artifact: `qa/production-monitoring-readiness-2026-05-21.md`
- Design-system artifact: `qa/design-system-readiness-2026-05-21.json`
- Athens public share/map integrity: `5/5`, with 5 itinerary days, mapped stops, usable routes, share metadata, and share-card image.
- Public share viral loop: `5/5`
- Prompt suite with production actuals: `60/60`
- Current-commit launch signoff evidence requirement: enabled
