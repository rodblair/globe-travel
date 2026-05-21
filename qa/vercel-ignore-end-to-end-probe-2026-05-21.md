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

