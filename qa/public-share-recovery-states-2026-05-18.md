# Public Share Recovery States

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Stable share slug: `x3m2c8cnws`
Route: `/t/x3m2c8cnws`

## Purpose

Verify the public/viral itinerary surface for recipient-side recovery. This is the link friends see without signing in, so feedback failure, itinerary integrity, metadata, and mobile layout need launch-grade evidence.

## Fixes Covered

- Public feedback submission now catches thrown/network failures and always clears the submitting state.
- Public feedback has a deterministic local QA failure flag: `?qaFeedbackFailure=1`.
- Invalid feedback copy is friendlier: users are told to add a name and at least 8 characters.
- The feedback form now shows readiness guidance and comment count.
- If the feedback list fails to load, the itinerary remains available and a `Retry feedback` recovery action appears.

## Automated Recovery Gate

Command:

```bash
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recovery
```

Result:

```json
{
  "checked": 3,
  "passed": 3,
  "failed": 0
}
```

Verified:

- Public share recipient surface visible.
- Forced feedback failure recovery visible.
- No mobile horizontal overflow at `390px`.

## Existing Share Gates

Command:

```bash
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
```

Result: `4/4` passed.

Covered:

- Public trip API returns the Athens five-day itinerary.
- All five itinerary days have mapped Greece stops and usable routes.
- Public feedback API returns an array.
- Public page emits share metadata.

Command:

```bash
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback
```

Result: `5/5` passed.

Covered:

- Feedback API readable before submission.
- Invalid payload rejected safely.
- Valid friend reaction accepted.
- Submitted feedback appears in public readback.
- Inserted QA feedback cleaned up.

## Focused Visual Gate

Command:

```bash
QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_RUN_ID=public-share-recovery QA_VISUAL_ROUTES=public-share QA_VISUAL_PROGRESS=1 QA_VISUAL_SETTLE_MS=1500 npm run qa:visual
```

Result:

- Checked: `5`
- Passed: `5`
- Failed: `0`
- Artifact: `qa/visual-baseline-2026-05-18-public-share-recovery/README.md`

## Browser Evidence

The in-app Browser loaded `/t/x3m2c8cnws?qaFeedbackFailure=1` and verified:

- Page title: `5 Days in Athens Greece in mid september | Globe.travel`
- `Start your own trip` visible.
- `Add your reaction` visible.
- `Friend feedback` visible.
- Feedback readiness guidance visible.
- No horizontal overflow.
