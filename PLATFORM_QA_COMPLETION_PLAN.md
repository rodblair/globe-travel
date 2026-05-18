# Globe.travel Platform QA And Completion Plan

Date: 2026-05-17
Horizon: next several months
Status: Active execution plan
Active goal: Complete full-platform functionality testing, Browser-driven user journey QA, visual QA, design-system polish, reliability hardening, viral sharing loops, subscription readiness, and release operations until Globe.travel is commercially launch-ready.

## Purpose

This plan turns the platform-readiness goal into a practical operating cadence. It is the working plan for completing Globe.travel as a reliable, polished, useful travel-planning platform.

The release target is not just "the app builds." The target is that a first-time user can plan, edit, map, save, share, and invite feedback on a trip without confusion, while the product feels commercially credible enough to charge for and memorable enough to spread through shared trip links.

## Current Baseline

Already established:

- Six-month roadmap: `PLATFORM_READINESS_ROADMAP.md`
- Release evidence log: `RELEASE_READINESS_MEMO.md`
- Operations runbook: `OPERATIONS_RUNBOOK.md`
- Local QA commands: `npm run lint`, `npm run build`, `npm run qa:smoke`, `npm run qa:commercial`, `npm run qa:ops`, `npm run qa:share`
- Browser route-sweep evidence for core local surfaces
- Public-share QA for the Athens five-day itinerary
- Local operations health endpoint and ops smoke test

Known release blocker:

- Production operations verification remains blocked until Vercel serves the latest deployment containing `/api/health`. The live production alias was still returning 404 for `/api/health` when this plan was written, while local build and local ops checks passed.

## Operating Rhythm

### Daily During Active Build Weeks

- Review newest P0/P1 findings first.
- Run the smallest Browser flow needed to reproduce each issue.
- Fix one coherent surface or journey at a time.
- Retest the exact failed Browser flow after every fix.
- Keep `RELEASE_READINESS_MEMO.md` current with evidence, commit, and deployment notes.

### Weekly

- Run local QA commands from `client/`:
  - `npm run lint`
  - `npm run build`
  - `npm run qa:smoke`
  - `npm run qa:commercial`
  - `npm run qa:ops`
  - `QA_SHARE_SLUG=<known-public-slug> npm run qa:share`
- Complete a Browser route sweep at 390, 768, 1280, and 1440 widths.
- Review one major surface with critique, audit, normalize, harden, and polish gates.
- Update the issue ledger with open P0/P1/P2/P3 items and retest status.

### Monthly

- Run the full platform matrix end to end.
- Re-score the app against design health and audit health targets.
- Promote only if production smoke, share QA, ops QA, and Browser checks all pass.
- Archive screenshots, DOM summaries, logs, and production URLs in `qa/`.

## Month 1: Release Control And Baseline Confidence

Objective: create dependable release gates and remove obvious launch blockers across the current app.

Primary surfaces:

- Landing
- Login
- Signup
- Guest planner
- Chat
- Trip Studio
- Saved trips
- Saved journal
- Account
- Billing
- Public share page

Functional work:

- Confirm a first-time guest can move from landing to planning to Trip Studio.
- Confirm a returning user can reopen saved trips and saved journal entries.
- Verify all existing known itineraries day by day, including the Athens five-day trip.
- Confirm every public share page works without auth.
- Confirm share, copy link, friend feedback, and recipient CTA flows.
- Confirm account and billing pages fail safely when Stripe setup is incomplete.

Visual QA work:

- Sweep every primary route at phone, tablet, laptop, and desktop widths.
- Remove horizontal overflow, clipped text, awkward wrapping, hidden controls, and overlapping fixed/sticky UI.
- Verify primary tap targets are usable on mobile.
- Normalize duplicated action patterns, inconsistent buttons, and uneven spacing.
- Remove stale brand copy and generic AI-app visual tells.

Automation work:

- Keep `qa:smoke`, `qa:commercial`, `qa:ops`, and `qa:share` green locally.
- Add missing smoke coverage when a Browser finding becomes repeatable.
- Record Browser evidence files in `qa/`.

Exit criteria:

- No open P0 issue.
- No open P1 issue in guest planning, saved trips, Trip Studio, maps, public sharing, or account/billing.
- Local lint, build, smoke, commercial, ops, and share QA pass.
- Production `/api/health` is live and production ops QA passes.

## Month 2: Planner And Map Trust

Objective: make generated itineraries geographically trustworthy and recoverable.

Functional work:

- Build a prompt suite of at least 50 travel prompts across destinations, trip lengths, group sizes, budgets, and travel styles.
- Include at minimum:
  - Athens five days
  - Porto food and viewpoints
  - Lisbon friends trip
  - Rome weekend
  - Tokyo first-time visit
  - Multi-city Europe trip
  - Beach-heavy trip
  - Rest-day trip
  - Budget group trip
  - Premium couples trip
- Verify day count, item count, mapped stop count, route count, country consistency, and empty-day behavior.
- Add recovery paths for missing maps, wrong-country geocodes, empty generated days, and failed route builds.

