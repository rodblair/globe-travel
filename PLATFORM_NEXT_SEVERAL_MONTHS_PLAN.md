# Globe.travel Next Several Months Platform Completion Plan

Date: 2026-05-18
Status: Active goal execution plan
Owner: Codex platform QA and release audit
Updated: 2026-05-18 active multi-month plan refreshed

## Active Goal

Complete the next several months of Globe.travel platform readiness: full-platform functionality testing, Browser-driven user journey QA, visual QA across responsive surfaces, design-system polish, reliability hardening, production monitoring, viral sharing loops, subscription readiness, and release operations until the platform is commercially launch-ready at scale.

This goal stays active until the full platform is proven launch-ready with evidence. It is not complete just because a feature works once, a build passes once, or a route looks good in one viewport.

## Current Checkpoint

The active goal is pinned and remains open. The previous full release-candidate blocker is closed: saved trip open/delete hit targets are separated, long Trip Studio titles wrap cleanly, the full local predeploy gate passed `23/23`, production deployed, and the production release gate passed.

The current reliability upgrade is that public production visual QA and public share viral-loop QA are now part of the one-command production release gate. `npm run qa:release-production` checks public production layout for landing, login, signup, and public share, verifies recipient share/copy/start-own-trip affordances on the stable Athens public itinerary, pixel-compares stable shell routes against the production visual baseline, and still runs production ops, smoke, auth/guest, commercial, public share/social preview, prompt actuals, and prompt-suite checks.

The newest commercial-readiness checkpoint closes a paid-path polish gap in the saved journal limit flow: the upgrade modal now has accessible dialog semantics, shows recoverable checkout errors, and no longer advertises a `coming soon` feature as paid value. `npm run qa:billing-recovery` now covers that modal through a development-only QA path.

The newest public-share checkpoint closes a recipient feedback validation gap: optional email is validated before submission with clear recovery copy, the public feedback textarea now enforces the API's 600-character limit, and `npm run qa:share-recovery` covers invalid optional email plus forced feedback failure recovery.

The newest saved/account checkpoint closes a journal keyboard accessibility gap: saved note editor, reader, and delete-confirmation modals now expose dialog semantics, keep focus inside while open, close with Escape, and are covered by `npm run qa:saved-account`.

The newest planner-start checkpoint strengthens first-time guest confidence: `npm run qa:planner-handoff` now proves Browser-style failed and delayed `/chat?q=...` starts on a phone viewport, including preserved prompts, visible retry, disabled duplicate-start controls, Trip Studio arrival, initial generation copy, and disposable cleanup.

The newest map-trust checkpoint makes degraded map rendering explicit: public share route cards can force the static fallback in development, label the fallback as `Static Route`, preserve recipient itinerary/feedback/CTA usability without Mapbox canvas, and are covered by `npm run qa:map-fallback` inside the local release-candidate gate.

The newest saved/account checkpoint closes a profile identity reliability gap: `PATCH /api/profile` now rejects invalid or overlong identity updates, the account form shows field limits and username rules, editable fields sync after profile refresh, and Browser verified invalid username recovery plus valid guest profile saving without overflow. `npm run qa:saved-account` now includes this regression and passed `13/13`.

The newest planner-start checkpoint closes a natural-language duration gap: Browser reproduced `Plan five days in Athens...` creating `4 Days in five days in Athens`; the shared planner parser now extracts word-based durations and clean destinations, Trip Studio opens as `5 Days in Athens` with five day tabs, and `npm run qa:planner-handoff` verifies the corrected Browser-style path.

The newest auth/guest checkpoint preserves work across the auth boundary: protected routes now redirect to login with a safe `next`, login/signup/guest actions preserve the destination, guest start can carry planner prompts through to Trip Studio, and `npm run qa:auth-access` covers the handoff.

