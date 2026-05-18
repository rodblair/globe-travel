# Auth And Guest Access QA

Date: 2026-05-18
Local command: `npm run qa:auth-access`
Production command: `QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:auth-access`

## Scope

This pass verifies first-time and logged-out access behavior from a browser perspective:

- logged-out login page offers guest access
- logged-out signup page offers guest access
- logged-out public share remains readable
- logged-out saved trips resolves without app error or overflow
- logged-out billing/pricing resolves without app error or overflow
- guest start creates a guest browser session and opens the planner
- guest can open saved trips and account surfaces
- local guest session can read the owned trip list API
- local disposable guest account cleanup succeeds
- production guest API mutation is skipped unless explicitly enabled

## Results

Local result: passed `11/11`.

- Guest id: `416c1326-47a1-46fe-915e-69ec249ed2d8`
- Guest trip-list API returned `200` with an array.
- Cleanup deleted the disposable guest profile and auth user.

Production result: passed `10/10`.

- Base URL: `https://globe-travel-two.vercel.app`
- Guest start opened `/chat` with a guest cookie.
- Production guest API mutation was skipped by default. It can be enabled only with `QA_ALLOW_REMOTE_GUEST_MUTATION=1`.

In-app Browser sanity:

- Production `/login` rendered `Welcome back` and `Continue as guest` with no app error or horizontal overflow.
- Production `/signup` rendered `Create your account` and `Continue as guest` with no app error or horizontal overflow.
- Production `/t/x3m2c8cnws` rendered `Start your own trip` plus feedback content after client data settled, with no app error or horizontal overflow.

## Release Impact

This closes the focused auth/guest access matrix gap for the current release-readiness sprint. It complements the broader `qa:smoke` and `qa:commercial` gates by using real browser navigation and a guest session rather than fetch-only route checks.

Follow-up hardening from this run: `npm run qa:smoke` now retries transient fetch failures and records failed route entries in `results`, so the release-candidate gate produces actionable route evidence if the local app is briefly busy after build.
