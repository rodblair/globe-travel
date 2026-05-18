# Slow-Network Recovery QA

Date: 2026-05-18
Surface: slow but successful network paths across planner, Trip Studio, public share, and billing

## Scope

This pass adds a repeatable Browser-backed slow-network gate for launch-critical surfaces. The goal is to verify that the app stays legible and recovers when APIs are delayed rather than failed.

New command:

```bash
npm run qa:slow-network
```

The gate runs only against localhost because it creates disposable guest and trip state.

## Coverage

`npm run qa:slow-network` verifies:

- Trip Studio slow initial itinerary load shows `Loading your itinerary.`, avoids overflow, and recovers to owner controls.
- Public share delayed feedback API still leaves the recipient with the itinerary, feedback form, and `Start your own trip` CTA.
- Account billing delayed subscription API still leaves `Plan and billing` actionable without overflow.
- Planner delayed trip creation shows `Opening Trip Studio...`, reaches Trip Studio, and cleans up the draft.
- Disposable fixture cleanup deletes the Trip Studio fixture, QA places, guest profile, and guest auth user.

## Standalone Evidence

Command:

```bash
npm run qa:slow-network
```

Result: passed `7/7`.

Key nested checks:

- Trip Studio slow itinerary load: passed.
- Public share slow feedback: passed.
- Account billing slow subscription state: passed.
- Planner slow draft creation: passed.
- Planner draft cleanup: passed.
- Fixture cleanup: passed.

## Release-Candidate Evidence

Command:

```bash
QA_RELEASE_ARTIFACT_NAME=release-candidate-slow-network-2026-05-18 \
QA_RELEASE_INCLUDE_VISUAL=0 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
npm run qa:release-candidate
```

Result: passed `18/18`.

The integrated `slow-network recovery smoke on kept fixture` task passed `5/5` while reusing the release-candidate Trip Studio fixture before final cleanup.

Artifacts:

- `qa/release-candidate-slow-network-2026-05-18/README.md`
- `qa/release-candidate-slow-network-2026-05-18/summary.json`

## Release Impact

This closes the slow-network recovery follow-up for the current release-readiness sprint. The app now has automated evidence for slow but successful API behavior across the most important launch surfaces, not only hard failure states.
