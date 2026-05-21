# Public Share Viral Gate Hardening

Date: 2026-05-21
Surface: `/t/[shareSlug]`
Status: Passed

## Issue

During the post-deploy production release gate, the public-share viral-loop smoke did not return a timely pass/fail. The run was stopped and inspected as a release-operations issue because an indefinite QA gate cannot be trusted as launch evidence.

The brittle point was the readiness check for public-share controls. It waited on `Share trip` body text that is not a stable rendered marker for the live page, causing slow repeated retries before the copy/share controls were exercised.

## Fix

`platform-share-viral-smoke.mjs` now treats the actual user-facing controls as readiness markers:

- `Start your own trip`
- `Add your reaction`
- `Friend feedback`
- `Copy link`
- `Share`

The browser shutdown path is also bounded. If Chromium does not close within five seconds, the launched browser process is killed so the gate cannot remain open indefinitely after checks complete.

## Verification

Standalone production viral-loop smoke:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral
```

Result:

- Passed `5/5`.
- Phone and desktop share affordances were visible.
- Copy link wrote the public URL and showed success feedback.
- Native share payload was trip-specific.
- Remote guest-start mutation was skipped safely.

Full production release gate:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-saved-reopen-viral-gate-2026-05-21-c4c30c3 npm run qa:release-production
```

Result:

- Passed `10/10`.
- Production ops passed `3/3`.
- Production smoke passed `8/8`.
- Production Trip Studio recovery UI passed `1/1`.
- Production auth and guest access passed `13/13`.
- Production commercial passed `4/4`.
- Production share passed `5/5`.
- Production public share viral loop passed `5/5`.
- Production public visual gate passed `20/20`.
- Production prompt actual export returned `athens-5-day-couples-rest`.
- Prompt suite with production actuals passed `56/56`.

Artifact:

- `qa/visual-baseline-production-saved-reopen-viral-gate-2026-05-21-c4c30c3/`
