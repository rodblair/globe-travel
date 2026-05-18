# Globe.travel Platform Readiness Roadmap

Date: 2026-05-17
Horizon: six months
Status: Active operating plan

## Objective

Make Globe.travel commercially launch-ready at scale: every important product journey works, every major surface passes Browser-driven functionality and visual QA, the planner and maps are trustworthy, public sharing creates a viral loop, subscription flows are safe, and release operations are repeatable.

This document is the monthly operating plan. `RELEASE_READINESS_MEMO.md` remains the current release evidence log.

## North Star

A first-time group-trip planner can describe a trip, receive a useful mapped itinerary, refine it, save it, share it with friends, collect feedback, and understand the paid value without confusion.

## Release Bars

- **Functional**: No P0 or P1 issue remains in guest planning, Trip Studio, saved trips, public sharing, feedback, auth, billing, or account flows.
- **Visual**: No broken responsive layouts, overlapping controls, clipped text, unlabeled fields, stale brand copy, or obvious generic AI-app visual tells.
- **Trust**: Generated stops map to the correct destination and route messaging is truthful.
- **Commercial**: Pricing, upgrade, checkout, and subscription management are understandable and safe.
- **Operational**: QA, monitoring, rollback, and release checklists are documented and repeatable.

## Monthly Plan

### Month 1: QA Foundation And Regression Coverage

Goal: turn ad hoc release testing into a repeatable QA system.

Deliverables:
- Browser QA checklist for every production route and every core user path.
- Smoke checks for public routes, app shell routes, and optional live share/trip URLs.
- Visual QA baselines for mobile, tablet, desktop, and wide desktop.
- Regression fixture list for known stable trips: Athens 5-day, Athens couples, Lisbon, Tokyo, Rome, Porto.
- Issue intake format with P0-P3 severity, owner, evidence URL, screenshot, and retest proof.

Required Browser journeys:
- First-time visitor: `/` to signup or guest start.
- Guest planner: `/login` or `/signup` to guest session to `/chat` to Trip Studio.
- Saved user: `/saved`, reopen trip, switch all day tabs, save, share.
- Public recipient: `/t/[shareSlug]`, review itinerary, submit feedback, start own trip.
- Account/billing: `/account`, `/account?tab=billing`, checkout entry, portal entry, error copy.

Exit criteria:
- `npm run lint`, `npm run build`, and `npm run qa:smoke` pass.
- Browser route sweep proves no app-owned overflow, missing labels, stale branding, or undersized primary targets on mobile.
- All known saved itinerary maps are checked day by day.

### Month 2: Planner And Map Reliability

Goal: make generated itineraries geographically trustworthy and recoverable.

Deliverables:
- Prompt suite with at least 50 real trip prompts across cities, group sizes, budgets, lengths, and constraints.
- Destination extraction tests for theme-heavy prompts such as food, viewpoints, beaches, museums, nightlife, family, and budget.
- Geocoding guardrails for wrong-country matches, generic city-only matches, duplicate map stops, and empty-day failures.
- Route-state rules for walking, split route, transit, fallback, and "mapped stops ready."
- Automatic QA report for generated day count, item count, mapped item count, route count, and country consistency.

Priority scenarios:
- One-day city plans.
- Five-day trips.
- Multi-city prompts.
- Friend groups with split preferences.
- Rest-day requests.
- Public-feedback-driven rewrites.

Exit criteria:
- Wrong-country itinerary pins are blocked or clearly recoverable.
- Planner generation can recover from empty day creation.
- Trip Studio never leaves a newly generated trip in a confusing "0 stops" state without an active generation or repair path.

### Month 3: Trip Studio Completion

Goal: make Trip Studio feel like the product, not just an output page.

Deliverables:
- Browser-tested item edit, delete, reorder, swap, apply swap, optimize, rewrite day, build maps, save, and share flows.
- Clear read-only state for public/shared trips.
- Better success/error states for each async action.
- Keyboard and focus-order audit for Trip Studio.
- Mobile and desktop visual pass for action density, drawer behavior, map panel, itinerary panel, and day tabs.

Exit criteria:
- Every Trip Studio action has loading, success, failure, and retest evidence.
- Mobile users can access every critical action without overlap or hidden controls.
- Public shared preview and editable owner view are unmistakably different.

### Month 4: Viral Sharing And Collaboration

Goal: make sharing useful enough that recipients naturally enter the product.

Deliverables:
- Public page visual QA for mobile, tablet, desktop, and social-link recipient context.
- Friend feedback states: empty, one reaction, many reactions, mixed sentiment, long comment, duplicate names.
- "Start your own trip" conversion path from public pages.
- Share-card copy, native share, copy link, and fallback behavior.
- Feedback-to-plan refresh workflow QA.
- Analytics events for share created, public page viewed, feedback submitted, recipient started trip.

Exit criteria:
- A public page is understandable without auth or prior context.
- Feedback submission is fast, safe, and clearly confirmed.
- Public pages create a credible reason to send Globe.travel to friends.

### Month 5: Subscription And Commercial Readiness

Goal: make paid value believable and subscription operations safe.

Deliverables:
- Pricing and billing copy audit.
- Stripe checkout QA in test mode.
- Billing portal QA.
- Subscription webhook QA.
- Free-limit states for saved trips, notes, AI messages, and sharing.
- Upgrade modal visual and copy polish.
- Trial, cancellation, failed payment, and post-upgrade state matrix.

Exit criteria:
- Users understand Explorer versus Adventurer without reading a policy page.
- Checkout and billing portal entry points are safe and recoverable.
- Paywall moments explain the benefit and preserve user work.

### Month 6: Launch Operations And Scale

