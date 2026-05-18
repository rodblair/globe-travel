# Globe.travel Platform QA And Completion Plan

Date: 2026-05-17
Horizon: next several months
Status: Active execution plan, refreshed 2026-05-18
Active goal: Complete full-platform functionality testing, Browser-driven user journey QA, visual QA, design-system polish, reliability hardening, viral sharing loops, subscription readiness, and release operations until Globe.travel is commercially launch-ready.

## Purpose

This plan turns the platform-readiness goal into a practical operating cadence. It is the working plan for completing Globe.travel as a reliable, polished, useful travel-planning platform.

The release target is not just "the app builds." The target is that a first-time user can plan, edit, map, save, share, and invite feedback on a trip without confusion, while the product feels commercially credible enough to charge for and memorable enough to spread through shared trip links.

## Current Baseline

Already established:

- Six-month roadmap: `PLATFORM_READINESS_ROADMAP.md`
- Next several-month execution roadmap: `PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md`
- Release evidence log: `RELEASE_READINESS_MEMO.md`
- Operations runbook: `OPERATIONS_RUNBOOK.md`
- Local QA commands: `npm run lint`, `npm run build`, `npm run qa:smoke`, `npm run qa:a11y`, `npm run qa:commercial`, `npm run qa:ops`, `npm run qa:share`
- Trip Studio QA command: `QA_TRIP_ID=<owned-trip-id> QA_SHARE_SLUG=<public-share-slug> npm run qa:studio`
- Mutation-safe Trip Studio action QA command: `npm run qa:studio-actions`
- Browser route-sweep evidence for core local surfaces
- Public-share QA for the Athens five-day itinerary
- Local and production operations health endpoint and ops smoke test

Known release blocker:

- No current P0/P1 operations blocker. Production `/api/health` is live on `https://globe-travel-two.vercel.app`, reports `status: "ok"`, and currently has `summary.criticalMissing: 0` and `summary.warningMissing: 0`.

## Active Goal Confirmation

This is the active multi-month goal for the workstream. It stays open until Globe.travel has complete Browser evidence, functional QA, visual QA, map trust, sharing, account, billing, production, and release-operation evidence.

The plan should be treated as an execution board, not a one-time memo:

- Every Browser finding must either become a fix, an automated regression check, or a tracked deferred issue.
- Every visual polish pass must be checked on real responsive routes, not only by component inspection.
- Every production deployment must be verified with local gates, production smoke, production ops health, and a written release log.
- The goal is not considered complete while any P0/P1 launch issue remains open.

## Current Command Center

This is the next several months of work expressed as a release program. It is intentionally sequenced so the product gets more usable every week while the testing system gets stronger with every real Browser finding.

| Timeframe | Primary outcome | Product focus | QA focus | Release decision |
| --- | --- | --- | --- | --- |
| Month 1 | Baseline confidence | First-time planning, saved/account, public share, Trip Studio basics | Browser route sweeps, responsive baselines, lint/build, smoke/commercial/ops/share gates | Internal release candidate only if no P0/P1 remains |
| Month 2 | Planner and map trust | Reliable trip generation, mapped stops, route truth, recovery paths | 50+ prompt suite, country checks, map-stop and route validation | Promote prompt/map gates into every release candidate |
| Month 3 | Trip Studio completion | Edit, reorder, delete, swap, optimize, rewrite, build maps, save, share | Browser action coverage plus mutation-safe regression scripts | Trip Studio becomes launch-grade only when every owner action is verified |
| Month 4 | Sharing and viral loop | Logged-out public pages, friend feedback, recipient CTA, social metadata | Multi-itinerary share fixtures, feedback API/page gates, mobile recipient sweeps | Public share becomes a growth surface, not just a read-only artifact |
| Month 5 | Paid product readiness | Pricing, upgrade moments, Stripe checkout, portal, subscription states | Billing smoke, Stripe test-mode evidence, account/error-state Browser sweeps | Paid path is launchable only if users cannot lose work or hit confusing traps |
| Month 6 | Launch candidate and scale | Production release, rollback readiness, monitoring, final polish | Full local plus production matrix, final accessibility/keyboard/copy pass | Owner can make a launch decision from evidence, not vibes |

The near-term operating focus is:

