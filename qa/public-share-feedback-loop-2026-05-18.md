# Public Share Feedback Loop QA

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Browser profile used for fixture ownership: `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`

## Purpose

Harden the viral/public-share loop by proving that a friend can react to a shared itinerary, invalid feedback fails safely, valid feedback appears in public readback, and inserted QA feedback can be cleaned up.

## Added Tooling

```bash
npm run qa:share-feedback
```

Required:

```bash
QA_SHARE_SLUG=<public-share-slug> npm run qa:share-feedback
```

Optional Browser-inspection mode:

```bash
QA_SHARE_SLUG=<public-share-slug> QA_KEEP_FEEDBACK=1 npm run qa:share-feedback
```

Cleanup mode:

```bash
QA_CLEANUP_FEEDBACK_ID=<feedback-id> npm run qa:share-feedback
```

The runner verifies:

- Public feedback API is readable.
- Invalid feedback returns `400` with `Invalid feedback`.
- Valid feedback returns `201`.
- Submitted feedback appears in public readback.
- Inserted feedback is deleted unless `QA_KEEP_FEEDBACK=1`.

## Stable Athens Share Gate

Command:

```bash
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback
```

Result: passed `5/5`.

Inserted temporary feedback:

- `ce64495c-6513-4b1d-8cc6-b959245ec2ac`
- Author: `QA Friend 6da5b62c`
- Sentiment: `practical`

Cleanup: deleted successfully by the script.

## Disposable Public Share Fixture Gate

Created fixture run: `713d52c8`

Generated slugs:

- `qa713d52c81` — Lisbon, 3 days
- `qa713d52c82` — Kyoto, 4 days
- `qa713d52c83` — Mexico City, 2 days

Integrity command:

```bash
QA_SHARE_SLUGS=qa713d52c81,qa713d52c82,qa713d52c83 npm run qa:share
```

Result: passed `12/12`.

Feedback command:

```bash
QA_SHARE_SLUG=qa713d52c81 npm run qa:share-feedback
```

Result: passed `5/5`.

Inserted temporary feedback:

- `7cc78dd0-28ac-4898-87bf-23b987b91bb6`
- Author: `QA Friend 45a1fcaa`
- Sentiment: `practical`

Cleanup: deleted successfully by the script.

## Browser Public Readback

Browser-inspection command:

```bash
QA_SHARE_SLUG=qa713d52c81 QA_KEEP_FEEDBACK=1 npm run qa:share-feedback
```

Result: passed `5/5` and kept feedback `f24c0de3-e170-4910-adcb-fbead43c35ef` for Browser verification.

Browser URL:

```text
http://localhost:3000/t/qa713d52c81
```

Viewport:

- `390 x 844`

Browser verified:

- `1 reaction` appeared.
- `QA Friend f86172e7` appeared.
- `QA feedback f86172e7: Day 2 looks strong, but please leave a slower cafe break before dinner.` appeared.
- Feedback fields remained present and touch-sized:
  - `Your name` at `316 x 46`
  - `Email optional` at `316 x 46`
  - `Trip feedback` at `316 x 140`
- `Start your own trip`, `Copy link`, and `Share` remained visible later in the page content.
- No horizontal overflow appeared.

Cleanup:

```bash
QA_CLEANUP_FEEDBACK_ID=f24c0de3-e170-4910-adcb-fbead43c35ef npm run qa:share-feedback
QA_CLEANUP_TRIP_IDS=0bece763-b317-4004-9bb4-c7117de2f995,2fc75855-9aca-43f1-9a55-4fea9b430803,91c41d11-b82b-43be-aa6d-f49211bf67b1 QA_CLEANUP_RUN_ID=713d52c8 npm run qa:share-fixtures
```

Result:

- Feedback row deleted successfully.
- 3 fixture trips deleted.
- 21 fixture places deleted.

## Findings

- Pass: Public feedback validation fails safely.
- Pass: Valid friend feedback submits and is readable through the public API.
- Pass: Public share page renders submitted feedback for a mobile recipient.
- Pass: QA feedback cleanup is repeatable.
- Follow-up: add an owner-side Browser check that Trip Studio readiness and workflow panels update after public feedback arrives.
