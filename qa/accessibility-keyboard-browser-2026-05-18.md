# Accessibility And Keyboard Browser Evidence

Date: 2026-05-18
Environment: local app at `http://localhost:3000`

## Scope

This pass adds release-candidate evidence for accessibility and keyboard readiness on the current local app.

The automated gate is `npm run qa:a11y` from `client/`. It checks:

- landing
- planner
- saved trips
- account profile
- account billing
- login
- signup
- public share

Each route is checked at phone and desktop widths.

## Result

`QA_SHARE_SLUG=x3m2c8cnws npm run qa:a11y` passed `16/16`.

Artifact:

- `qa/accessibility-keyboard-2026-05-18/README.md`
- `qa/accessibility-keyboard-2026-05-18/summary.json`

## Fixes Applied

- Added a global skip link to `#main-content`.
- Added a main-content skip target around the app body.
- Corrected destination pins with labels to use `role="img"` instead of applying `aria-label` to a plain span.
- Darkened secondary ink, brass, moss, and terracotta tokens so small labels and status copy meet contrast on paper and tinted wash surfaces.
- Raised low-opacity foreground utility contrast for operational helper copy.
- Removed low-opacity helper styling from the selected public-share sentiment button.

## In-App Browser Evidence

The in-app Browser verified the public share page at `/t/x3m2c8cnws`:

- title: `5 Days in Athens Greece in mid september | Globe.travel`
- `Start your own trip` CTA present
- global skip link present
- no horizontal overflow
- public-share sentiment helper contrast measured at `4.92`
- Mapbox zoom controls measured at `46 x 46`

The in-app Browser verified account billing at `/account?tab=billing`:

- `Account` content present
- `Plan and billing` content present
- global skip link present
- no horizontal overflow
- `17` focusable elements detected

Browser screenshot capture timed out inside the in-app Browser during this pass. Durable visual screenshots were captured by the Chrome-backed visual runner instead.

## Visual Retest

Focused visual QA after color and contrast polish passed `15/15`:

`QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_RUN_ID=a11y-polish QA_VISUAL_ROUTES=landing,account-billing,public-share QA_VISUAL_PROGRESS=1 QA_VISUAL_SETTLE_MS=1500 npm run qa:visual`

Artifact:

- `qa/visual-baseline-2026-05-18-a11y-polish/README.md`
- `qa/visual-baseline-2026-05-18-a11y-polish/summary.json`
