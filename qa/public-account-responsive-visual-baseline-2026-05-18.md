# Public Share And Account Responsive Visual Baseline

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Stable public share slug: `x3m2c8cnws`
Signed-in Browser profile: local guest profile used by the in-app Browser

## Purpose

Expand responsive visual QA beyond Trip Studio into two launch-critical surfaces:

- Public share recipient page: `/t/x3m2c8cnws`
- Returning user account and billing pages: `/account`, `/account?tab=billing`

This pass focuses on viewport correctness, horizontal overflow, visible action hierarchy, form/control sizing, and absence of visible app errors.

## Viewports Checked

| Surface | Viewports | Result |
|---|---|---|
| Public share | `390 x 844`, `768 x 1024`, `1280 x 800` | Pass |
| Account profile | `390 x 844`, `768 x 1024`, `1280 x 800` | Pass |
| Account billing | `390 x 844`, `768 x 1024`, `1280 x 800` | Pass |

## Public Share Baseline

Route: `/t/x3m2c8cnws`

Phone viewport isolation confirmed:

- `window.innerWidth`: `390`
- `window.innerHeight`: `844`
- `documentElement.clientWidth`: `390`
- `documentElement.scrollWidth`: `390`
- horizontal overflow: `false`
- meta viewport: `width=device-width, initial-scale=1`

Visible and reachable content:

- `Start your own trip` CTA is visible in the first viewport at `182 x 44`.
- The share page renders the Athens itinerary, day-by-day route cards, maps, and stop details.
- The feedback section is present lower on the page:
  - `ADD YOUR REACTION`
  - `Help tune the plan`
  - `FRIEND FEEDBACK`
  - `SHARE TRIP`
  - `Start your own trip`
- The feedback form exposes three accessible fields:
  - `Your name`, `316 x 46`
  - `Email optional`, `316 x 46`
  - `Trip feedback`, `316 x 140`
- `Send feedback`, `Copy link`, `Share`, and `Start your own trip` are present.
- No visible application error copy.

Note: an initial combined viewport run produced a stale wide reading for the first public-share phone sample. A dedicated isolated check immediately after confirmed the correct `390px` layout with no horizontal overflow.

## Account Profile Baseline

Route: `/account`

Phone viewport:

- `window.innerWidth`: `390`
- `documentElement.clientWidth`: `390`
- `documentElement.scrollWidth`: `390`
- horizontal overflow: `false`

Controls and form fields:

- `Profile` tab visible at `99 x 44`.
- `Billing` tab visible at `96 x 44`.
- `Display name` input visible at `308 x 46`.
- `Username` input visible at `308 x 46`.
- `Bio` textarea visible at `308 x 106`.
- `Save changes` visible at `158 x 44`.
- No visible application error copy.

Tablet and desktop checks:

- `/account` renders with no horizontal overflow at `768 x 1024` and `1280 x 800`.
- Profile and Billing tab controls remain visible and at least `44px` tall.
- Profile form inputs remain labeled and at least `44px` tall.

## Account Billing Baseline

Route: `/account?tab=billing`

Phone viewport:

- `window.innerWidth`: `390`
- `documentElement.clientWidth`: `390`
- `documentElement.scrollWidth`: `390`
- horizontal overflow: `false`

Billing content:

- `Plan and billing`
- current `Explorer` plan
- `Upgrade to Adventurer`
- interval controls: `Monthly`, `Yearly`
- `Start free trial`
- plan comparison
- `Start a group trip`

Control sizing:

- `Profile` tab visible at `99 x 44`.
- `Billing` tab visible at `96 x 44`.
- `Start free trial` is `308 x 48` on phone and visible after normal page scroll.
- `Start free trial` is visible within the tablet and desktop viewport checks.
- No visible application error copy.

## Findings

- Pass: Public share page has a valid mobile viewport and no horizontal overflow at checked widths.
- Pass: Public feedback form fields are accessible through aria labels and have sufficient touch sizing.
- Pass: Account profile fields are labeled, visible, and touch-sized on phone.
- Pass: Billing content and subscription CTA render without overflow on phone, tablet, and desktop.
- Follow-up: Public share should be added to durable screenshot capture once the Mapbox-heavy screenshot timeout has a reliable workaround.
- Follow-up: Add at least two more stable public share slugs to the responsive visual matrix once more generated trips are promoted.
