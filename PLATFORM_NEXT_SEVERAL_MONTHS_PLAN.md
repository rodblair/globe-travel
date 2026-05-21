# Globe.travel Next Several Months Platform Completion Plan

Date: 2026-05-20
Status: Active goal execution plan
Owner: Codex platform QA and release audit
Updated: 2026-05-20 active next-phase platform completion plan set after full local, production, Stripe checkout, and Stripe portal readiness gates passed

## Active Goal

Complete the next several months of Globe.travel platform readiness: full-platform functionality testing, Browser-driven user journey QA, visual QA across responsive surfaces, design-system polish, reliability hardening, production monitoring, viral sharing loops, subscription readiness, and release operations until the platform is commercially launch-ready at scale.

This goal stays active until the full platform is proven launch-ready with evidence. It is not complete just because a feature works once, a build passes once, or a route looks good in one viewport.

## Next Phase Operating Plan: May-October 2026

This is the forward plan from the current release-candidate checkpoint. The product is no longer in a blank audit state; the next several months should be run as a disciplined launch-readiness program that keeps proving the app through real Browser journeys, automated gates, visual baselines, production verification, and commercial user value.

| Phase | Window | Completion Target | Testing And Visual QA Focus | Product/Business Outcome |
| --- | --- | --- | --- | --- |
| Phase 1 | Late May 2026 | Final internal release candidate | Re-run full local release candidate with every gate enabled, expand regional planner actuals beyond the first ten cities, retest Athens five-day public and owner surfaces, and run clean-browser visual QA across public/protected routes | The team can say the current web app is coherent, stable, and ready for invite-only beta usage |
| Phase 2 | June 2026 | Invite-only beta | Test 25-50 real or representative trips across friend groups, couples, families, solo, budget, premium, food, nightlife, outdoors, and culture prompts; capture Browser evidence for every failed or confusing journey; refresh visual baselines weekly | Globe.travel produces useful itineraries for varied users and avoids embarrassing map, layout, auth, or share failures |
| Phase 3 | July 2026 | Paid-path and retention beta | Verify upgrade moments after user value, hosted checkout, billing portal, account recovery, saved work, returning-user journeys, subscription states, and Stripe webhook operations; run account/billing visual QA at every release | Users understand the free-to-paid path, can manage subscriptions safely, and do not lose work across account or billing boundaries |
| Phase 4 | August 2026 | Public sharing and viral loop hardening | Stress-test multi-itinerary public links, recipient feedback, owner refresh from feedback, share-card metadata/images, native share/copy, and mobile public-share readability; test links in logged-out and clean-session Browser states | Shared trip pages become a growth surface that friends can understand, react to, and use to start their own plans |
| Phase 5 | September 2026 | Production scale rehearsal | Run production release gates after every deploy, scheduled monitoring, visual-diff review, rollback rehearsal, incident playbooks, seed/fixture cleanup audits, and a no-P0/P1 launch review | Release operations are boring, observable, recoverable, and not dependent on one-off manual knowledge |
| Phase 6 | October 2026 | Launch approval | Execute the final launch signoff packet: full local gate, production gate, clean Browser user matrix, accessibility/keyboard pass, commercial QA, visual QA, remaining-risk register, and rollback plan | Globe.travel can be released as a polished, useful, commercially credible product |

Phase dates are operating targets, not permission to defer P0/P1 fixes. Any core-flow blocker found in any phase is repaired, retested, and promoted into a gate before moving forward.

## Current Checkpoint

The active goal is pinned and remains open. The newest full local release-candidate consolidation passed `30/30` with `npm run lint`, `npm run build`, public-share fixture sweep, public-share feedback states, Trip Studio owner/read-only UI, owner feedback refresh, slow-network recovery, prompt suite, responsive visual QA, and hosted Stripe Checkout enabled. Evidence: `qa/release-candidate-full-consolidation-2026-05-20-final/`, `qa/visual-baseline-2026-05-20-full-consolidation-final/`, and `qa/stripe-checkout-browser-2026-05-20-full-consolidation-final/`.

Post-deploy production verification is also green on the same release. Production health reports commit `94784636a5bb6d697ec921d5970d06f7d0836162`, deployment `globe-travel-ohrtpqqjb-rodney-blairs-projects.vercel.app`, and `11/11` operational checks OK. `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-postdeploy-2026-05-20-9478463 npm run qa:release-production` passed `9/9`, including production visual QA `20/20`, viral loop `5/5`, and prompt-suite actual validation `56/56`. Evidence: `qa/production-postdeploy-9478463-2026-05-20.md`.