Goal: make releases boring and production issues visible.

Deliverables:
- Release checklist with preflight, Browser QA, smoke QA, lint, build, deploy, production smoke, rollback.
- Production monitoring for planner failures, map hydration failures, share feedback failures, checkout failures, and API 5xx spikes.
- Weekly QA cadence and monthly visual QA review.
- Support/debug playbook with common symptoms, likely causes, and first checks.
- Launch candidate signoff packet with evidence links.

Exit criteria:
- Every production deploy has a documented pass/fail trail.
- On-call/debug path exists for the top product risks.
- Launch decision can be made from evidence, not vibes.

## Platform Test Matrix

| Area | Proof Required | Cadence |
| --- | --- | --- |
| Landing and acquisition | Browser screenshots plus CTA path to planning | Weekly |
| Auth and guest access | Guest start, signup, login, signout, auth callback | Weekly |
| Planner | Prompt suite, trip creation, empty/error recovery | Twice weekly |
| Trip Studio | Day tabs, map, item actions, save, share, read-only state | Twice weekly |
| Maps | Stop/country consistency, route labels, fallback states | Twice weekly |
| Saved and journal | Reopen trips, delete safety, note create/edit/delete | Weekly |
| Public sharing | Public render, feedback submit, copy/share, recipient CTA | Weekly |
| Billing | Checkout entry, portal entry, subscription state, limits | Before paid releases |
| Responsive visual QA | 390, 768, 1024, 1440, 1728 px route sweeps | Weekly |
| Accessibility | Labels, landmarks, keyboard path, focus rings, contrast | Weekly |
| Performance | Build output, route load feel, map/render jank | Biweekly |
| Production operations | Smoke checks, monitoring, rollback readiness | Every deploy |

## Browser Visual QA Protocol

Use Browser as a real first-time user. Do not rely on code inspection alone.

Viewports:
- Phone: 390 x 844
- Small tablet: 768 x 1024
- Laptop: 1280 x 800
- Desktop: 1440 x 950
- Wide: 1728 x 1050

For each viewport:
- Check horizontal overflow.
- Check first viewport hierarchy.
- Check tap targets and focusable controls.
- Check field labels.
- Check text clipping and awkward wrapping.
- Check sticky/fixed overlays.
- Check modals and drawers.
- Check public share readability.

Evidence to capture:
- Route URL.
- Viewport.
- Screenshot or DOM summary.
- Finding severity.
- Fix commit.
- Retest result.

## Impeccable Audit Cadence

Run these gates in order for major surfaces:

1. **Critique**: hierarchy, cognitive load, tone, emotional journey, AI-slop detection.
2. **Audit**: accessibility, performance, theming, responsive design, anti-patterns.
3. **Normalize**: tokens, spacing, components, labels, buttons, panels.
4. **Harden**: edge cases, long text, error states, auth/guest failures, slow APIs.
5. **Polish**: final spacing, rhythm, microcopy, and visual QA.

Monthly target scores:
- Month 1: 14/20 audit health, 26/40 design health.
- Month 2: 16/20 audit health, 28/40 design health.
- Month 3: 17/20 audit health, 30/40 design health.
- Month 4: 18/20 audit health, 32/40 design health.
- Month 5: 18/20 audit health, 32/40 design health.
- Month 6: 19/20 audit health, 34/40 design health.

## Prompt QA Suite

Maintain a prompt library with expected constraints:

- "Plan a 1-day Porto food and viewpoints trip for 2 friends, walkable."
- "Plan a 5-day Athens trip in mid September for two couples with one rest day."
- "Plan a 3-day Lisbon trip for friends who want food, viewpoints, and nightlife."
- "Plan a Tokyo 3-day first-time visit with one calm evening."
- "Plan a Rome weekend for 4 friends with classic sights and late-night drinks."
- "Plan Barcelona for a budget group that wants beaches, Gaudi, and tapas."
- "Plan Mexico City for food, museums, and one big night out."
- "Plan London for a mixed-energy group with rain-safe options."
- "Plan Paris for two couples, not too touristy, with a premium dinner."
- "Plan New York for friends who have already seen the obvious landmarks."

For every generated trip verify:
- Title uses correct singular/plural day language.
- Day count matches the prompt.
- Meal titles are real named venues.
- Place countries match the destination.
- Map stop count matches visible itinerary stops.
- Route labels are plausible.
- No generated day is empty unless the user asked for a rest day.

## Release Checklist

Before any production deploy:

- `git status --short --branch` is understood.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run qa:smoke` passes against local or preview URL.
- `npm run qa:commercial` passes against local or preview URL.
- `QA_SHARE_SLUG=<known-public-slug> npm run qa:share` passes against local or preview URL.
- Browser mobile route sweep passes for `/`, `/chat`, `/saved`, `/account`, `/login`, `/signup`.
- At least one known Trip Studio URL opens and maps correctly.
- At least one known public share URL opens and feedback form is visible.
- Vercel deploy completes and production smoke returns 200.
- Release memo or changelog records what changed and what was verified.

## Open Backlog

P0/P1 candidates to prioritize first if found:
- Planner creates empty trips without clear progress or recovery.
- Wrong-country geocoding appears in itinerary maps.
- Public share page fails without auth.
- Guest account cannot save, share, or reopen a trip.
- Stripe checkout or portal silently fails.
- Mobile Trip Studio hides critical controls.

P2/P3 candidates:
- Improve public share visual storytelling.
- Add richer share-card previews.
- Expand saved trip filtering and sorting.
- Add keyboard shortcuts for power users.
- Improve journal linkage to specific trip days.
- Add automated screenshots for visual regression.