- Convert every repeatable Browser finding into an automated gate or tracked issue.
- Keep the known Athens five-day itinerary as the stable production baseline while adding disposable Lisbon, Kyoto, and Mexico City fixture coverage locally.
- Keep owner-side feedback refresh in the release gate. Public reactions now have an automated Trip Studio feed check and Browser evidence proving the owner feedback refresh workflow completes from submitted friend feedback.
- Keep `npm run qa:visual` in the release-candidate path. The first Chrome-backed run produced screenshots and DOM geometry for 10 core routes across five viewports, including Mapbox-heavy Trip Studio and public-share pages; the follow-up compare run added pixel-diff thresholds for stable shell routes.
- Keep `npm run qa:a11y` in the release-candidate path. The first accessibility/keyboard gate now covers landing, planner, saved, account, billing, auth, and public share at phone and desktop widths with serious/critical axe checks, skip-link/landmark checks, and early keyboard focus-path checks.
- Reduce Trip Studio/account operational density without hiding important actions.
- Broaden recovery-state hardening for planner, maps, share, billing, and auth failures.

## Next 90-Day Focus

### Days 1-14: Close Current Trip Studio And Visual QA Gaps

- Finish true Browser click/type Trip Studio coverage for owner controls:
  - Day switching
  - Item edit
  - Save state
  - Share state
  - Public-link handoff
  - Read-only public behavior
- Keep `npm run qa:studio-actions` as the mutation-safe API regression layer.
- Add evidence for the Browser-owned fixture path and clean every disposable fixture after use.
- Run a full responsive visual sweep on landing, chat, Trip Studio, saved, account, billing, auth, and public share at 390, 768, 1280, 1440, and 1728 widths.
- Fix any overlap, clipped copy, unreadable controls, weak hierarchy, stale copy, missing labels, or broken loading/error states found in the sweep.

### Days 15-30: Automate Regressions From Real Browser Findings

- Promote repeated Browser findings into QA scripts or fixtures.
- Expand stable itinerary coverage beyond Athens five-day:
  - At least three public share slugs
  - At least three private saved-trip fixtures
  - At least one guest-created fixture
  - At least one signed-in owner fixture
- Add screenshot or DOM-summary baselines for the most fragile surfaces:
  - Trip Studio mobile
  - Public share mobile
  - Account billing
  - Planner loading and handoff
- Re-run critique, audit, normalize, harden, and polish gates on the six core surfaces.

### Days 31-60: Collaboration, Sharing, And Commercial Readiness

- Make public share pages valuable enough for recipients who have never seen Globe.travel.
- Browser-test friend feedback with empty, single, many, long-comment, duplicate-name, and failure states.
- Verify copy link, native share, fallback share, and social metadata.
- Connect friend feedback clearly to the owner planning workflow or explain it as review input.
- Complete pricing, upgrade, checkout-start, billing portal, return URL, subscription-status, and billing-error QA.
- Add Stripe test-mode evidence where credentials and environment allow it.

### Days 61-90: Launch Candidate Discipline

- Run the complete platform matrix against local, preview, and production where appropriate.
- Freeze the release candidate only when lint, build, smoke, commercial, ops, share, prompt-suite, studio, and Browser route sweeps pass.
- Perform final mobile/tablet/desktop visual QA and keyboard/accessibility pass.
- Verify Vercel production deployment, aliases, health endpoint, rollback path, and release memo evidence.
- Publish only when all P0/P1 issues are closed and every remaining P2 has an owner and target month.

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
  - `npm run qa:a11y`
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
- `npm run qa:planner-handoff` passes.
- `QA_TRIP_ID=<owned-trip-id> QA_SHARE_SLUG=<known-public-slug> npm run qa:visual` passes.
- `QA_VISUAL_BASELINE_DIR=<baseline-dir> QA_VISUAL_RUN_ID=<run-id> QA_SHARE_SLUG=<known-public-slug> npm run qa:visual` passes for stable visual-diff routes.
- `QA_SHARE_SLUG=<known-public-slug> npm run qa:share-feedback` passes.
- `QA_SHARE_SLUG=<known-public-slug> npm run qa:share` passes.
- Browser route sweep passes for core routes.
- At least one private Trip Studio URL is verified.
- At least one public share URL is verified.
- Vercel deploy is ready.
- `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=<known-public-slug> npm run qa:release-production` passes after deploy.
- Production smoke passes.
- Production ops health passes.
- Release memo records evidence, deployment URL, deployment ID, and remaining risk.

