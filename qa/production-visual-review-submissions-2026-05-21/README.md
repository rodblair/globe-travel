# Production Visual Review Submissions

Drop completed visual-review JSON files in this directory after a scheduled production visual review is actually run and reviewed.

Each `.template.json` file is prefilled from a scheduled public-launch visual-review entry. Copy or rename the relevant template to a non-template `.json` file only after the review is complete, replace production deployment placeholders, and keep `blockingFindings` empty only when the review found no blockers.

Use `npm run qa:visual-review-intake` from `client/` to validate files without changing the canonical visual-review register. Use `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake` only after the report is clean and the review is ready to count toward public-launch visual-review history.

Template files ending in `.template.json` are ignored by the intake command.
