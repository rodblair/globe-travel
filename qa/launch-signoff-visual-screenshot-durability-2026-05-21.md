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

## Postdeploy Evidence

Commit `9388077cde69c22fe77c08e9354fc4e69b0986a0` deployed to Vercel production.

- Production alias: `https://globe-travel-two.vercel.app`
- Deployment URL: `globe-travel-8n51a4vt2-rodney-blairs-projects.vercel.app`
- Production health: `ok`, `11/11`
- Exact-commit launch signoff: `33/33`
- Non-visual production release gate: `9/9`
- Athens public share/map integrity: `5/5`, with 5 itinerary days, mapped stops, usable routes, share metadata, and share-card image.
- Prompt suite with production actuals: `56/56`