The newest paid-path checkpoint adds hosted Stripe billing portal success coverage. `npm run qa:stripe-portal-browser` now creates a disposable Stripe test customer and trialing subscription, opens Stripe's hosted billing portal in Chrome, verifies subscription-management content and a return link, returns to Globe.travel billing with no app error or horizontal overflow, and cleans up the Stripe objects. `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` integrates that check into the local release-candidate gate; the focused integrated run passed `17/17`. Evidence: `qa/stripe-billing-portal-browser-2026-05-20.md`.

The release-candidate gate now self-provisions the disposable owner profile needed for public-share fixture sweeps and deletes that profile/auth user after the sweep. This closes the setup brittleness that previously made the comprehensive gate depend on a manually prepared `QA_OWNER_USER_ID`. A focused standalone `npm run qa:share-fixture-sweep` also passed with 10 generated public itineraries, 50 share checks, 10 exported prompt actuals, prompt suite `56/56`, and full fixture/profile cleanup.

In-app Browser spot-checked the local `/saved` returning-user surface and the stable Athens public share page `/t/x3m2c8cnws` after the full candidate run. Both loaded in a fresh Browser tab with no app error and no horizontal overflow; the Athens share page retained trip/share copy and title `5 Days in Athens Greece in mid september | Globe.travel`.

The previous full release-candidate blocker is closed: saved trip open/delete hit targets are separated, long Trip Studio titles wrap cleanly, the full local predeploy gate passed `23/23`, production deployed, and the production release gate passed.

The current reliability upgrade is that public production visual QA and public share viral-loop QA are now part of the one-command production release gate. `npm run qa:release-production` checks public production layout for landing, login, signup, and public share, verifies recipient share/copy/start-own-trip affordances on the stable Athens public itinerary, pixel-compares stable shell routes against the production visual baseline, and still runs production ops, smoke, auth/guest, commercial, public share/social preview, prompt actuals, and prompt-suite checks.

The latest local release-candidate checkpoint is green after the production copy/auth hardening. `QA_RELEASE_ARTIFACT_NAME=release-candidate-platform-continuation-2026-05-21 npm run qa:release-candidate` passed `28/28`, including lint, build, ops, geocode, smoke, auth/guest, saved/account, commercial, accessibility/keyboard, public share, public share recovery, viral loop, map fallback, feedback mutation, recipient feedback, feedback states, planner handoff, billing recovery, Trip Studio action/recovery/owner/read-only/feedback UI, slow-network recovery, Stripe readiness, prompt suite, visual QA `50/50`, and cleanup. The command now also preflights local `/api/health` so a missing dev server fails fast with a clear instruction before writing a noisy release artifact.

The newest Trip Studio recovery checkpoint closes a stale or missing trip URL trust gap. Browser reproduced the current `/trips/571b2728-3a8c-4391-9ef9-883fef1c0764` route rendering a generic empty owner workspace; it now renders a polished unavailable-trip recovery state with saved-trip and new-plan paths, no disabled owner actions, no empty workspace copy, no app error, no horizontal overflow, and one page-level main landmark. `npm run qa:studio-owner-ui` now includes this missing-trip recovery check at phone width and passed `7/7`; `npm run lint` and `npm run build` passed. Commit `0b82945` deployed to Vercel production, production health reports that commit on the live alias, and `npm run qa:release-production` passed `9/9` with public visual QA `20/20`, viral loop `5/5`, and prompt-suite actual validation `56/56`. Evidence: `qa/trip-studio-missing-trip-recovery-2026-05-21.md` and `qa/visual-baseline-production-missing-trip-recovery-2026-05-21-0b82945/`.

The newest release-operations checkpoint promotes that unavailable-trip recovery into repeatable gates. `npm run qa:studio-recovery-ui` now browser-tests the missing Trip Studio route at phone width, and both `npm run qa:release-candidate` and `npm run qa:release-production` include it. Focused local release-candidate passed `17/17`; full production release passed `10/10`, including the new production Trip Studio recovery UI task, production visual QA `20/20`, viral loop `5/5`, and prompt-suite actual validation `56/56`. Evidence: `qa/trip-studio-recovery-gate-promotion-2026-05-21.md`, `qa/release-candidate-trip-recovery-gate-2026-05-21/`, and `qa/visual-baseline-production-trip-recovery-gate-2026-05-21-6ee387b/`.

