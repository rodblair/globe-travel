# Globe.travel Release Readiness Memo

Date: 2026-05-17
Owner: Codex release audit
Status: Active goal in progress

## Release Objective

Ship Globe.travel as a complete, commercially credible, highly useful group-trip planning app. The release must feel clear, modern, social, and trustworthy for first-time users, while every core flow works from start to finish in the browser.

The product promise is:

- A friend group can describe a trip in natural language.
- Globe turns the idea into a usable itinerary with maps.
- The group can refine the plan through swaps, optimization, and chat.
- The plan can be saved, reopened, shared, reviewed, and acted on.
- The app feels polished enough to charge for and strong enough to spread through shared trip links.

## Design Context

Primary users are friend groups planning trips together. They need help turning messy ideas into a real itinerary and collecting feedback before booking or committing.

The interface should feel easy to understand, confident, social, refined, intentional, and editorial. It should reduce planning chaos, not add operational weight.

Design principles:

- Make group planning legible at a glance.
- Reduce duplication and visual noise.
- Keep maps and itinerary tightly connected.
- Preserve strong contrast and readable controls.
- Make collaboration feel lightweight and calm.

## Definition Of Done

The app is release-ready only when all of these are true:

- A first-time guest user can start planning without confusion.
- A returning user can find saved trips, public trips, account state, and billing state.
- The planner can create a trip from natural language and recover gracefully from delays or errors.
- Trip Studio supports itinerary review, map review, day switching, item editing, reorder, delete, optimize, swaps, save, share, and public review.
- Maps relate clearly to itinerary stops and never show obviously wrong-country placeholder pins.
- Public share pages are useful, attractive, and understandable to recipients who are not logged in.
- Account, saved, journal, pricing, profile, and settings surfaces are coherent and do not dead-end users.
- Mobile, tablet, and desktop layouts have no broken overflow, hidden critical actions, unreadable text, or overlapping UI.
- All major async actions have loading, success, and error states.
- Empty states teach users what to do next.
- Copy is concise, human, and consistent.
- Accessibility passes the release bar for labels, focus, keyboard use, contrast, landmarks, and error recovery.
- `npm run lint` passes.
- `npm run build` passes.
- A production Vercel deployment is ready.

## Core Test Matrix

### Acquisition And First Impression

- Landing page at `/`
- Mobile landing page
- Primary CTA into planning
- Pricing clarity
- Brand consistency: Globe.travel, not stale names
- No generic AI-app visual tells

### Guest Planning

- Guest start
- Natural-language trip request
- Planner chat loading and response states
- Trip creation handoff from chat to Trip Studio
- Failed AI/API handling
- Refresh/reopen behavior

### Trip Studio

- Trip loads from `/trips/[tripId]`
- Day tabs work
- Selected route/map is coherent
- Map labels and route states are truthful
- Itinerary item selection moves/relates to map
- Reorder works
- Delete works with safe feedback
- Edit title works
- Optimize day works
- Swap menu opens
- Swap options return
- Apply swap works
- Rewrite day works or fails gracefully
- Save trip works
- Build maps works or explains failure
- Share with friends works
- Public link opens
- Read-only shared trip behavior is clear

### Saved And Account Surfaces

- `/saved` trips tab
- `/saved` journal tab
- Empty states
- Delete saved trip safety
- Public/private status clarity
- `/trips` overview
- `/account`
- `/profile`
- `/settings`
- Subscription status

### Public And Viral Loops

- `/t/[shareSlug]` loads without auth
- Friend understands the plan immediately
- Feedback/reaction flow works
- Copy link/share affordances work
- Shared artifact looks good on mobile
- Plan creates a reason to send to friends
- Recipient can start their own trip or save/copy appropriately

### Maps And Itineraries

- All saved itineraries open
- All day tabs open
- Stops match destination
- Stop count is explainable
- Long walk days show split/transit route state
- No known placeholder pins:
  - `Day • Argentina`
  - `Rua Do City Portugal`
  - generic country mismatch
