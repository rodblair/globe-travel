# Launch Signoff Visual Screenshot Durability

Date: 2026-05-21

## Goal

Close the visual QA evidence gap where launch signoff trusted the responsive visual summary JSON but did not prove that the reviewable screenshot files were still present.

## Fix

- Added a launch-signoff check that every responsive visual QA result has a screenshot path.
- The check requires the screenshot count to match the visual summary `checked` count.
- The check verifies every referenced screenshot file exists on disk.
- The default full visual artifact currently proves `50` checked route/viewport screenshots.

## Verification

- `node --check scripts/platform-launch-signoff.mjs`: pass
- `npm run qa:launch-signoff`: pass, `32/32`
- Positive visual screenshot check: `50` visual results, `50` screenshots, `0` missing screenshots.
- Missing-screenshot negative test: failed as expected with `missingScreenshotCount: 1`.

## Result

Launch signoff now proves the visual QA artifact is reviewable, not just summarized. This strengthens design, layout, and responsive QA because a passing launch packet must retain the actual screenshot evidence for every checked route and viewport.
