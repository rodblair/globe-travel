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
- production prompt actual export for the stable Athens public share
- 52-prompt suite validation using the production Athens actual

Production feedback insertion remains opt-in with `QA_INCLUDE_FEEDBACK_MUTATION=1`.

## Verification

```bash
npm run qa:release-production
```

Result: passed `7/7`.

Summary:

- production ops: passed
- production smoke: passed
- production auth and guest access: passed
- production commercial: passed
- production share: passed
- production prompt actuals export: passed
- prompt suite with production actuals: passed

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