The newest planner/map checkpoint hardens generated itinerary map trust. `npm run qa:planner-actuals` now creates a disposable guest and trip, sends a real Lisbon planner prompt through `/api/chat`, verifies mapped stops, country consistency, unique pins, usable routes, and cleanup, then exports the generated actual for prompt-suite cross-checking. `npm run qa:geocode-quality` adds strict destination-anchor and false-positive geocoder checks, and the local release-candidate gate now includes it. Browser also verified a kept generated public Lisbon share page with itinerary content, Mapbox canvas, map markers, share/copy actions, and no console errors before cleanup. Month 2 generated actual coverage now reaches ten cities: Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin. `npm run qa:planner-actuals:launch-cities` and `npm run qa:planner-actuals:next-cities` both pass, and the combined `qa/planner-generated-actuals-month2-cities-2026-05-18.json` artifact cross-checks in the prompt suite with `actualsChecked: 10`.

The newest Trip Studio checkpoint starts Month 3 owner-surface completion. A kept disposable owned Trip Studio fixture passed API owner actions `23/23`, Browser verified the direct/public state was clearly read-only instead of edit-capable, two visual collisions were removed from the owner workspace, `npm run qa:studio-recovery` passed `6/6`, and Trip Studio responsive visual QA passed `5/5` across phone, tablet, laptop, desktop, and wide viewports. Evidence: `qa/trip-studio-month3-owner-visual-qa-2026-05-19.md` and `qa/visual-baseline-2026-05-19-trip-studio-month3-owner/`.

Immediate release rule: keep `npm run qa:release-production` green after every production deploy. If public visual QA or public share viral-loop QA fails, treat it as a release blocker for acquisition, auth conversion, and viral share readiness.

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

## Active Goal Governance

This plan is the active operating goal for Globe.travel from May 18, 2026 forward. It should be treated as a living launch-readiness program, not a one-time audit. Each work slice must connect to one of the monthly outcomes below and leave behind enough evidence that another reviewer could reproduce the result.

Goal control rules:

- Keep the active goal open until the six-month completion definition is met.
- Prefer Browser-verified user journeys over code-only assumptions.
- Prefer fixing and retesting one real P0/P1 journey over collecting many low-confidence observations.
- Promote repeated manual findings into QA scripts or visual baselines.
- Update this plan only when the roadmap meaningfully changes.
- Update `RELEASE_READINESS_MEMO.md` after every verified fix, deployment, or release-blocking discovery.
- Do not ship production changes unless `npm run lint`, `npm run build`, and the relevant local and production QA gates pass.

## Next Six Months At A Glance

| Month | Outcome | Main Risk To Retire | Evidence Required |
| --- | --- | --- | --- |
| Month 1 | Current web product is stable and coherent | Core flows work only in happy paths or one viewport | Browser route sweep, responsive visual QA, lint/build, smoke, auth, saved/account, share, studio, commercial, ops |
| Month 2 | Planner and maps are trustworthy | Generated itineraries contain wrong duration, destination, route, or map confidence | Prompt actuals, map-trust reports, fallback-state QA, multi-city generated itinerary evidence |
| Month 3 | Trip Studio is launch-grade | Owner editing surface feels dense, fragile, or unclear | Complete owner workflow evidence, mutation persistence, recovery QA, Studio visual baseline |
| Month 4 | Public sharing becomes a growth loop | Shared pages are readable but not viral, social, or action-driving | Multi-slug share QA, feedback states, owner readback, social preview cards, recipient CTA evidence |
| Month 5 | Paid/account paths are safe | Upgrade and billing states are confusing or non-recoverable | Stripe readiness, billing recovery, subscription states, pricing/account UX audit |
| Month 6 | Launch candidate can be approved | Release decision relies on vibes instead of proof | Full release-candidate gate, production gate, rollback notes, no open P0/P1, launch signoff packet |

## Next 12-Week Execution Board

This is the near-term working plan for turning the active goal into shippable progress. Each week should produce evidence, fixes, and a clear pass/fail decision, not just observations.

