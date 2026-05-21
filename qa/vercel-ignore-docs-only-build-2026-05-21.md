# Vercel Documentation-Only Build Skip

Date: 2026-05-21
Surface: Release operations and production deployment hygiene

## Goal

Stop QA evidence and release-memo commits from repeatedly promoting production when no runtime code changed. This keeps the production release gate focused on real deploys while still preserving the evidence trail in Git.

## Change

- Added `client/vercel.json` with an `ignoreCommand`.
- Added `client/scripts/vercel-ignore-build.mjs`.
- The ignore script skips Vercel builds only when every changed file is clearly documentation or QA evidence:
  - `qa/**`
  - `README.md`
  - `OPERATIONS_RUNBOOK.md`
  - `PLATFORM_*.md`
  - `RELEASE_READINESS_MEMO.md`
- Any change outside those paths continues the Vercel build. This includes all `client/**` runtime, config, package, and QA-script changes.

## Verification

Dry-run against the latest evidence-only commit:

```bash
node scripts/vercel-ignore-build.mjs
```

Result:

```text
[vercel-ignore] Skipping build: 63 documentation/evidence file(s) changed.
exit=0
```

Dry-run against the billing runtime commit:

```bash
VERCEL_GIT_PREVIOUS_SHA=0bf1e74 \
VERCEL_GIT_COMMIT_SHA=ec53a97 \
node scripts/vercel-ignore-build.mjs
```

Result:

```text
[vercel-ignore] Continuing build: runtime-relevant change(s) detected: client/app/(app)/account/page.tsx, client/scripts/platform-billing-recovery-smoke.mjs
exit=1
```

Additional verification:

- `node --check scripts/vercel-ignore-build.mjs` passed.
- `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"` passed.
- `npm run lint` passed.
- `npm run build` passed.

## Production Context

Before this fix, pushing evidence commit `0b7a9c2` still auto-deployed production. The live alias reported commit `0b7a9c2134a83a3cba54f4abdb3186acc9f66cfd` with `11/11` health checks OK, and the full non-mutating production release gate passed `10/10` with production visual QA `20/20`.