The newest returning-user checkpoint closes a saved-trip reopen coverage gap. `npm run qa:saved-account` now clicks a generated saved trip card from `/saved` and verifies the actual Trip Studio owner route opens with the saved title, Save trip, Build maps, and Share with friends controls, no unavailable-trip recovery, no app error, no horizontal overflow, and one page-level main landmark. The focused gate passed `14/14`, and in-app Browser repeated the same disposable saved-trip click-through before cleanup.

The newest release-operations checkpoint hardens the public-share viral-loop gate itself. A production release run exposed that `qa:share-viral` could spend too long waiting on brittle `Share trip` body text, so the smoke now uses the actual rendered controls (`Copy link` and `Share`) as readiness markers and force-bounds browser shutdown. Standalone production `npm run qa:share-viral` passed `5/5`, and the full production release gate passed `10/10` with visual QA `20/20`, viral loop `5/5`, and prompt-suite actual validation `56/56`. Evidence: `qa/public-share-viral-gate-hardening-2026-05-21.md` and `qa/visual-baseline-production-saved-reopen-viral-gate-2026-05-21-c4c30c3/`.

The latest post-deploy production checkpoint is now green on commit `c762c51`, the deployed public-share viral-gate hardening release. Production health reports commit `c762c51011143f64c21bc192a876fd2477365d17` with `11/11` operational checks OK. The full non-mutating production release gate passed `10/10` with production visual QA `20/20`, viral loop `5/5`, stable Athens public itinerary/map integrity, and prompt-suite actual validation `56/56`. Evidence: `qa/production-postdeploy-c762c51-2026-05-21.md` and `qa/visual-baseline-production-postdeploy-c762c51-2026-05-21/`.

The newest Month 5 paid-path checkpoint closes a cancel-at-period-end subscription clarity issue. Account billing now has a repeatable `qaBillingState=canceling` state, renders the plan as Adventurer with `Cancels soon`, explains that access remains active until the current period ends, and keeps the billing portal path visible. In-app Browser verified the local canceling state with no app error, no horizontal overflow, and one `main`; `npm run qa:billing-recovery` now passed `15/15` across free, active, trialing, canceling, past-due, canceled, checkout/portal failure, checkout return/cancel, and upgrade-dialog recovery. Evidence: `qa/billing-subscription-state-2026-05-21/`.

The postdeploy visual evidence gap for commit `ec53a97` is closed. The full non-mutating production release gate was rerun with public visual QA enabled and passed `10/10`, including production visual QA `20/20`, viral loop `5/5`, stable Athens public itinerary/map integrity, and prompt-suite production actual validation `56/56`. In-app Browser also spot-checked the live Athens public share, saved returning-user surface, and account billing surface with no app error, no horizontal overflow, and one `main` on each checked route. Evidence: `qa/production-postdeploy-ec53a97-visual-browser-2026-05-21.md` and `qa/visual-baseline-production-postdeploy-2026-05-21-ec53a97/`.

The newest full local internal release-candidate checkpoint is green after billing-state hardening. `QA_RELEASE_ARTIFACT_NAME=release-candidate-full-post-billing-2026-05-21 QA_VISUAL_RUN_ID=full-post-billing-2026-05-21 QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=1 QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1 QA_RELEASE_INCLUDE_STRIPE_PORTAL=1 QA_STRIPE_CHECKOUT_ARTIFACT_NAME=stripe-checkout-browser-full-post-billing-2026-05-21 QA_STRIPE_PORTAL_ARTIFACT_NAME=stripe-portal-browser-full-post-billing-2026-05-21 npm run qa:release-candidate` passed `32/32`, including lint, build, visual QA `50/50`, hosted Stripe Checkout `15/15`, hosted Stripe portal `16/16`, billing recovery `15/15`, share fixture sweep, Trip Studio owner/action/recovery/feedback UI, slow-network recovery, prompt suite `56/56`, and cleanup. In-app Browser spot-checked the local canceling billing state and Athens public share with no app error, no horizontal overflow, and one `main`. Evidence: `qa/release-candidate-full-post-billing-2026-05-21.md`, `qa/release-candidate-full-post-billing-2026-05-21/`, `qa/visual-baseline-2026-05-21-full-post-billing-2026-05-21/`, `qa/stripe-checkout-browser-full-post-billing-2026-05-21/`, and `qa/stripe-portal-browser-full-post-billing-2026-05-21/`.

