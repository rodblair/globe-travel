# Globe.travel Next Several Months Platform Completion Plan

Date: 2026-05-18
Status: Active goal execution plan
Owner: Codex platform QA and release audit

## Active Goal

Complete the next several months of Globe.travel platform readiness: full-platform functionality testing, Browser-driven user journey QA, visual QA across responsive surfaces, design-system polish, reliability hardening, production monitoring, viral sharing loops, subscription readiness, and release operations until the platform is commercially launch-ready at scale.

This goal stays active until the full platform is proven launch-ready with evidence. It is not complete just because a feature works once, a build passes once, or a route looks good in one viewport.

## Product Quality Bar

Globe.travel should become a commercially credible group-trip planning app where a first-time user can:

- Describe a trip naturally.
- Receive a usable itinerary with truthful maps.
- Review and edit each day in Trip Studio.
- Save, reopen, and manage plans.
- Share a public trip link with friends.
- Collect feedback and use it to improve the plan.
- Understand account, billing, and upgrade states.
- Trust the app on phone, tablet, laptop, and desktop.

The UI should feel refined, intentional, social, calm, and editorial. The experience should avoid clutter, repeated panels, vague AI-travel copy, weak contrast, tiny controls, overlapping layout, and generic AI-app visual patterns.

## Operating Method

Every work cycle follows this loop:

1. Test like a real first-time user in Browser.
2. Record the exact route, viewport, user type, action, result, and severity.
3. Fix the highest-impact P0/P1 issue first.
4. Retest the exact failed Browser path.
5. Convert repeatable findings into automated QA where practical.
6. Run the relevant local gates.
7. Update the release evidence log.
8. Commit, push, and deploy only after verification.

## Severity Rules

- P0: blocks a core journey, corrupts user work, breaks production, or exposes sensitive data.
- P1: makes a core journey confusing, inaccessible, untrustworthy, or commercially unacceptable.
- P2: creates friction but has a workaround.
- P3: polish issue with no direct completion risk.

Release is not allowed with open P0 or P1 issues. P2 issues need owner, target month, and accepted risk.

## Month 1: Stabilize The Current Product

Outcome: Globe.travel has a reliable baseline across the current web app and every major surface has Browser evidence.

Primary surfaces:

- Landing
- Planner/chat
- Guest trip creation
- Trip Studio
- Saved trips
- Saved journal
- Public share
- Account/profile
- Billing/subscription
- Login/signup

Functionality testing:

- Verify first-time guest planning from landing to Trip Studio.
- Verify `/chat?q=...` handoff with natural trip prompts.
- Verify Athens five-day and all saved itineraries day by day.
- Verify maps match itinerary stops and stay in the expected country.
- Verify Trip Studio owner actions: day switch, edit, delete, reorder, direct drag, swap, optimize, rewrite, build maps, save, share, public link.
- Verify logged-out public share pages load without auth.
- Verify friend feedback submit, readback, owner readback, and feedback refresh.
- Verify saved trips, saved journal, empty states, and reopen paths.
- Verify account and billing recovery states when Stripe flows are unavailable.

Visual QA:

- Sweep every primary surface at 390, 768, 1280, 1440, and 1728 widths.
- Remove horizontal overflow, clipped copy, panel overlap, awkward wrapping, and hidden critical controls.
- Confirm app-owned controls meet the 44px mobile target.
- Confirm actionable Mapbox controls meet the app target while attribution/legal links remain acceptable.
- Normalize repeated action bars, button hierarchy, spacing rhythm, and copy labels.

Automation:

- Keep these gates green from `client/`:
  - `npm run lint`
  - `npm run build`
  - `npm run qa:smoke`
  - `npm run qa:a11y`
  - `npm run qa:commercial`
  - `npm run qa:ops`
  - `npm run qa:planner-handoff`
  - `npm run qa:studio-actions`
  - `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share`
  - `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback`
  - `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recovery`

Exit gate:

- No open P0/P1 on current web surfaces.
- Month 1 audit score remains at or above 16/20.
- Month 1 design score remains at or above 31/40.
- Release memo contains current Browser evidence and command results.

## Month 2: Planner And Map Trust

Outcome: generated itineraries are geographically trustworthy, explainable, and recoverable.

Functionality testing:

