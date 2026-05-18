# Production Release Command QA

Date: 2026-05-18
Production URL: `https://globe-travel-two.vercel.app`
Stable share slug: `x3m2c8cnws`
Command: `npm run qa:release-production`

## Scope

This pass converts the post-deploy production rehearsal into a repeatable release command.

The new command runs the read-only production release gates together:

- production operations health with deployment metadata
- production route smoke
- production auth and guest access Browser smoke
- production commercial safety checks
- production public share integrity and social-preview metadata
- production public share viral-loop affordances
- production public visual QA for landing, login, signup, and public share
- pixel-diff comparison for stable public shell routes
- production prompt actual export for the stable Athens public share
- 52-prompt suite validation using the production Athens actual

Production feedback insertion remains opt-in with `QA_INCLUDE_FEEDBACK_MUTATION=1`.
Production visual QA is enabled by default and can be disabled only with `QA_INCLUDE_PRODUCTION_VISUAL=0`.
Production viral-loop QA is enabled by default and can be disabled only with `QA_INCLUDE_PRODUCTION_VIRAL=0`.

## Verification

```bash
npm run qa:release-production
```

Original command result: passed `7/7`.
Latest integrated visual release-gate result: passed `8/8`.
Latest integrated visual plus viral release-gate result: passed `9/9`.

Summary:

- production ops: passed
- production smoke: passed
- production auth and guest access: passed
- production commercial: passed
- production share: passed
- production public share viral loop: passed `5/5`
- production public visual gate: passed `20/20`
- production prompt actuals export: passed
- prompt suite with production actuals: passed

Production visual evidence:

- artifact: `qa/visual-baseline-production-release-2026-05-18/`
- checked routes: `landing`, `login`, `signup`, `public-share`
- checked viewports: phone, tablet, laptop, desktop, wide
- pixel-compared routes: `landing`, `login`, `signup`
- visual checks passed: `20/20`
- in-app Browser confirmed the live Athens public share rendered with no horizontal overflow or visible runtime errors, with the title/day content, feedback section, and Start your own trip CTA present.

Prompt actual evidence:

- exported actuals: `1`
- actual id: `athens-5-day-couples-rest`
- prompt-suite fixtures checked: `52`
- prompt-suite fixtures passed: `52`
- actuals checked: `1`
- missing coverage: `[]`

Public share evidence:

- Athens public trip API returned `5` days.
- All days had mapped stops and usable routes.
- Share metadata was present.
- Share-card image returned `image/png`.
- Share-card image byte length: `81579`.

Viral-loop evidence:

- Phone and desktop share affordances were visible without horizontal overflow.
- Public share title rendered as `5 Days in Athens Greece in mid september | Globe.travel`.
- Two Start your own trip links were present.
- Recipient planner prompt preserved the shared trip intent: `Plan a 5-day trip to Athens Greece in mid september with a shareable itinerary map for my group.`
- Copy link wrote `https://globe-travel-two.vercel.app/t/x3m2c8cnws` and showed `Copied`.
- Native share payload was trip-specific with title `5 Days in Athens Greece in mid september`.
- Remote guest-start mutation remained skipped by default.

Auth and guest access evidence:

- Logged-out login/signup expose guest access.
- Logged-out public share remains readable.
- Saved/account/pricing resolve safely.
- Guest start opens `/chat` with a guest cookie.
- Guest saved/account surfaces render without overflow or app errors.
- Production guest API mutation is skipped by default.

## Release Impact

Post-deploy release verification is now one command for the stable production baseline:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production
```

This reduces the chance of skipping the exact production check that previously caught the missing share-card route.

The command now also reduces the chance of shipping a visually broken acquisition, auth, or public-share surface after production deploys, and it verifies that a recipient can copy, share, and start from the public Athens itinerary without turning the production smoke test into a mutating guest-session run.