The latest post-deploy production checkpoint re-ran that full non-mutating production gate after the owner-feedback release with production visual and viral coverage enabled. `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-release-2026-05-20 npm run qa:release-production` passed `9/9`, including visual QA `20/20`, viral loop `5/5`, and prompt-suite production actual validation `56/56`. In-app Browser also spot-checked the live Athens share page through route/map content, feedback loop content, share controls, Start your own trip links, no app error, and no horizontal overflow. Evidence: `qa/production-release-full-visual-viral-2026-05-20.md`.

The newest regional map-trust release checkpoint is deployed and green in production. Commit `1fe9913` is live on Vercel deployment `dpl_4ZBBpAzit16xefLvw49qppK9tXSA`, aliased to `https://globe-travel-two.vercel.app`. `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-regional-map-trust-2026-05-20-1fe9913 npm run qa:release-production` passed `9/9`, including ops, smoke, auth/guest access, commercial fail-safe checks, public share, public viral loop, production visual QA `20/20`, production prompt actual export, and prompt-suite production actual validation `56/56`. Evidence: `qa/production-regional-map-trust-release-2026-05-20.md` and `qa/visual-baseline-production-regional-map-trust-2026-05-20-1fe9913/`.

The newest protected-surface checkpoint adds current authenticated local evidence for returning-user and owner surfaces. `npm run qa:saved-account` passed `13/13`, `npm run qa:billing-recovery` passed `13/13`, `npm run qa:studio-owner-ui` passed `6/6`, a kept owner fixture passed `qa:studio-actions` `23/23` and `qa:studio-recovery` `6/6`, and authenticated visual QA passed `25/25` across saved trips, saved journal, account profile, account billing, and Trip Studio at five viewport sizes. In-app Browser also checked saved trips, Explorer billing, and owner Trip Studio controls with no app error or horizontal overflow before cleanup. Evidence: `qa/protected-surfaces-authenticated-visual-2026-05-20.md`.

The newest commercial-readiness checkpoint closes a paid-path polish gap in the saved journal limit flow: the upgrade modal now has accessible dialog semantics, shows recoverable checkout errors, and no longer advertises a `coming soon` feature as paid value. `npm run qa:billing-recovery` now covers that modal through a development-only QA path.

The newest public-share checkpoint closes a recipient feedback validation gap: optional email is validated before submission with clear recovery copy, the public feedback textarea now enforces the API's 600-character limit, and `npm run qa:share-recovery` covers invalid optional email plus forced feedback failure recovery.

The newest saved/account checkpoint closes a journal keyboard accessibility gap: saved note editor, reader, and delete-confirmation modals now expose dialog semantics, keep focus inside while open, close with Escape, and are covered by `npm run qa:saved-account`.

The newest planner-start checkpoint strengthens first-time guest confidence: `npm run qa:planner-handoff` now proves Browser-style failed and delayed `/chat?q=...` starts on a phone viewport, including preserved prompts, visible retry, disabled duplicate-start controls, Trip Studio arrival, initial generation copy, and disposable cleanup.

The newest map-trust checkpoint makes degraded map rendering explicit: public share route cards can force the static fallback in development, label the fallback as `Static Route`, preserve recipient itinerary/feedback/CTA usability without Mapbox canvas, and are covered by `npm run qa:map-fallback` inside the local release-candidate gate.

The newest saved/account checkpoint closes a profile identity reliability gap: `PATCH /api/profile` now rejects invalid or overlong identity updates, the account form shows field limits and username rules, editable fields sync after profile refresh, and Browser verified invalid username recovery plus valid guest profile saving without overflow. `npm run qa:saved-account` now includes this regression and passed `13/13`.

The newest planner-start checkpoint closes a natural-language duration gap: Browser reproduced `Plan five days in Athens...` creating `4 Days in five days in Athens`; the shared planner parser now extracts word-based durations and clean destinations, Trip Studio opens as `5 Days in Athens` with five day tabs, and `npm run qa:planner-handoff` verifies the corrected Browser-style path.

The newest auth/guest checkpoint preserves work across the auth boundary: protected routes now redirect to login with a safe `next`, login/signup/guest actions preserve the destination, guest start can carry planner prompts through to Trip Studio, and `npm run qa:auth-access` covers the handoff.

