# Trip Studio Missing Trip Recovery QA

Date: 2026-05-21
Surface: `/trips/[tripId]`
Route tested in Browser: `http://localhost:3000/trips/571b2728-3a8c-4391-9ef9-883fef1c0764`

## Finding

Opening a missing or inaccessible Trip Studio route rendered the full owner workspace shell with a generic `Trip workspace` title, disabled owner actions, and `Create a trip to start planning.` This made a deleted, private, or wrong-session trip look like a broken editable trip instead of a recoverable unavailable state.

Severity: P1. A returning user can land here from an old URL or stale saved state and lose confidence in saved trips, ownership, and recovery.

## Fix

- Added a dedicated Trip Studio recovery state for failed trip loads.
- The recovery state explains that the trip could not be opened and gives two clear next actions: `Go to saved trips` and `Plan a new trip`.
- Removed the empty owner workspace from the missing-trip path.
- Prevented dependent feedback and planner-job requests from firing until the trip payload exists.
- Added a phone-width regression to `npm run qa:studio-owner-ui`.

## Browser Evidence

Browser verified the original route now shows:

- `We could not open this trip.`
- `Go to saved trips`
- `Plan a new trip`
- No `Save trip`
- No `Share with friends`
- No `Create a trip to start planning.`
- No application error
- No horizontal overflow
- One page-level `main` landmark

Screenshot: `qa/trip-studio-missing-trip-recovery-2026-05-21.png`

## Verification

- `npm run qa:studio-owner-ui` passed `7/7`, including the new missing Trip Studio route recovery check at `390x844`.
- `node --check scripts/platform-trip-studio-owner-ui-smoke.mjs` passed.
- `npm run lint` passed.
- `npm run build` passed.

