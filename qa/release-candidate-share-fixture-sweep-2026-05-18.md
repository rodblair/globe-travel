# Release Candidate Share Fixture Sweep

Date: 2026-05-18
Surface: release-candidate gate, public share maps, planner prompt actuals
Goal slice: Month 2 planner/map trust and release operations

## Purpose

Turn the ten-itinerary public share/map-trust sweep from a manual evidence sequence into a repeatable QA command and release-candidate task.

This closes a release-process gap: before this pass, `qa:share` could validate a single stable share slug and the prompt suite could validate exported actuals, but the multi-destination fixture sequence had to be run by hand. The new gate creates disposable public share fixtures, validates every share, exports prompt-suite actuals, runs the prompt suite against those actuals, and cleans up the fixture set.

## Implementation

Added:

```bash
npm run qa:share-fixture-sweep
```

The script:

- Requires `QA_OWNER_USER_ID`.
- Creates the ten deterministic public itinerary fixtures through `qa:share-fixtures`.
- Runs `qa:share` across all fixture share slugs.
- Exports prompt actuals with the fixture `promptSuiteShareMap`.
- Runs `qa:prompt-suite` against those actuals.
- Cleans up created trips and QA places in a `finally` block.
- Blocks remote mutation unless `QA_ALLOW_REMOTE_MUTATION=1` is set.

Release-candidate integration:

- `npm run qa:release-candidate` now includes the public share fixture sweep when `QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=1`.
- It also auto-includes the sweep on local release-candidate runs when `QA_OWNER_USER_ID` is present, unless `QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=0`.
- The release-candidate report now records whether the public share fixture sweep was included.

## Standalone Verification

```bash
QA_OWNER_USER_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea npm run qa:share-fixture-sweep
```

Result: passed `5/5` tasks.

Key output:

- Fixture count: `10`
- Public share smoke: `50/50`
- Prompt actuals exported: `10`
- Prompt suite with fixture actuals: `52/52`, `actualsChecked: 10`
- Cleanup: deleted `10` trips and `62` QA places

## Release-Candidate Verification

```bash
QA_OWNER_USER_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea \
QA_RELEASE_ARTIFACT_NAME=release-candidate-share-fixture-sweep-2026-05-18 \
QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=1 \
QA_RELEASE_INCLUDE_VISUAL=0 \
QA_RELEASE_INCLUDE_STUDIO=0 \
QA_RELEASE_INCLUDE_SLOW_NETWORK=0 \
QA_RELEASE_INCLUDE_SHARE_FEEDBACK=0 \
QA_RELEASE_INCLUDE_OWNER_FEEDBACK=0 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
npm run qa:release-candidate
```

Result: passed `13/13`.

The focused release-candidate run included:

- Lint
- Build
- Ops readiness
- Route smoke
- Auth and guest access smoke
- Commercial smoke
- Accessibility and keyboard smoke
- Public share/social preview smoke
- Public share recovery smoke
- Public share fixture sweep
- Planner handoff smoke
- Billing recovery smoke
- Stripe test-mode readiness

Public share fixture sweep inside release-candidate:

- Passed `5/5`
- Created and checked `10` public fixtures
- `qa:share` passed `50/50`
- Prompt suite passed `52/52` with `actualsChecked: 10`
- Cleanup deleted `10` trips and `62` QA places

Durable artifact:

```text
qa/release-candidate-share-fixture-sweep-2026-05-18/
```

## Browser Verification

In-app Browser opened:

```text
https://globe-travel-two.vercel.app/t/x3m2c8cnws
```

Result:

- Title rendered: `5 Days in Athens Greece in mid september | Globe.travel`
- Specific repaired stops were visible:
  - `Acropolis of Athens`
  - `Strofi`
  - `Monastiraki Square`
  - `Ancient Agora of Athens`
- Start-your-own-trip CTA rendered.
- Map elements were present.
- Horizontal overflow was `0`.

## Remaining Risk

This gate covers deterministic multi-destination public fixtures and prompt-suite actuals. Month 2 should still add more naturally generated live actuals so stochastic planner output gets the same repeated map-trust pressure.
