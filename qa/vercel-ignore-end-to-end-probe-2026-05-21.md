# Vercel Ignore End-To-End Probe

Date: 2026-05-21
Surface: Release operations

## Purpose

This QA-only file is an end-to-end probe for `client/scripts/vercel-ignore-build.mjs`. The expected behavior is that pushing this documentation/evidence-only commit does not create a new production deployment.

## Expected Result

- Changed path is under `qa/**`.
- Vercel ignored-build command exits `0`.
- Production alias remains on the previous runtime deployment.
- `/api/health` remains `ok`.

## Observed Result

The QA-only probe commit was pushed as:

```text
5a9e78c Probe Vercel docs-only skip
```

Before push, the ignore command was run against the committed probe and returned:

```text
[vercel-ignore] Skipping build: 1 documentation/evidence file(s) changed.
exit=0
```

After push, production health was checked repeatedly for roughly two minutes. The live production alias stayed on the previous runtime/config deployment:

```text
60a565a9566c28c48c03407204e93a278389466a 11/11 globe-travel-onclvcmwb-rodney-blairs-projects.vercel.app
```

Final health check still reported:

- `status: ok`
- `summary: 11/11`
- `criticalMissing: 0`
- `warningMissing: 0`

Outcome: the documentation-only Vercel skip is proven end to end.
