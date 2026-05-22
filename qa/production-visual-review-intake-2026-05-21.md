# Production Visual Review Intake

Date: 2026-05-21
Register: `qa/production-visual-review-register.json`
Submission directory: `qa/production-visual-review-submissions-2026-05-21`
Status: pass

## Result

- Checked: 4
- Passed: 4
- Failed: 0
- Scheduled reviews: 3
- Review history before intake: 2
- Review history after intake: 2
- Submission files: 0
- Valid submissions: 0
- Invalid submissions: 0
- Duplicate scheduled ids: 0
- Duplicate review dates: 0
- Import requested: false
- Imported: false

## Checks

- Pass: production visual review submission directory is present
- Pass: production visual review submissions parse and match scheduled reviews
- Pass: production visual review submissions do not duplicate scheduled ids or dates
- Pass: production visual review intake import is explicit

## Invalid Submission Detail

- none

## Duplicate Detail

- none

## How To Use

- Run the scheduled production release command first so the visual artifact and screenshots exist.
- Add completed visual review JSON files to `qa/production-visual-review-submissions-2026-05-21`.
- Run `npm run qa:visual-review-intake` to validate submissions without changing the register.
- Run `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake` only after the intake report is clean and the review is ready to count.
- Re-run `npm run qa:visual-review-schedule` and `npm run qa:launch-signoff` after import.
