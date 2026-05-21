# Production Visual Review Submissions

Drop completed visual-review JSON files in this directory after a scheduled production visual review is actually run and reviewed.

Use `npm run qa:visual-review-intake` from `client/` to validate files without changing the canonical visual-review register. Use `QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake` only after the report is clean and the review is ready to count toward public-launch visual-review history.

Template files ending in `.template.json` are ignored by the intake command.