Visual QA work:

- Make planner progress states explicit and calm.
- Keep map and itinerary selection visibly connected.
- Improve empty and partial-map states so users know what is happening.
- Confirm route labels are truthful, not overconfident.

Automation work:

- Add a prompt-suite QA command or fixture runner.
- Emit a structured report for each generated trip.
- Flag wrong-country matches and unmapped itinerary items automatically.

Exit criteria:

- Wrong-country pins are blocked, repaired, or clearly flagged.
- New trips never land in a confusing "0 stops" state without a repair path.
- Athens five-day and at least nine other fixture prompts pass map trust checks.

## Month 3: Trip Studio Completion

Objective: make Trip Studio the strongest product surface.

Functional work:

- Browser-test every important Trip Studio action:
  - Day switching
  - Map item selection
  - Edit item
  - Delete item
  - Reorder item
  - Swap item
  - Apply swap
  - Optimize day
  - Rewrite day
  - Build maps
  - Save trip
  - Share with friends
  - Open public link
- Verify loading, success, error, and retry states for every async action.
- Confirm read-only public/shared trip state cannot be mistaken for owner edit mode.

Visual QA work:

- Rebalance Trip Studio action density on mobile and desktop.
- Make day tabs, itinerary panel, and map panel feel connected.
- Reduce repeated labels and redundant headers.
- Ensure mobile drawers and fixed elements never cover critical controls.
- Improve focus order and visible focus styling.

Automation work:

- Add route-level checks for Trip Studio structure and critical controls.
- Add regression checks for itinerary item counts and map stop counts.

Exit criteria:

- Every Trip Studio action can be completed or fails with clear recovery.
- Mobile Trip Studio exposes every critical action without overlap.
- Public read-only state is visually and behaviorally obvious.

## Month 4: Sharing, Feedback, And Viral Loops

Objective: turn public trip links into a strong acquisition and collaboration loop.

Functional work:

- Browser-test public share pages from a logged-out recipient perspective.
- Verify friend feedback states:
  - Empty
  - One reaction
  - Many reactions
  - Long comment
  - Mixed sentiment
  - Duplicate names
  - Failed submit
- Verify copy link, native share, fallback share, and social metadata.
- Confirm feedback can influence trip planning or is clearly positioned as review input.
- Verify "Start your own trip" conversion path.

Visual QA work:

- Make public pages feel complete and valuable without account context.
- Improve first viewport hierarchy for shared trips.
- Make feedback lightweight, social, and fast.
- Ensure social preview metadata is trip-specific and brand-consistent.

Automation work:

- Expand `qa:share` to support multiple known public slugs. Completed for `QA_SHARE_SLUGS`; keep adding stable public itinerary slugs as they are created.
- Add metadata checks for Open Graph, Twitter, title, and description.
- Add feedback API and page-render checks for recipient flows.

Exit criteria:

- Public share pages are useful to a logged-out friend.
- Feedback submission is visibly confirmed and resilient.
- Shared trip pages create a credible reason for recipients to start their own trip.

## Month 5: Paid Product And Account Readiness

Objective: make subscription value clear and billing operations safe.

Functional work:

- Browser-test pricing, upgrade, checkout start, billing portal start, return URLs, and failure states.
- Verify free-plan limits for:
  - Saved trips
  - AI messages
  - Sharing
  - Notes or journal
  - Premium planning actions
- Verify subscription states:
  - No subscription
  - Active subscription
  - Trialing
  - Past due
  - Canceled
  - Portal unavailable
  - Checkout unavailable
- Confirm paid prompts never trap or erase user work.

Visual QA work:

- Clarify Explorer versus Adventurer value.
- Improve upgrade moments so they feel helpful, not punitive.
- Keep account and billing pages calm, readable, and commercially credible.

Automation work:

- Add Stripe test-mode smoke coverage where possible.
- Add billing config checks to `qa:commercial` or a dedicated billing QA script.
- Keep webhook readiness documented in the operations runbook.

Exit criteria:

- A user understands what is free, what is paid, and why to upgrade.
- Checkout and portal paths are safe and recoverable.
- Subscription state cannot silently drift into confusing UI.

## Month 6: Launch Candidate And Scale Readiness

Objective: make release operations repeatable and production quality visible.

Functional work:

- Run every core journey against production or a production-equivalent preview.
- Verify launch candidate from clean browser state:
  - First-time guest
  - Returning saved user
  - Logged-out public recipient
  - Paid-account candidate
  - Error/recovery scenarios
- Confirm support/debug paths for planner, maps, Supabase, Stripe, public share, and deployment failures.

Visual QA work:

- Final full-site polish pass.
- Final accessibility and keyboard pass.
- Final copy pass for all empty, loading, success, and error states.
- Final mobile and tablet sweep across all major surfaces.

Automation work:

- Production smoke must pass after deploy.
- Production ops health must pass.
- Production public share QA must pass.
- Release memo must include exact commands, URLs, deployment ID, and Browser evidence.

Exit criteria:

- No P0 or P1 release issue remains.
- All release commands pass locally and in production-equivalent context.
- Production deploy is live, verified, and rollback-ready.
- Launch decision can be made from recorded evidence.

## Cross-Cutting Test Matrix

| Area | Must Verify | Evidence |
| --- | --- | --- |
| First-time planning | Landing to guest planning to Trip Studio | Browser notes plus QA fixture |
| Auth and guest access | Guest, login, signup, signout, redirects | Browser notes plus route smoke |
| Planner | Prompt suite, progress, errors, trip handoff | Structured QA report |
| Maps | Stop count, day count, country consistency, route state | `qa:share` and prompt-suite report |
| Trip Studio | Edit, delete, reorder, swap, optimize, rewrite, save, share | Browser journey log |
| Saved | Trips, journal, reopen, delete safety, empty states | Browser route sweep |
| Public sharing | Logged-out render, feedback, copy/share, recipient CTA | `qa:share` plus Browser notes |
| Account | Profile, settings, billing, limits, portal errors | `qa:commercial` plus Browser notes |
| Paid product | Pricing, checkout, portal, webhooks, subscription state | Stripe test-mode evidence |
| Responsive UI | 390, 768, 1024, 1280, 1440, 1728 widths | Screenshot or DOM evidence |
| Accessibility | Labels, landmarks, keyboard, focus, contrast | Audit notes |
| Operations | Health, deployment metadata, rollback, smoke | `qa:ops` and runbook |

## Severity Rules

- P0: prevents a core journey from completing, corrupts user work, exposes sensitive data, or breaks production deploy.
- P1: makes a core journey confusing, untrustworthy, inaccessible, or commercially unacceptable.
- P2: creates friction with a workaround.
- P3: polish issue that does not block completion.

Release rule:

- P0 and P1 issues must be fixed or explicitly deferred with owner approval before launch.
- P2 issues need a tracked owner and target month.
- P3 issues should be batched into polish passes.

## Browser QA Evidence Standard

For each important Browser test, record:

- Date
- URL
- Viewport
- User type
- Starting state
- Actions taken
- Result
- Findings by severity
- Fix commit if applicable
- Retest result

Minimum Browser user types:

- First-time guest
- Returning signed-in user
- Logged-out share recipient
- Paid-plan candidate
- Error/retry user

Minimum Browser viewports:

- 390 x 844
- 768 x 1024
- 1280 x 800
- 1440 x 950
- 1728 x 1050

## Design QA Standard

Every major surface must pass these gates:

- Critique: hierarchy, cognitive load, emotional journey, discoverability, microcopy, and AI-slop detection.
- Audit: accessibility, performance, theming, responsiveness, and implementation anti-patterns.
- Normalize: token use, spacing, buttons, panels, states, and copy patterns.
- Harden: long text, slow APIs, auth failures, empty data, failed maps, failed share, and failed checkout.
- Polish: final rhythm, alignment, labels, motion restraint, contrast, and commercial finish.

Target monthly scores:

| Month | Audit Health | Design Health |
| --- | --- | --- |
| 1 | 14/20 | 26/40 |
| 2 | 16/20 | 28/40 |
| 3 | 17/20 | 30/40 |
| 4 | 18/20 | 32/40 |
| 5 | 18/20 | 32/40 |
| 6 | 19/20 | 34/40 |

## Release Candidate Gate

A release candidate is eligible only when:

- `git status --short --branch` is understood.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run qa:smoke` passes.
- `npm run qa:commercial` passes.
- `npm run qa:ops` passes.
- `QA_SHARE_SLUG=<known-public-slug> npm run qa:share` passes.
- Browser route sweep passes for core routes.
- At least one private Trip Studio URL is verified.
- At least one public share URL is verified.
- Vercel deploy is ready.
- Production smoke passes.
- Production ops health passes.
- Release memo records evidence, deployment URL, deployment ID, and remaining risk.

## Immediate Next Moves

1. Resolve or escalate the Vercel queued-deployment blocker so `/api/health` is live in production.
2. Run production `qa:ops` once the live alias serves `/api/health`.
3. Expand public-share QA from one Athens slug to multiple known itinerary slugs.
4. Build the planner prompt-suite runner and include Athens five-day as a required fixture.
5. Run a full Browser Trip Studio action audit and convert repeatable issues into automated checks.
6. Run the first monthly critique and audit scorecard across landing, chat, Trip Studio, saved, public share, and account/billing.
7. Prioritize fixes by P0/P1 first, then design-system consistency and commercial polish.

## Definition Of Full Completion

The active goal is complete only when:

- Every core flow has Browser evidence from a realistic user perspective.
- Every known itinerary and prompt fixture has map-trust evidence.
- All launch-critical surfaces pass responsive visual QA.
- All P0 and P1 issues are fixed and retested.
- Lint, build, smoke, commercial, ops, and share QA pass.
- Production deployment is live and verified.
- The app has a clear viral sharing loop and safe paid-product path.
- The release memo contains enough evidence for an owner to make a launch decision confidently.