- Map fallback is graceful when Mapbox is unavailable

### Commercial Readiness

- Pricing page is clear
- Upgrade modal is understandable
- Stripe checkout starts safely
- Subscription status reads correctly
- Free limit messaging is clear
- No paywall traps without explanation

### Technical Reliability

- Auth and guest access work consistently
- API routes return useful status codes
- Client handles 401/403/404/500 states
- Browser console has no release-blocking errors
- Build is clean
- No stale dev-only text or debug artifacts

## Impeccable Audit Gates

Every major surface must pass these gates:

- **Critique gate**: clear hierarchy, low cognitive load, believable brand tone, no obvious AI-generated visual formula.
- **Audit gate**: accessibility, performance, theming, responsiveness, and anti-patterns scored and addressed.
- **Normalize gate**: shared tokens, spacing, buttons, panels, copy style, and interaction patterns are consistent.
- **Harden gate**: long text, empty states, loading states, API errors, slow network, and guest/auth edge cases are handled.
- **Polish gate**: no awkward spacing, overlap, clipped text, weak microcopy, or confusing action hierarchy.

## Release Priority System

- P0: Prevents a core user journey from completing.
- P1: Makes the product feel untrustworthy, broken, inaccessible, or not commercially ready.
- P2: Causes friction but has a workaround.
- P3: Polish improvement.

No P0 or P1 issue may remain for release.

## Product Quality Bar

The release should feel:

- Useful within the first minute.
- Calm enough for group planning.
- Clear enough for a non-technical friend to review.
- Distinctive enough to remember.
- Trustworthy enough to save and share.
- Commercial enough to support paid plans.

## Viral And Profitability Requirements

The app should create natural sharing moments:

- A trip plan should be easy to send to friends.
- The public page should make recipients want to react.
- Feedback should improve the plan or clearly feed into planning.
- The share page should invite recipients to create their own trip.
- Saved artifacts should feel worth keeping.

The paid path should be credible:

- Free value is obvious.
- Paid value is concrete.
- Limits and upgrades are explained without pressure or confusion.
- Stripe flow is reachable and safe.

## Execution Protocol

1. Run the app locally.
2. Use Browser as a first-time user.
3. Record P0/P1/P2 findings by surface.
4. Fix the highest-impact issues first.
5. Retest the exact flow that failed.
6. Repeat until the test matrix passes.
7. Run lint and build.
8. Deploy to Vercel.
9. Commit and push only verified work.

## Current Known Baseline

Recently completed:

- Itinerary map stop verification was repaired.
- Six saved itineraries were retested locally.
- `npm run lint` and `npm run build` passed.
- Commit `a59fb4a` was deployed to Vercel production.

Remaining release work:

- Full app flow audit beyond itinerary maps.
- First-time guest planning from scratch.
- Public share and feedback UX audit.
- Account/pricing/subscription audit.
- Mobile and responsive visual polish.
- Accessibility and keyboard audit.
- Error-state hardening.
- Final end-to-end release verification.

## Release Completion Log

Use this section as work progresses.