- Expand the prompt suite beyond static fixtures into repeated local and production-like runs.
- Cover at least 50 prompts across cities, trip lengths, budgets, seasons, friend groups, families, couples, premium trips, and budget trips.
- Keep Athens five-day as the stable production reference.
- Add recurring local actuals for Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin.
- Verify day count, stop count, route count, mapped place count, and country consistency.
- Test planner failure, slow response, partial itinerary, empty day, unmapped stop, wrong-country geocode, and map-build failure states.

Visual QA:

- Make planner progress states calm and explicit.
- Keep map and itinerary context visibly connected.
- Make partial-map and fallback states honest, not overconfident.
- Remove any copy that implies route certainty when data is missing.

Automation:

- Promote generated actuals into prompt-suite reporting.
- Keep `qa:share-fixtures`, `qa:prompt-actuals`, and `qa:prompt-suite` in the weekly gate.
- Store structured map-trust reports in `qa/`.

Exit gate:

- Wrong-country pins are blocked, repaired, or visibly flagged.
- No new trip lands in a confusing zero-stop state without recovery.
- At least ten real generated/public-share actuals pass map trust checks.

## Month 3: Trip Studio Completion

Outcome: Trip Studio is the strongest and most trustworthy surface in the product.

Functionality testing:

- Browser-test the complete owner workflow on disposable fixtures.
- Verify every Trip Studio async action has loading, success, failure, and retry behavior.
- Verify every itinerary mutation persists after reload.
- Verify read-only public state cannot be confused with owner edit mode.
- Verify map selection and itinerary selection remain connected.
- Verify mobile owner controls remain reachable without drawers covering important actions.

Visual QA:

- Reduce operational density without hiding power.
- Make the day tabs, map, itinerary list, and readiness panel feel like one product surface.
- Improve hierarchy between primary actions, secondary actions, and destructive actions.
- Keep long titles, long place names, long notes, and many days from breaking layout.

Automation:

- Expand `qa:studio-actions`, `qa:studio`, `qa:studio-recovery`, and `qa:visual` around every repeated Browser finding.
- Add evidence files for each Trip Studio pass.

Exit gate:

- All owner actions complete or fail with clear recovery.
- Mutation-safe tests and Browser tests agree.
- Trip Studio passes responsive visual QA across phone, tablet, laptop, desktop, and wide desktop.

## Month 4: Sharing, Feedback, And Viral Loops

Outcome: public trip links become a real growth surface instead of a passive read-only page.

Functionality testing:

- Test logged-out recipients from a clean browser state.
- Verify public share pages for multiple itineraries, not only Athens.
- Verify feedback states: empty, one reaction, many reactions, long comment, mixed sentiment, duplicate name, invalid form, network failure, and retry.
- Verify copy link, native share, fallback share, social preview image, Open Graph metadata, Twitter metadata, and recipient CTA.
- Verify owner-side feedback readback and planning refresh.

Visual QA:

- Make the first viewport of public shares immediately understandable.
- Make feedback feel lightweight, social, and low-friction.
- Keep the public page useful even if the recipient never creates an account.
- Make generated social preview cards trip-specific, readable, and brand-consistent.

Automation:

- Keep `QA_SHARE_SLUGS=<slugs> npm run qa:share` in fixture runs.
- Keep public feedback and owner feedback gates in release-candidate runs.
- Add share-card image checks to public share QA.

Exit gate:

- Public share pages work without auth.
- Social previews render with trip-specific images and metadata.
- Recipient feedback improves the owner workflow or is clearly positioned as review input.

## Month 5: Paid Product And Account Readiness

Outcome: paid value is clear and subscription operations are safe.

Functionality testing:

- Test pricing, upgrade, checkout start, checkout return, billing portal, portal failure, subscription status, and sign-in-required states.
- Verify free limits for saved trips, AI messages, sharing, notes/journal, and premium planning actions.
- Verify active, trialing, canceled, past-due, no-subscription, checkout-unavailable, and portal-unavailable states.
- Verify paid prompts never erase work or trap users.

Visual QA:

- Clarify the value difference between free and paid tiers.
- Make upgrade moments helpful instead of punitive.
- Keep account and billing surfaces calm, readable, and commercially credible.
- Remove any dead-end billing copy or ambiguous recovery state.

Automation:

- Expand `qa:commercial` and `qa:billing-recovery`.
- Add Stripe test-mode evidence when credentials allow.
- Keep billing health and webhook expectations documented in `OPERATIONS_RUNBOOK.md`.

Exit gate:

- A user understands what is free, what is paid, and why to upgrade.
- Checkout and portal paths are recoverable.
- Subscription state cannot silently drift into confusing UI.

## Month 6: Launch Candidate And Production Scale

Outcome: the owner can make a launch decision from evidence, not vibes.

Functionality testing:

- Run every core journey locally and against production or a production-equivalent preview.
- Test clean-browser first-time guest, returning user, logged-out recipient, paid candidate, and failure/retry user.
- Verify production health, deployment metadata, rollback path, environment configuration, and public URL metadata.
- Verify production public share, ops, smoke, commercial, and health gates.

Visual QA:

- Run final full-site polish.
- Run final accessibility and keyboard pass.
- Run final mobile/tablet/desktop visual baselines and visual diffs.
- Run final copy pass for empty, loading, success, and error states.

Automation:

- Release candidate command set:
  - `npm run lint`
  - `npm run build`
  - `npm run qa:smoke`
  - `npm run qa:a11y`
  - `npm run qa:commercial`
  - `npm run qa:ops`
  - `npm run qa:planner-handoff`
  - `npm run qa:studio-actions`
  - `npm run qa:studio-recovery`
  - `npm run qa:billing-recovery`
  - `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share`
  - `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback`
  - `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recovery`
  - `QA_TRIP_ID=<owned-trip-id> QA_SHARE_SLUG=<known-public-slug> npm run qa:visual`
  - `QA_VISUAL_BASELINE_DIR=<baseline-dir> QA_VISUAL_RUN_ID=<run-id> QA_SHARE_SLUG=<known-public-slug> npm run qa:visual`
  - `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production`

Exit gate:

- No P0/P1 issues remain.
- Local release-candidate gates pass.
- Production deployment is verified.
- Release memo includes command output, production URL, deployment ID, Browser evidence, remaining risks, and rollback notes.

## Weekly Cadence

Every week during active build:

- Pick one primary journey and one supporting surface.
- Run Browser at phone and desktop widths before editing.
- Fix P0/P1 findings immediately.
- Convert one repeatable finding into a regression gate.
- Run the relevant QA command set.
- Update `RELEASE_READINESS_MEMO.md`.
- Update screenshots or evidence in `qa/`.

## Monthly Score Targets

| Month | Audit Health Target | Design Health Target | Meaning |
| --- | ---: | ---: | --- |
| 1 | 16/20 | 31/40 | Current product stabilized |
| 2 | 17/20 | 32/40 | Planner/map trust improved |
| 3 | 18/20 | 33/40 | Trip Studio launch-grade |
| 4 | 18/20 | 34/40 | Sharing loop commercially polished |
| 5 | 19/20 | 34/40 | Paid product safe and clear |
| 6 | 19/20 | 35/40 | Launch candidate ready |

## Evidence Artifacts To Maintain

- `RELEASE_READINESS_MEMO.md`: release evidence and current state.
- `PLATFORM_QA_COMPLETION_PLAN.md`: operating plan and release gates.
- `PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md`: month-by-month execution roadmap.
- `OPERATIONS_RUNBOOK.md`: deployment, health, incident, rollback, and monitoring procedures.
- `qa/`: Browser evidence, visual baselines, prompt-suite actuals, public share evidence, recovery-state reports, and release-candidate reports.

## Immediate Next Execution Slice

The next execution slice should focus on commercial release-gate hardening:

1. Finish the share-card/social preview evidence integration.
2. Re-run public share QA for Athens five-day.
3. Run billing recovery, commercial, ops, planner-handoff, and studio recovery gates.
4. Run lint and build.
5. Run a Browser route sweep for public share, account billing, planner, and Trip Studio.
6. Update `RELEASE_READINESS_MEMO.md` with exact command evidence.
7. Only then decide whether to commit, push, and send to Vercel.

## Completion Definition

This active goal is complete only when Globe.travel has:

- Browser evidence for every core journey.
- Functional QA for planner, Trip Studio, saved, public share, account, billing, and production ops.
- Visual QA evidence across phone, tablet, laptop, desktop, and wide desktop.
- Accessibility and keyboard evidence.
- Map-trust evidence for known itineraries and generated prompt actuals.
- Working viral sharing loops with public feedback and social previews.
- Safe paid-product and subscription paths.
- Green lint, build, smoke, commercial, ops, share, visual, and recovery gates.
- Verified Vercel production deployment and rollback readiness.
- No open P0/P1 launch issues.