| Week | Theme | User Lens | Must Test In Browser | Must Improve | Exit Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Trip Studio density and owner confidence | Returning organizer editing a real trip | Athens five-day owner view, mobile day switching, edit/delete/reorder/swap/save/share, map-stop connection | Reduce operational density, simplify repeated panels, clarify owner next action, protect mobile controls from overlap | Focused Trip Studio visual QA, studio action/recovery gates, release memo entry |
| 2 | Planner start-to-trip confidence | First-time guest with a natural trip idea | Landing to guest planner, `/chat?q=...`, slow planner, failed planner, generated trip handoff | Make planner progress and recovery calm, obvious, and reassuring | Planner handoff QA, slow-network QA, Browser route evidence |
| 3 | Map trust and itinerary truth | User deciding whether the plan is believable | Athens, Lisbon, Porto, Mexico City, Tokyo actuals; all day tabs; public map view | Flag or repair missing/wrong-country stops, make partial route states honest | Prompt actuals report, share QA, map-trust evidence; launch-city actuals for Lisbon, Porto, Mexico City, and Tokyo now passing |
| 4 | Saved/account usefulness | Returning user managing work | `/saved`, journal, empty states, reopen trip, delete safety, `/account`, `/account?tab=billing` | Reduce account/billing density, clarify saved/private/public states, improve empty and recovery copy | Saved/account visual sweep, commercial QA, billing recovery QA |
| 5 | Public share as a growth surface | Logged-out friend receiving a link | Public share mobile and desktop, feedback submit, copy/native share, start-own-trip CTA | Make first viewport instantly understandable, make feedback feel social and low friction | Multi-slug share QA, feedback readback QA, social preview evidence |
| 6 | Auth and guest edge cases | User moving between guest, signup, login, and saved state | Guest start, login, signup, protected routes, public routes, signout/reopen | Eliminate confusing redirects and preserve user work across auth transitions | Auth access QA, Browser auth notes, release memo entry |
| 7 | Paid path and subscription states | User deciding whether to upgrade | Pricing, upgrade prompts, checkout start/return, portal, trialing, active, canceled, past-due, failures | Make paid value clear and helpful, ensure no billing dead ends erase work | Stripe readiness, hosted checkout evidence, billing recovery QA |
| 8 | Accessibility and keyboard depth | Keyboard and assistive-tech user | Planner, Trip Studio, public share, account, billing, modals/drawers | Fix focus traps, weak labels, focus order, contrast, and unreachable controls | `qa:a11y`, keyboard Browser notes, focused fixes |
| 9 | Visual regression and responsive polish | User on phone, tablet, laptop, desktop, wide desktop | All primary routes at 390, 768, 1280, 1440, 1728 widths | Remove overlap, clipped text, awkward wrapping, generic panels, and inconsistent spacing | `qa:visual` baseline/diff evidence, screenshots, polish notes |
| 10 | Production release rehearsal | Owner preparing a real deploy | Local release-candidate gate, Vercel preview/prod smoke, production share, production auth access | Tighten release scripts, evidence capture, rollback notes, monitoring workflow | Release-candidate report, production release gate report |
| 11 | Viral and profitability refinement | Friend group sharing and reusing the product | Share to feedback to owner refresh to new trip start; upgrade moments after value | Strengthen recipient CTA, owner feedback loop, free-to-paid upgrade context | Share-loop Browser evidence, `qa:share-viral`, commercial QA, product notes |
| 12 | Launch-candidate decision | Product owner reviewing evidence | Full clean-browser matrix across guest, owner, recipient, paid candidate, and recovery user | Final P0/P1 closure, P2 triage, final copy and visual QA | Launch signoff packet, release memo, deploy verification |

Weekly rule: if a P0/P1 appears, that week pauses thematic polish and shifts to repair, retest, and regression coverage until the issue is closed.

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

Current progress:

- Lisbon default generated actuals are passing.
- Launch-city generated actuals for Lisbon, Porto, Mexico City, and Tokyo are passing through `npm run qa:planner-actuals:launch-cities`.
- The prompt suite now cross-checks the four launch-city generated actuals with `56/56` passing and no missing coverage.
- Rome, Barcelona, London, Paris, Copenhagen, and Berlin next-city generated actuals are passing through `npm run qa:planner-actuals:next-cities`.
- The ten-actual Month 2 exit target is met for generated map-trust coverage through the combined Month 2 actuals artifact.
- The next expansion target is adding more varied regional coverage and edge cases beyond the first ten cities.
- Month 3 Trip Studio owner visual QA has started with a disposable Athens fixture, visible layout collision fixes, recovery coverage, and a five-viewport owner visual artifact.

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
- Run Browser at phone, laptop, and desktop widths before editing.
- Fix P0/P1 findings immediately.
- Convert one repeatable finding into a regression gate.
- Run the relevant QA command set.
- Update `RELEASE_READINESS_MEMO.md`.
- Update screenshots or evidence in `qa/`.
- Commit only verified changes, then push/deploy when the release gate is green.

The weekly evidence note should include:

- User type: first-time guest, returning owner, logged-out recipient, paid candidate, or recovery user.
- Route and viewport.
- Actions completed.
- P0/P1/P2/P3 findings.
- Fix commit, if a fix was made.
- Retest result.
- Commands run and pass/fail result.

## Monthly Operating Reviews

At the end of each month, run a scorecard review and decide whether the platform can move to the next month of readiness.

| Review | Decision Question | Required Evidence |
| --- | --- | --- |
| Month 1 review | Is the current product stable enough for broader planner/map expansion? | Core Browser route sweep, visual QA, lint/build, smoke, commercial, ops, share, studio, auth access |
| Month 2 review | Can users trust generated itineraries and maps? | Prompt actuals, map-trust reports, public-share QA, wrong-country guardrail evidence |
| Month 3 review | Is Trip Studio launch-grade as the main product surface? | Owner action Browser evidence, mutation QA, recovery QA, responsive visual QA |
| Month 4 review | Does sharing create a useful recipient loop? | Multi-slug public share QA, feedback states, owner readback, social preview cards |
| Month 5 review | Is the paid path safe and understandable? | Stripe readiness, hosted checkout, billing recovery, account/billing visual QA |
| Month 6 review | Can Globe.travel be released with confidence? | Full local release candidate, production release gate, rollback notes, no open P0/P1 |

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

The next execution slice is a short release-hardening checkpoint before the broader Month 1 and Month 2 work resumes. Close the auth/guest destination-preservation work already in progress, then continue planner, map trust, and visual QA expansion.

1. Retest the Browser auth/guest handoff path from `/login?next=/chat?q=Plan five days in Athens...` and prove guest, signup, and login actions preserve the planned-trip destination.
2. Run and keep green:
   - `npm run qa:auth-access`
   - `npm run lint`
   - `npm run build`
   - `git diff --check`
3. Update `qa/auth-guest-next-handoff-2026-05-18.md` and `RELEASE_READINESS_MEMO.md` with the final command results.
4. Commit the verified auth handoff fix, push, deploy through Vercel, and run the production release gate.
5. Resume Week 2 planner start-to-trip confidence and map-trust expansion:
   - Browser-test first-time planner starts from landing, `/chat`, and `/chat?q=...` at phone, laptop, and desktop widths.
   - Harden slow and failed planner draft creation until users always see progress, preserved input, and a retry path.
   - Expand generated actuals for Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin.
   - Record every confusing planner state, duplicate-start risk, empty draft, wrong destination extraction, weak map preview, hidden control, or handoff failure.
   - Fix the highest-impact P0/P1 first, then address P2 trust and clarity issues in planner progress, map preview, and draft recovery.
6. Run the focused planner/map gates:
   - `npm run qa:planner-handoff`
   - `npm run qa:slow-network`
   - `npm run qa:prompt-suite`
   - `QA_VISUAL_ROUTES=planner QA_VISUAL_VIEWPORTS=phone,laptop,desktop npm run qa:visual`
7. Run production release verification after any deployment:
   - `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production`
8. Update `RELEASE_READINESS_MEMO.md` and focused `qa/` evidence with Browser findings, fixes, command results, remaining risks, and retest status.

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