## Immediate Next Moves

1. Continue the Browser Trip Studio action audit into broader mobile-width owner-control coverage and durable screenshot artifacts. Browser-level apply-swap, Build maps success/failure, Rewrite day success/unavailable, mobile explicit reorder controls, direct drag reorder, responsive geometry baselines, planner handoff geometry, and API-level deterministic swap/build-map coverage are now covered.
2. Decide whether generated public-share fixture coverage belongs in every release candidate run or a scheduled weekly QA run. The stable Athens five-day slug is covered, and deterministic Lisbon, Kyoto, and Mexico City public-share fixtures now validate country consistency, day coverage, route coverage, metadata, feedback API, and mobile recipient CTA checks.
3. Keep expanding durable visual regression. `npm run qa:visual` now captures Chrome screenshots and layout geometry for landing, planner, saved, account, auth, public share, and Trip Studio at `390`, `768`, `1280`, `1440`, and `1728` widths. Stable shell routes also support pixel-diff comparison against a saved baseline.
4. Continue from the first monthly critique/audit scorecard. Month 1 targets are met (`16/20` audit health, `31/40` design health), the public feedback loop now has mutation-safe public and owner-side gates, durable responsive visual screenshots and stable-route visual diffs exist, and the remaining P2 work is deeper Trip Studio/account density, production scheduling for visual diffs, slow-network recovery hardening, and production release rehearsal. The Mapbox control policy is now implemented for actionable controls and verified by the focused map visual gate. Trip Studio owner recovery states now have a repeatable `npm run qa:studio-recovery` gate, billing recovery has `npm run qa:billing-recovery`, public-share recovery has `npm run qa:share-recovery`, and ops monitoring has a stronger `npm run qa:ops` contract.
5. Promote repeated Browser visual findings into automated checks where practical.
6. Prioritize fixes by P0/P1 first, then design-system consistency, then commercial polish.
7. Use `PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md` as the month-by-month operating roadmap for the active goal.

## Next Four Execution Sprints

These are the next focused passes to run before another release candidate decision.

### Sprint 1: Owner Feedback And Share Loop Closure

- Status: completed for the local release-readiness path on 2026-05-18.
- Evidence: `qa/owner-feedback-refresh-2026-05-18.md`.
- Automated coverage: `QA_SHARE_SLUG=<slug> QA_TRIP_ID=<trip-id> QA_VERIFY_TRIP_FEEDBACK=1 npm run qa:share-feedback`.
- Browser coverage: owner Trip Studio shows submitted friend feedback, readiness updates to `crew reacting`, and `Refresh plan from feedback` completes with a feedback-driven planner result.
- Social preview evidence: `qa/public-share-social-preview-2026-05-18.md`.
- Viral metadata coverage: `QA_SHARE_SLUG=<known-public-slug> npm run qa:share` checks itinerary API integrity, mapped stop/route integrity, public metadata, feedback API readability, and generated share-card image rendering.
- Remaining follow-up: include this gate in release-candidate runs for disposable fixtures or a stable owned fixture.

### Sprint 2: Visual Evidence And Responsive Polish

