# Visual Layout Quality Gate

Date: 2026-05-18
Status: Passed

## What Changed

- Expanded `npm run qa:visual` beyond screenshot capture, marker checks, horizontal overflow, touch targets, and pixel diffs.
- Added app-owned clipped text detection for visible actions, links, labels, and headings.
- Added app-owned overlapping control detection for hit-test-visible controls.
- Tuned the overlap detector to ignore intentional password-field adornments while still failing real control collisions.
- Updated the mobile app shell so protected app pages reserve viewport space above the fixed bottom navigation instead of relying only on bottom padding.

## Why This Matters

This closes a practical visual QA gap: screenshots existed, but repeated overlap/clipping issues could still require manual inspection. The visual gate now fails when launch-critical surfaces expose hidden, clipped, or colliding interactive UI in the visible viewport.

## Verification

Focused layout pass:

```bash
QA_SHARE_SLUG=x3m2c8cnws \
QA_VISUAL_RUN_ID=layout-quality-gate-retuned \
QA_VISUAL_ROUTES=landing,planner,public-share,account-billing \
QA_VISUAL_VIEWPORTS=phone,laptop \
npm run qa:visual
```

Result: `8/8` passed.

Full visual matrix:

```bash
QA_SHARE_SLUG=x3m2c8cnws \
QA_VISUAL_RUN_ID=layout-quality-full-retuned \
npm run qa:visual
```

Result: `45/45` passed.

Focused release-candidate orchestration:

```bash
QA_SHARE_SLUG=x3m2c8cnws \
QA_RELEASE_ARTIFACT_NAME=release-candidate-layout-quality-2026-05-18 \
QA_VISUAL_RUN_ID=release-candidate-layout-quality-2026-05-18 \
QA_RELEASE_INCLUDE_STUDIO=0 \
QA_RELEASE_INCLUDE_SLOW_NETWORK=0 \
QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=0 \
QA_RELEASE_INCLUDE_PROMPT_SUITE=0 \
npm run qa:release-candidate
```

Result: `14/14` passed, including responsive visual QA at `45/45`.

Hard gates:

```bash
npm run lint
npm run build
git diff --check
node --check scripts/platform-visual-baseline.mjs
```

Result: all passed.

## Evidence

- Focused artifact: `qa/visual-baseline-2026-05-18-layout-quality-gate-retuned/`
- Release-candidate artifact: `qa/release-candidate-layout-quality-2026-05-18/`
- Release-candidate visual artifact: `qa/visual-baseline-2026-05-18-release-candidate-layout-quality-2026-05-18/`
- Full matrix covered landing, planner, saved trips, saved journal, account profile, account billing, login, signup, and public share across phone, tablet, laptop, desktop, and wide viewports.
