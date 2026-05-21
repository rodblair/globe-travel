# Beta Human Review Evidence Quality

Date: 2026-05-21

## Purpose

The invite-beta review plan already defines 25 representative review slots. This checkpoint hardens the gate so completed reviews cannot count toward public-launch approval unless the record contains usable evidence.

## Gate Changes

- `npm run qa:beta-review-readiness` now validates completed review records for reviewer role, route or share URL, viewport, device, prompt, completed date, outcome notes, map-trust notes, share-feedback outcome, complete scorecard ratings, and findings.
- `npm run qa:launch-signoff` now applies the same completed-review evidence-quality check.
- Completed review scorecard ratings must be integers from `1` to `5`.
- Completed review route/share URLs must be `http` or `https`.
- Completed review viewports must use a concrete format such as `390x844`.
- Findings must include valid severity, valid status, surface, title, and notes.

## Verification

- `npm run qa:beta-review-readiness` passed `12/12`.
- `QA_BETA_REVIEW_MIN_COMPLETED=25 npm run qa:beta-review-readiness` failed as expected with `0/25` completed reviews.
- A temporary malformed completed-review register failed as expected on `completed beta reviews include required reviewer evidence`.
- `QA_LAUNCH_EXPECTED_COMMIT=dc353ba5922ed45987a1cf27a40c7903615a60d0 npm run qa:launch-signoff` passed `66/66`.

## Remaining Risk

This does not complete the beta review program. It makes the future completion claim harder to fake: public launch still requires at least 25 completed human or representative reviews and zero unresolved P0/P1 findings.