The newest planner/map checkpoint hardens generated itinerary map trust. `npm run qa:planner-actuals` now creates a disposable guest and trip, sends a real Lisbon planner prompt through `/api/chat`, verifies mapped stops, country consistency, unique pins, usable routes, and cleanup, then exports the generated actual for prompt-suite cross-checking. `npm run qa:geocode-quality` adds strict destination-anchor and false-positive geocoder checks, and the local release-candidate gate now includes it. Browser also verified a kept generated public Lisbon share page with itinerary content, Mapbox canvas, map markers, share/copy actions, and no console errors before cleanup. Month 2 generated actual coverage reached ten cities: Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin. The Phase 1 regional expansion now adds Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney as generated actuals beyond the first ten cities. `npm run qa:planner-actuals:regional-edge` passes `8/8` with `actualsChecked: 6`, and the exported actuals cross-check in `npm run qa:prompt-suite` with `actualsChecked: 6`. Browser spot-checked kept Seoul and Cape Town public-share fixtures before cleanup. Evidence: `qa/planner-generated-actuals-regional-edge-2026-05-20.md` and `qa/planner-generated-actuals-regional-edge-cities-2026-05-20.json`.

The newest Trip Studio checkpoint starts Month 3 owner-surface completion. A kept disposable owned Trip Studio fixture passed API owner actions `23/23`, Browser verified the direct/public state was clearly read-only instead of edit-capable, two visual collisions were removed from the owner workspace, `npm run qa:studio-recovery` passed `6/6`, and Trip Studio responsive visual QA passed `5/5` across phone, tablet, laptop, desktop, and wide viewports. Evidence: `qa/trip-studio-month3-owner-visual-qa-2026-05-19.md` and `qa/visual-baseline-2026-05-19-trip-studio-month3-owner/`.

The newest Trip Studio identity checkpoint closes a guest-owner edit-mode risk. Server trip APIs and `/api/chat` now resolve guest identity before Supabase auth while the guest cookie exists, account auth success clears that guest cookie, Browser verified a guest-owned Trip Studio fixture now opens with owner controls instead of `View only`, `npm run qa:auth-access` passed `15/15` with the new regression assertion, and `npm run qa:studio-actions` still passed `23/23`. Evidence: `qa/trip-studio-guest-owner-auth-precedence-2026-05-19.md`.

The newest Trip Studio automation checkpoint converts the owner/read-only Browser finding into repeatable coverage. `npm run qa:studio-owner-ui` creates or accepts a mapped guest-owned Trip Studio fixture, verifies owner controls, Day 2 itinerary/map context, logged-out direct read-only state, public-share recipient state, no app errors, no horizontal overflow, and fixture cleanup. The local release-candidate gate now includes this check on its kept fixture; the focused 2026-05-19 pass completed `20/20`. Evidence: `qa/trip-studio-owner-readonly-browser-smoke-2026-05-19.md` and `qa/release-candidate-2026-05-19/`.

The newest Month 4 public-share checkpoint turns successful recipient feedback into browser coverage. `npm run qa:share-recipient-ui` submits feedback through the rendered public share page on phone, verifies public API readback, confirms the reaction is visible after desktop reload, and cleans up the inserted feedback. The local release-candidate gate now includes this browser check whenever share feedback mutation is enabled. Evidence: `qa/public-share-recipient-ui-feedback-2026-05-19.md`.

The newest public-share-to-owner checkpoint hardens the full feedback loop through rendered UI. `npm run qa:share-owner-feedback-ui` seeds mixed friend reactions, submits a logged-out friend reaction through the public share page, opens the owner Trip Studio with the guest organizer cookie, verifies sentiment counts, latest feedback cards, overflow summary, submitted author/comment, and owner readiness copy, forces a one-time feedback-refresh workflow failure, retries `Refresh plan from feedback` to `"status": "ready"`, and cleans up disposable data. The Codex in-app Browser also verified the same owner surface, failure copy, retry-to-ready output, no app error, no horizontal overflow, and fixture cleanup. Evidence: `qa/public-share-owner-feedback-ui-2026-05-20.md`.

The newest feedback-state checkpoint hardens the recipient side of the share loop for volume and recovery. `npm run qa:share-feedback-states-ui` creates a disposable public Trip Studio fixture, verifies clear `0 reactions` guidance, blocks invalid optional email in the rendered form, forces a one-time feedback submission failure, verifies the comment is preserved for retry, submits seven reactions across mixed sentiments, covers duplicate names, long author text, and a 540-character comment, verifies desktop reload shows `7 reactions` with a `Showing latest 4 of 7 reactions` overflow summary, and cleans up every inserted row plus the disposable fixture. Evidence: `qa/public-share-feedback-states-ui-2026-05-20.md`.

