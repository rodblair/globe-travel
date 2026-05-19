# Trip Studio Guest Owner Auth Precedence

Date: 2026-05-19
Surface: Trip Studio owner identity and guest access
Route: `/trips/571b2728-3a8c-4391-9ef9-883fef1c0764`
Disposable guest owner: `4fc1f2b9-fb41-4325-be21-cc553e9f279e`
Disposable share slug: `ljf0e064qg`
Run id: `bbe9bebd`

## Finding

Browser QA found a guest-owned Trip Studio route could render as read-only when a guest cookie existed in a browser that also had prior auth state. The sidebar showed the guest identity, but owner actions could fall back to `View only` / `Shared preview`, which makes the organizer workspace feel broken and untrustworthy.

## Fix

- Server `requireUser()` now resolves the guest cookie before Supabase auth, matching the client `AuthProvider` identity model.
- `/api/chat` now uses the guest identity first when a guest cookie exists.
- Successful password login, signup with an immediate session, OAuth start, and auth callback clear the guest cookie so a real account session does not remain trapped behind stale guest identity.
- `npm run qa:auth-access` now includes a regression assertion that guest identity wins consistently until account auth succeeds.

## Browser Retest

The in-app Browser opened:

`/api/guest/start?id=4fc1f2b9-fb41-4325-be21-cc553e9f279e&next=/trips/571b2728-3a8c-4391-9ef9-883fef1c0764`

Verified visible owner state:

- Sidebar showed `Guest Traveler` / `@guest-4fc1f2b9`.
- Trip Studio showed `Save trip`, `Planner chat`, `Optimize day`, `Build maps`, `Share with friends`, and `View share`.
- Itinerary item controls showed editable owner actions including `Swap`, edit, delete, and move controls.
- `View only` and `Shared preview` were absent.
- Browser console errors: none.
- Horizontal overflow: none.

## Automated Evidence

`npm run qa:auth-access`

- Result: passed `15/15`.
- New regression: `guest identity wins consistently until account auth succeeds`.

`npm run qa:studio-actions`

- Result: passed `23/23`.
- Verified disposable guest-owned Trip Studio creation, item mutation, swaps, map build, reorder, move, delete, optimize, save, public share, and cleanup.

`npm run lint`

- Result: passed.

`npm run build`

- Result: passed.

`git diff --check`

- Result: passed.

Cleanup:

`QA_CLEANUP_TRIP_ID=571b2728-3a8c-4391-9ef9-883fef1c0764 QA_CLEANUP_RUN_ID=bbe9bebd QA_CLEANUP_GUEST_ID=4fc1f2b9-fb41-4325-be21-cc553e9f279e npm run qa:studio-actions`

- Result: cleanup passed.
- Deleted disposable trip, QA places, guest profile, and guest auth user.