- 2026-05-17: Active release goal created. Memo established.
- 2026-05-17: Browser baseline route audit completed across landing, chat, saved, account, pricing, auth, and Trip Studio routes on mobile and desktop. Fixed missing labels on chat/account/auth/public feedback/journal forms and improved undersized app-owned tap targets.
- 2026-05-17: Verified all six saved itineraries in Browser. Opened every day tab across the saved trips, including the five-day Athens itinerary. Each selected day rendered an itinerary-linked map with stop counts matching the visible day plan.
- 2026-05-17: Verified public share pages for Athens links. Public itinerary, day-by-day route cards, share card, and friend feedback are visible without auth after load. Submitted a Browser QA reaction successfully and confirmed it appeared in Friend Feedback.
- 2026-05-17: Verified private-trip sharing from Trip Studio. Closing the planner chat and using Share with friends turns the trip public and exposes a View share link.
- 2026-05-17: Fixed mobile Trip Studio chat overlap by moving the drawer below the top action grid on phone viewports.
- 2026-05-17: Tested first-plan creation from `/chat`. The planner created a Trip Studio from natural language and generated itinerary items. Found and fixed a P1 destination anchoring bug where theme-heavy prompts such as "Porto food and viewpoints" could geocode Porto stops to the wrong country. Retested the same prompt and confirmed Porto stops mapped to Portugal.
- 2026-05-17: Cleaned temporary QA trips from Saved after planner testing.
- 2026-05-17: Final mobile Browser sweep passed for `/`, `/chat`, `/saved`, `/saved?tab=journal`, `/account`, `/account?tab=billing`, `/login`, `/signup`, the five-day Athens Trip Studio page, and the Athens public share page: no app-owned overflow, missing labels, stale branding, or undersized app-owned touch targets remained.
- 2026-05-17: `npm run lint` passed.
- 2026-05-17: `npm run build` passed.
- 2026-05-17: Added `PLATFORM_READINESS_ROADMAP.md` for the six-month platform QA, visual QA, subscription, viral loop, and release operations plan. Added `npm run qa:smoke` and validated it against production, including expected unauthenticated redirects to `/login`.
- 2026-05-17: Added Month 1 Browser route-sweep evidence in `qa/month-1-browser-route-sweep-2026-05-17.md`. Retested landing, planner, saved, journal, account, billing, auth, Athens Trip Studio, and Athens public share at 390 x 844 and 1280 x 800. Fixed the unlabeled sidebar account avatar link and confirmed no missing labels, mobile overflow, stale brand copy, or visible error copy remained on the checked routes.
- 2026-05-17: Added `npm run qa:commercial` and evidence in `qa/commercial-readiness-smoke-2026-05-17.md`. Fixed billing return URLs so checkout and portal return to `/account?tab=billing`, made billing portal failures return structured JSON, hardened billing client error parsing, and removed stale `arcki` package metadata from QA command output. Browser checked billing/auth surfaces at 390 x 844 and 1280 x 800 with no overflow, missing labels, stale brand copy, or visible app errors.
- 2026-05-17: Deployed commercial-readiness commit `5e625bb` to Vercel production deployment `dpl_JECLbP4USeFDqUZuAWiAk8zxrYdj`, aliased to `https://globe-travel-two.vercel.app`. Production `npm run qa:smoke` passed 7/7 and production `npm run qa:commercial` passed 4/4 with the Athens share validation check.
- 2026-05-17: Added `npm run qa:share` and evidence in `qa/public-share-readiness-2026-05-17.md`. Refactored public share pages to emit trip-specific title, description, Open Graph, and Twitter metadata; hardened feedback and share/copy error states; and Browser-checked the Athens public share page at 390 x 844, 768 x 1024, and 1280 x 800.
- 2026-05-17: Vercel auto-deployed public-share commit `5ccdf68` to production deployment `dpl_Aoxi6ozG1nUotJExYAQgVtJ6Rc1D`, aliased to `https://globe-travel-two.vercel.app`. Production `npm run qa:smoke` passed 7/7, production `npm run qa:commercial` passed 4/4, and production `npm run qa:share` passed 3/3 for the Athens public share link.
- 2026-05-17: Added `/api/health`, `npm run qa:ops`, and evidence in `qa/operations-readiness-2026-05-17.md` so production monitoring can verify planner, map, Supabase, Stripe, and deployment metadata readiness without exposing secrets.
- 2026-05-17: Added `OPERATIONS_RUNBOOK.md` with release gates, health expectations, incident severity, rollback criteria, rollback steps, monitoring targets, and product-specific debug pointers.
- 2026-05-17: Strengthened `npm run qa:share` so public share QA now verifies every day has mapped itinerary stops, a single country, and at least one usable route. Local Athens public share check passed 4/4 with all five days mapped in Greece.
- 2026-05-17: Production ops verification remains blocked by queued Vercel deployments. The live alias still returns 404 for `/api/health`, while local `npm run qa:ops` passes 2/2 and local `npm run build` includes `/api/health`.
