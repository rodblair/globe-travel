# Production Visual Monitoring Workflow

Date: 2026-05-18
Workflow: `.github/workflows/production-visual-gate.yml`
Default production URL: `https://globe-travel-two.vercel.app`
Default share slug: `x3m2c8cnws`

## Scope

This pass promotes visual QA from a local release-candidate check into scheduled production monitoring for public, unauthenticated surfaces.

The workflow runs:

```bash
npm run qa:visual
```

Default public routes:

- `landing`
- `login`
- `signup`
- `public-share`

Pixel-compared stable routes:

- `landing`
- `login`
- `signup`

Baseline directory:

- `qa/visual-baseline-production-2026-05-18`

The public share route is still checked for screenshot capture, required markers, horizontal overflow, app-owned target size, and actionable map-control target size. It is not pixel-compared by default because the itinerary/feedback content is live data.

## Schedule

- Runs daily.
- Supports manual `workflow_dispatch`.
- Manual inputs can override:
  - production or preview base URL
  - public share slug
  - checked route list
  - pixel-compared route list

## Safety

The workflow is read-only and runs only against public routes by default.

Authenticated Trip Studio, account, and saved visual QA still requires local or preview fixture sessions with known signed-in state.

## Evidence

Local validation after adding the workflow:

- Workflow YAML parsed successfully.
- `git diff --check` passed.
- Production-specific baseline creation passed `20/20` for `landing`, `login`, `signup`, and `public-share`.
- Production public visual gate command passed `20/20` against `qa/visual-baseline-production-2026-05-18`.
- In-app Browser confirmed the production public share route renders the Athens five-day itinerary without horizontal overflow or visible app errors.
- Browser screenshot: `qa/production-public-share-browser-visual-gate-loaded-2026-05-18.png`

## Release Impact

This closes the previous release-plan follow-up to schedule visual diff runs in automation for public production surfaces. It does not replace signed-in Browser visual QA; it creates a durable daily signal for the public surfaces most likely to affect acquisition, auth conversion, and viral sharing.
