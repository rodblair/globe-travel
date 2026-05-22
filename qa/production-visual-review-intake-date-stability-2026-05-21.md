# Production Visual Review Intake Date Stability

Date: 2026-05-21

## Issue

The production visual-review intake script defaulted to the current UTC date. When an operator ran the intake after the release evidence date, the script could read or create `qa/production-visual-review-submissions-<today>` instead of the active register-backed submission directory.

## Fix

`npm run qa:visual-review-intake` now derives its default date from `qa/production-visual-review-register.json` and only falls back to the current UTC date when the register has no date. Explicit `QA_VISUAL_REVIEW_INTAKE_DATE` and `QA_VISUAL_REVIEW_SUBMISSION_DIR` overrides still work.

## Verification

```bash
npm run qa:visual-review-intake
npm run qa:visual-review-schedule
npm run qa:public-launch-status
QA_LAUNCH_EXPECTED_COMMIT=f07fbadc7fdad3c54d23123d2e0e9473609c5dc3 npm run qa:launch-signoff
npm run lint
npm run build
```

Results:

- Visual review intake: `4/4`
- Intake submission directory: `qa/production-visual-review-submissions-2026-05-21`
- Visual review schedule: `3/3`
- Public launch status: `beta-ready-public-blocked`, with no guardrail issues
- Launch signoff: `90/90`
- Lint: passed
- Build: passed

## Remaining Blockers

This does not complete public launch. It hardens the review intake path so future completed visual reviews count against the correct release evidence set. Public launch still requires 25 completed beta human reviews and four distinct passing production visual-review history dates.