- Status: completed for the first local baseline on 2026-05-18.
- Evidence: `qa/visual-baseline-2026-05-18/README.md` and `qa/visual-baseline-2026-05-18/screenshots/`.
- Automated coverage: `QA_TRIP_ID=<owned-trip-id> QA_SHARE_SLUG=<known-public-slug> npm run qa:visual`.
- Coverage: landing, planner, saved trips, saved trip notes, account profile, account billing, login, signup, public share, and Trip Studio at `390`, `768`, `1280`, `1440`, and `1728` widths.
- Result: first passing run checked `50/50` route-viewport combinations with no horizontal overflow, no app-owned small targets, required markers present, and screenshots captured.
- Visual diff result: stable-route compare checked `45/45` route-viewport combinations against `qa/visual-baseline-2026-05-18`; `30` stable shell screenshots were pixel-compared under a `1.5%` threshold, while dynamic user-data routes retained layout and screenshot checks.
- Fix made during the sprint: desktop auth-panel brand link now has a `44px` touch target.
- Mapbox control policy follow-up: actionable Mapbox controls now use app-scale `46px` targets and are measured as `Small Map Controls` in `npm run qa:visual`; attribution/legal links remain compact and are excluded from the actionable-control gate.
- Recovery-state result: `npm run qa:studio-recovery` now covers forced Trip Studio optimize/share/workflow failures, inline delete confirmation, owner controls, and horizontal overflow. The first gate passed `6/6`, and the follow-up Trip Studio visual sweep passed `5/5` viewports after fixing the laptop readiness-panel overlap.
- Billing recovery result: `npm run qa:billing-recovery` now covers forced checkout failure recovery, checkout-cancel return, checkout-success return copy, billing visibility, and horizontal overflow. The first gate passed `5/5`, and the focused account-billing visual sweep passed `5/5` viewports.
- Public-share recovery result: `npm run qa:share-recovery` now covers forced recipient feedback failure, recipient surface visibility, and mobile overflow. The first gate passed `3/3`, while `qa:share`, `qa:share-feedback`, and the focused public-share visual sweep passed `4/4`, `5/5`, and `5/5`.
- Ops monitoring result: `npm run qa:ops` now verifies health readiness, no-store cache behavior, parseable `checkedAt`, expected check roster, and deployment metadata policy. The first strengthened gate passed `3/3`.
- Production release result: `npm run qa:release-production` now bundles the read-only post-deploy ops, smoke, commercial, share, production prompt-actuals, and prompt-suite-with-actuals checks.
- Production monitoring result: `.github/workflows/production-release-gate.yml` now runs the production release gate every 6 hours and supports manual dispatch with configurable base URL/share slug.
- Production visual monitoring result: `.github/workflows/production-visual-gate.yml` now runs daily/manual production visual checks for public routes, pixel-compares stable public shells, and uploads screenshot/diff artifacts.
- Remaining follow-up: extend visual automation to authenticated preview fixtures and keep expanding slow-network recovery.

### Sprint 3: Planner And Map Trust Expansion

- Status: completed for ten local public-itinerary actuals on 2026-05-18.
- Evidence: `qa/planner-map-trust-expanded-2026-05-18.md`.
- Actuals artifact: `qa/planner-map-trust-expanded-2026-05-18-actuals.json`.
- Coverage: Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin prompt-suite IDs.
- Automated coverage:
  - `npm run qa:share-fixtures` now creates ten prompt-suite-mapped public itinerary fixtures and emits `promptSuiteShareMap`.
  - `QA_SHARE_SLUGS=<ten-disposable-slugs> npm run qa:share` passed `40/40`.
  - `QA_PROMPT_SUITE_SHARE_MAP=<ten-id-to-slug-map> npm run qa:prompt-actuals` exported ten actuals.
  - `QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-expanded-2026-05-18-actuals.json npm run qa:prompt-suite` passed `52/52` with `actualsChecked: 10`.
- Browser coverage: disposable Mexico City public share showed all four expected days, recipient CTA, no horizontal overflow, and `46 x 46` Mapbox zoom controls before cleanup.
- Cleanup: ten disposable trips and sixty-two QA places were deleted.
- Remaining follow-up: add live AI-generated sampling for more prompts once API budget/model behavior is stable; this pass proves the actuals path and public itinerary map-trust contract across ten launch-relevant outputs.

### Sprint 4: Commercial And Release Gate Hardening

- Status: next active execution slice.
- Browser-test pricing, upgrade, checkout-start, billing portal, return URLs, and safe failure states.
- Verify unauthenticated, guest, signed-in free, paid-candidate, and logged-out recipient paths.
- Finish public share social preview evidence integration and keep share-card image rendering in the release gate.
- Run `lint`, `build`, `qa:smoke`, `qa:commercial`, `qa:ops`, `qa:planner-handoff`, `qa:share-feedback`, `qa:share`, and post-deploy `qa:release-production`.
- Deploy only after the release memo has exact command output, URLs, deployment ID, and remaining risk.
- Evidence target: `qa/release-candidate-gate-YYYY-MM-DD.md`.

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
