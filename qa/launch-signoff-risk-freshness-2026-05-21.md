# Launch Signoff Risk And Freshness Gate

Date: 2026-05-21

## Scope

Harden launch signoff so it cannot pass forever on old evidence and so the no-open-P0/P1 launch rule has a machine-readable source of truth.

## Change

- Added `qa/launch-risk-register.json`.
- Added freshness checks to `npm run qa:launch-signoff` for:
  - full local release-candidate evidence
  - responsive visual QA evidence
  - launch risk register review date
- Added `QA_LAUNCH_MAX_EVIDENCE_AGE_DAYS`, defaulting to `14`.
- Added a launch risk register check that fails if any `P0` or `P1` issue is not `closed`.
- Kept `QA_LAUNCH_RISK_REGISTER` configurable for release rehearsals and negative checks.

## Current Risk Register

- Open P0: `0`
- Open P1: `0`
- Open P2: `2`

The open P2 items are tracked with owner, target month, and accepted-risk notes:

- `GT-P2-001`: beta representative trip coverage expansion.
- `GT-P2-002`: mature visual artifact human-review cadence.

## Verification

```bash
node --check scripts/platform-launch-signoff.mjs
npm run qa:launch-signoff
node -e "JSON.parse(require('fs').readFileSync('../qa/launch-risk-register.json','utf8')); console.log('risk register json ok')"
npm run lint
npm run build
git diff --check
```

Results:

- Launch signoff: `20/20`
- Full local release-candidate evidence freshness: pass, `2026-05-21`
- Responsive visual QA evidence freshness: pass, `2026-05-21`
- Launch risk register freshness: pass, `2026-05-21`
- No open P0/P1: pass
- Lint: pass
- Build: pass
- Diff whitespace check: pass

## Negative Check

A temporary risk register with one open `P1` issue was passed through `QA_LAUNCH_RISK_REGISTER=<tempfile> npm run qa:launch-signoff`.

Result: the command exited nonzero and reported `launch risk register has no open P0/P1 issues` with issue `TEST-P1`, proving the signoff blocks open launch blockers instead of merely reporting them.

## Postdeploy Verification

Commit `03878b2` deployed to Vercel production as:

- Deployment URL: `globe-travel-gwz0tne7n-rodney-blairs-projects.vercel.app`
- Production health: `ok`, `11/11`
- Exact-commit launch signoff: `21/21`

Postdeploy command:

```bash
QA_LAUNCH_EXPECTED_COMMIT=03878b26f6227eba21cd7b8015a484e4af613aed npm run qa:launch-signoff
```
