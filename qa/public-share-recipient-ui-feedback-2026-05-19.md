# Public Share Recipient Feedback UI Smoke

Date: 2026-05-19
Environment: `http://localhost:3000`
Status: Passed

## What Changed

Added `npm run qa:share-recipient-ui`, a Chrome browser smoke that exercises the public share page as a logged-out friend. The gate submits real feedback through the rendered UI, verifies the reaction appears through the public API and after a desktop reload, and deletes the inserted feedback row.

The local release-candidate gate now runs this browser feedback check after the API feedback mutation smoke whenever `QA_RELEASE_INCLUDE_SHARE_FEEDBACK` is enabled.

## Coverage

- Opens `/t/x3m2c8cnws` on a phone viewport.
- Fills `Your name`, leaves optional email blank, selects `Practical note`, and writes a realistic comment.
- Verifies the form reaches the `Ready to send` state and the submit button is enabled.
- Submits the reaction and verifies `Feedback sent`, cleared comment input, no app error, and no horizontal overflow.
- Reads `/api/trips/share/x3m2c8cnws/feedback` and verifies the browser-submitted reaction is present with `practical` sentiment.
- Reloads the public share page on desktop and verifies the submitted author/comment remain visible.
- Deletes the inserted feedback row through the Supabase service role cleanup path.

## Verified Commands

- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recipient-ui` passed `5/5`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed `5/5`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recovery` passed `4/4`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral` passed `5/5`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback` passed `5/5`.
- `npm run lint` passed.
- `npm run build` passed.
- `node --check scripts/platform-share-recipient-ui-smoke.mjs` passed.
- `node --check scripts/platform-share-viral-smoke.mjs` passed.
- `node --check scripts/platform-trip-studio-actions.mjs` passed.

## Additional Hardening

- `npm run qa:share-viral` now waits for the `/chat` pathname instead of the full browser `load` event after the Start your own trip redirect. This removes a false failure where the browser had already reached Planner but the load event did not settle inside the timeout.
- `npm run qa:studio-actions` cleanup now treats already-absent guest auth users as a successful cleanup state, matching the other QA cleanup helpers.
