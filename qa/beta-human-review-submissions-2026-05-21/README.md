# Beta Human Review Submissions

Drop completed review JSON files in this directory after reviewers finish their assigned packets.

Each `.template.json` file is prefilled with the assigned review id, prompt, source actual, device, viewport, and start URL. Copy or rename the relevant template to a non-template `.json` file, fill every blank field, replace null scorecard ratings with 1-5 integers, and keep `findings` empty only when the reviewer found no issues.

Use `npm run qa:beta-review-intake` from `client/` to validate files without changing the canonical register. Use `QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake` only after the report is clean and the submissions are ready to count toward public-launch review completion.

Template files ending in `.template.json` are ignored by the intake command.
