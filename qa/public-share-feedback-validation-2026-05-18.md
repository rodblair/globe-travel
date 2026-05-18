# Public Share Feedback Validation QA

Date: 2026-05-18
Surface: `/t/x3m2c8cnws?qaFeedbackFailure=1`
User lens: logged-out friend reviewing a shared itinerary and leaving feedback.

## Finding

The public feedback form accepted an invalid optional email in the client and only explained the problem after the API rejected the submission. That made a lightweight viral action feel like a form error instead of a quick reaction.

## Fix

- Added client-side optional email validation.
- Marked the email field invalid with `aria-invalid` when needed.
- Added clear recovery copy: `Use a valid email address or leave it blank.`
- Disabled `Send feedback` until the recipient either fixes the email or leaves it blank.
- Added `maxLength={600}` to the feedback textarea so the UI and API limit match.
- Expanded `npm run qa:share-recovery` to cover the invalid optional email state before the forced network failure recovery.

## Evidence

Local automated recovery gate:

- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recovery`
- Passed `4/4`
- New check passed: `invalid optional email is blocked before submission`

Focused public-share visual QA:

- `QA_VISUAL_ROUTES=public-share QA_VISUAL_VIEWPORTS=phone,tablet,laptop QA_VISUAL_ARTIFACT_NAME=visual-baseline-2026-05-18-public-feedback-validation npm run qa:visual`
- Passed `3/3`

Viral loop QA:

- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral`
- Passed `5/5`
- Guest-start cleanup now treats an already-absent guest auth user as successful cleanup and the script exits cleanly after printing its summary.

Supporting gates:

- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed `5/5`
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback` passed `5/5` with inserted feedback cleanup
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:a11y` passed `16/16`
- `npm run lint` passed
- `npm run build` passed