The newest multi-itinerary share checkpoint broadens the growth loop beyond the stable Athens share and adds social-card image plus owner refresh QA. `npm run qa:share-multi-itinerary-ui` creates ten disposable public itinerary fixtures, API-smokes all ten, decodes all ten share-card PNGs for dimensions, nonblank branded content, and unique per-trip hashes, Browser-tests Lisbon, Porto, and Mexico City as logged-out recipients on phone and desktop, submits feedback on each, verifies desktop readback, checks copy/native share affordances, then opens the owner Trip Studio for Lisbon on phone, Porto on tablet, and Mexico City on desktop and runs `Refresh plan from feedback` through ready state on each. Evidence: `qa/public-share-multi-itinerary-ui-2026-05-20.md`.

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
- The first regional expansion target is met for Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney. Seoul and Cape Town were promoted after deeper trusted-place and day-trip routing work.
- Month 3 Trip Studio owner visual QA has started with a disposable Athens fixture, visible layout collision fixes, recovery coverage, and a five-viewport owner visual artifact.
- Guest-owned Trip Studio identity precedence is now aligned between client and server so a guest organizer does not lose edit mode when stale account auth state is present.

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

- Expand `qa:studio-actions`, `qa:studio`, `qa:studio-owner-ui`, `qa:studio-recovery`, and `qa:visual` around every repeated Browser finding.
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
- Keep public feedback, recipient feedback UI, and owner feedback gates in release-candidate runs.
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

The next execution slice is Phase 1 launch-candidate maintenance and regional confidence expansion. The previous local and production release-candidate blockers are closed, so the next useful work should increase coverage breadth, keep the release gate green, and remove any remaining visual or operational roughness found by real Browser use.

1. Regional planner and map expansion:
   - add a `regional-edge-cities` generated-actual preset beyond the first ten cities;
   - include at least four varied destinations across different regions and trip styles;
   - verify day count, title/destination match, country consistency, mapped stop count, duplicate mapped stops, route usability, cleanup, and prompt-suite actual validation;
   - document failures as P0/P1 if maps are wrong-country, duplicate-pin, zero-stop, or overconfident.
   - Done as of May 20: Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney pass `npm run qa:planner-actuals:regional-edge` `8/8`, and the exported actuals pass prompt-suite validation with `actualsChecked: 6`.
2. Athens five-day release anchor:
   - keep `/t/x3m2c8cnws` as the stable production public-share reference;
   - retest the public share, owner Trip Studio, day tabs, map/itinerary relationship, feedback loop, `Start your own trip`, and share-card metadata after every meaningful release;
   - treat an Athens public or owner regression as a release blocker because it is the durable product proof point.
   - Latest May 20 check: the production viral-loop copy-feedback issue is closed; the Athens production share viral gate now passes `5/5`, including phone, desktop, copy feedback, native share payload, and safe remote guest-start behavior.
   - Latest May 21 check: the full production release gate passed `9/9` after the copy-feedback deployment, and in-app Browser verified a denied-copy recovery path that focuses and selects the public URL for manual copy.
   - Latest May 21 auth harness check: production guest-start mutation is skipped by default unless explicitly enabled, local guest-start remains covered with cleanup, and the full production release gate passes `9/9` with the corrected non-mutating auth smoke.
3. Clean-browser launch matrix:
   - run Browser as a first-time guest, returning owner, logged-out recipient, paid candidate, and recovery user;
   - cover phone, tablet, laptop, desktop, and wide desktop for the primary public and protected routes;
   - capture horizontal overflow, clipped text, app-owned control overlap, missing loading/error states, stale copy, and confusing auth/guest transitions.
4. Visual QA and design-system polish:
   - run `qa:visual` for public shells, protected surfaces, public share, and Trip Studio owner surfaces;
   - normalize repeated button hierarchy, panel spacing, mobile action density, empty states, and upgrade language;
   - preserve the clean navigator-log design direction while removing generic AI-app patterns and repeated card clutter.
5. Reliability and release operations:
   - run the full local release-candidate gate with visual, prompt suite, share fixture sweep, owner feedback, slow network, saved/account, billing recovery, auth/guest, a11y, ops, Stripe checkout, Stripe portal, and production build enabled;
   - run the non-mutating production release gate after deploy;
   - update `RELEASE_READINESS_MEMO.md`, this roadmap, and a focused `qa/` evidence file with commands, Browser findings, fixes, and remaining risks.

Phase 1 is complete only when the broadened regional generated-actuals pass, the clean-browser matrix has no open P0/P1 issues, the visual gate has no launch-blocking diffs, local release-candidate remains green, and production release verification remains green after deployment.

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
