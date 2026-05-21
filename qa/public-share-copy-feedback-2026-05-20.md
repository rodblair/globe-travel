# Public Share Copy Feedback Fix

Date: 2026-05-20

## Scope

Fix the remaining production release-gate issue found in the public share viral loop. The failing check wrote the correct public itinerary URL to the clipboard, but the page-level success feedback was not reliably visible to the Browser smoke test.

## Fix

- Added visible, accessible success feedback to the public-share `ShareLinkCard` after `Copy link`.
- Kept the button label change from `Copy link` to `Copied`.
- Hardened the viral-loop Browser smoke so it waits for the visible copied state before sampling.
- Hardened the multi-itinerary share smoke with the same copied-state wait.
- Added retry/reload readiness around the production public-share smoke because the remote page can briefly remain in its loading skeleton before share and feedback sections hydrate.

## Verification

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-viral
```

Passed `5/5` against the production Athens share link:

- public share viral affordances are visible on phone
- public share viral affordances are visible on desktop
- public share copy link gives success feedback
- public share native share payload is trip-specific
- public share start CTA guest-session click skipped safely on remote base URL

Additional gates:

```bash
npm run lint
npm run build
```

Both passed.

## Notes

The earlier full production release gate passed production ops, smoke, auth/guest access, commercial checks, Athens public share, visual QA `20/20`, production prompt actual export, and prompt-suite production actual validation. Its only failure was the public share viral-loop copy feedback/readiness path closed here.
