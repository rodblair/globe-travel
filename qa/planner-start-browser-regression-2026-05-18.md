# Planner Start Browser Regression QA

Date: 2026-05-18
Surface: landing, signup guest entry, `/chat`, `/chat?q=...`, Trip Studio initial handoff
User lens: first-time guest describing a natural trip idea.

## Finding

The live Browser pass showed the planner start flow is currently usable, but the automated planner handoff gate did not yet prove the highest-risk first-time states end to end: a guest entering through the product, a failed `/chat?q=...` draft preserving the original prompt, a delayed draft showing visible progress, and the eventual Trip Studio arrival with the prompt still attached.

## Fix

- Expanded `npm run qa:planner-handoff` with Chrome-backed Browser-style checks on a phone viewport.
- Added a forced-failure `/chat?q=...&qaPlannerDraftFailure=1` check that verifies recovery copy, preserved input, visible `Try again`, no app error, and no horizontal overflow.
- Added a delayed `/chat?q=...&qaPlannerDraftDelayMs=2200` check that verifies `Opening Trip Studio...`, the original prompt in progress copy, disabled duplicate-start controls, prompt-preserving Trip Studio URL, initial generation copy, owner actions, no app error, and no horizontal overflow.
- Added disposable guest/trip cleanup for the new Browser-backed planner checks.
- Hardened visual QA guest cleanup so an already-absent generated guest user is treated as clean.

## Browser Evidence

Checked in Browser on localhost:

- Landing page rendered without horizontal overflow and exposed primary planning actions.
- Signup page exposed `Continue as guest`; a normal click opened `/chat` as a guest planner session.
- `/chat?q=Plan a 4 day Lisbon food trip for friends with viewpoints and relaxed mornings&qaPlannerDraftFailure=1` showed `Could not open Trip Studio`, preserved the prompt in the planner input, exposed `Try again`, and had no horizontal overflow.
- `/chat?q=Plan a 3 day Porto food and viewpoints trip for four friends with relaxed pacing&qaPlannerDraftDelayMs=2200` showed `Opening Trip Studio...`, disabled duplicate-start controls, then opened Trip Studio with a prompt-preserving URL and `Building the first itinerary from your trip idea.`
- Temporary Browser-created trip `3c13c917-5b16-4c45-b8dd-e9a90f0a0eb9` was deleted after manual verification.

## Automated Evidence

- `npm run qa:planner-handoff` passed `17/17`.
- `npm run qa:slow-network` passed `7/7`.
- `npm run qa:prompt-suite` passed `53/53`.
- `QA_VISUAL_ROUTES=planner QA_VISUAL_VIEWPORTS=phone,laptop,desktop QA_VISUAL_ARTIFACT_NAME=visual-baseline-2026-05-18-planner-start-regression npm run qa:visual` passed `3/3`.

## Visual Evidence

- `qa/visual-baseline-2026-05-18-planner-start-regression/README.md`
- Phone: `qa/visual-baseline-2026-05-18-planner-start-regression/screenshots/planner-phone-390x844.png`
- Laptop: `qa/visual-baseline-2026-05-18-planner-start-regression/screenshots/planner-laptop-1280x800.png`
- Desktop: `qa/visual-baseline-2026-05-18-planner-start-regression/screenshots/planner-desktop-1440x950.png`
