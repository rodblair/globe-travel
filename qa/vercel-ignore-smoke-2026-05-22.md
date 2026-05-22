# Vercel Ignore Smoke

Date: 2026-05-22
Status: pass

## Result

- Checked: 5
- Passed: 5
- Failed: 0
- Safe skip cases: 4
- Runtime build cases: 1

## Cases

- Pass: qa-only-probe-skips - QA evidence-only probe commit skips Vercel production build.
- Pass: workflow-and-ignore-policy-skips - Release-ops workflow and ignore-policy commit stays skip-safe.
- Pass: current-release-ops-scripts-skip - Current release-ops QA script and evidence updates skip Vercel production build.
- Pass: qa-package-script-release-ops-skip - QA script-only package.json updates with release evidence skip Vercel production build.
- Pass: runtime-billing-builds - Known runtime billing change still continues Vercel production build.

## Failures

- none

## Operating Meaning

This smoke proves release evidence, workflow, and QA-script-only commits remain safe to skip in Vercel while a known runtime application change still forces a production build. It protects production deployment hygiene without weakening runtime deploy coverage.
