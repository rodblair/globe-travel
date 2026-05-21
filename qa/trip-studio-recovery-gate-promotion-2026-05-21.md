# Trip Studio Recovery Gate Promotion

Date: 2026-05-21
Surface: Trip Studio unavailable-trip recovery

## Goal

Promote the missing Trip Studio route recovery from manual Browser evidence into repeatable release gates. This protects stale, deleted, private, or wrong-session trip URLs from regressing back to an empty editable workspace.

## Change

- Added `npm run qa:studio-recovery-ui`.
- Added `scripts/platform-trip-studio-recovery-ui-smoke.mjs`.
- Wired the smoke into `npm run qa:release-candidate`.
- Wired the smoke into `npm run qa:release-production`.

The smoke opens `/trips/00000000-0000-4000-8000-000000000001` in Chrome at `390x844` and verifies:

- `We could not open this trip.`
- `Go to saved trips`
- `Plan a new trip`
- No `Save trip`
- No `Share with friends`
- No `Create a trip to start planning.`
- No application error
- No horizontal overflow
- One page-level `main` landmark

## Verification

- `node --check scripts/platform-trip-studio-recovery-ui-smoke.mjs` passed.
- `node --check scripts/platform-release-candidate-smoke.mjs` passed.
- `node --check scripts/platform-production-release-smoke.mjs` passed.
- `npm run qa:studio-recovery-ui` passed locally at `1/1`.
- `QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:studio-recovery-ui` passed at `1/1`.
- In-app Browser verified the local recovery route with the recovery heading, saved-trip CTA, new-plan CTA, no owner actions, no empty-workspace copy, no app error, no horizontal overflow, and one `main`.
- `npm run lint` passed.
- `npm run build` passed.
- Focused local release-candidate gate passed `17/17`: `QA_RELEASE_ARTIFACT_NAME=release-candidate-trip-recovery-gate-2026-05-21 QA_RELEASE_INCLUDE_VISUAL=0 QA_RELEASE_INCLUDE_STUDIO=0 QA_RELEASE_INCLUDE_SHARE_FEEDBACK=0 QA_RELEASE_INCLUDE_OWNER_FEEDBACK=0 QA_RELEASE_INCLUDE_SLOW_NETWORK=0 QA_RELEASE_INCLUDE_PROMPT_SUITE=0 npm run qa:release-candidate`.
- Full production release gate passed `10/10`: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-trip-recovery-gate-2026-05-21-6ee387b npm run qa:release-production`.

## Evidence

- `qa/release-candidate-trip-recovery-gate-2026-05-21/README.md`
- `qa/release-candidate-trip-recovery-gate-2026-05-21/summary.json`
- `qa/visual-baseline-production-trip-recovery-gate-2026-05-21-6ee387b/README.md`
- `qa/visual-baseline-production-trip-recovery-gate-2026-05-21-6ee387b/summary.json`

