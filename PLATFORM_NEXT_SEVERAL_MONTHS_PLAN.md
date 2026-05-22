# Globe.travel Next Several Months Platform Completion Plan

Date: 2026-05-20
Status: Active goal execution plan
Owner: Codex platform QA and release audit
Updated: 2026-05-22 active next-phase platform completion plan with production evidence, risk, and operator-doc drift guarded in launch signoff

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

The newest checkpoint keeps production evidence, beta-review execution, risk narrative, route inventory, authenticated app-surface coverage, and operator-facing docs aligned after the public launch blocker-board gate reached production. `npm run qa:public-launch-status` now reports live commit `b635e5bce19319306d7f3103dcc5c552774ba811` on `globe-travel-6rqed3a1p-rodney-blairs-projects.vercel.app`, status `beta-ready-public-blocked`, beta/release-ops readiness green, guardrail issues empty, beta reviews `0/25` with `25 remaining`, and production visual-review history `2/4` with `2 remaining`. The current invite-beta operating wave is `BETA-WAVE-01`, with reviewer outreach prepared in `qa/beta-human-review-next-wave-ops-2026-05-21.json`, `.md`, and `.csv`; these 5 next-wave operator rows are assignment evidence, not completed human-review evidence. The full invite-beta queue is also prepared in `qa/beta-human-review-all-wave-ops-2026-05-21.json`, `.md`, and `.csv`; `npm run qa:beta-review-all-wave-ops` verifies 25/25 remaining reviewer outreach rows across all 5 scheduled waves and keeps that artifact out of completed-review counts. `qa/public-launch-blocker-board-2026-05-21.json`, `.md`, and `.csv` now combine those 5 beta rows with 3 scheduled production visual-review rows, marking the first 2 visual rows as required for public-launch history. The blocker board also exposes exact per-row next evidence actions, start URLs or production commands, packet/template paths, completed evidence paths, validation commands, and explicit import commands; `npm run qa:public-launch-blockers` now verifies those row packet/template paths and commands before public launch status can remain green. `npm run qa:route-inventory` now writes `qa/route-inventory-smoke-2026-05-22.json` and verifies 22/22 shipped top-level public, auth, protected, compatibility, and public-share routes against production, including source-file existence, public render markers, and protected login redirects; `npm run qa:app-surfaces` now writes `qa/app-surfaces-smoke-2026-05-22.json`, captures phone and desktop screenshots, and verifies 18/18 guest-auth checks for secondary authenticated routes and compatibility aliases including `/explore`, `/globe`, `/map`, `/bucket-list`, `/journal`, `/profile`, `/settings`, `/pricing`, and `/onboarding`. Public launch status and launch signoff now fail if the full route inventory, authenticated app-surface evidence, beta-review wave rehearsal evidence, beta-review full-matrix rehearsal evidence, or beta all-wave ops evidence is missing, stale, or broken; `npm run qa:beta-review-wave-rehearsal` writes `qa/beta-human-review-wave-rehearsal-2026-05-22.json`, `.md`, and 5 screenshots, validating 5/5 next-wave reviewer start URLs, auth/guest prompt preservation, packet/template alignment, and no horizontal overflow, while `npm run qa:beta-review-matrix-rehearsal` writes `qa/beta-human-review-matrix-rehearsal-2026-05-22.json`, `.md`, and 25 screenshots, validating 25/25 planned beta review packets from Athens through London without counting as completed human-review evidence. The latest production visual evidence is `qa/visual-baseline-production-release-2026-05-22` and `qa/visual-baseline-production-release-2026-05-22/summary.json`, bound to commit `b635e5bce19319306d7f3103dcc5c552774ba811` and deployment `globe-travel-6rqed3a1p-rodney-blairs-projects.vercel.app`. Launch signoff verifies the 25-review beta execution schedule, beta next-wave ops pack, beta all-wave ops pack, beta wave rehearsal, beta full-matrix rehearsal, public launch blocker board, full route inventory, authenticated app surfaces, accepted-risk evidence counts, current production visual evidence, current release-doc evidence markers, monitoring, and rollback pointers. Exact signoff passes `99/99`; beta matrix rehearsal passed `25/25`; route inventory passed `22/22`; authenticated app surfaces passed `18/18`; production release verification passed `10/10`; production visual QA passed `20/20`; public-share viral loop passed `5/5`; Athens five-day public-share map integrity passed `5/5`; prompt-suite production actual validation passed `60/60`; production monitoring passed `9/9`; and design-system readiness passed `10/10`. The full beta review matrix rehearsal gate commit was pushed to `main`, deployed by Vercel, and re-verified on the production alias with refreshed monitoring, rollback, risk, design-system, visual-review, and public-launch status evidence. The in-app Browser backend was unavailable in this run, so the verification path used the repo's Playwright-backed Browser QA runners and recorded evidence in `qa/visual-baseline-production-release-2026-05-22/`, `qa/app-surfaces-smoke-2026-05-22/`, and `qa/beta-human-review-matrix-rehearsal-2026-05-22/`.

The remaining public-launch evidence queues are still executable end to end without loosening the real thresholds. `npm run qa:beta-review-packets` writes `25/25` reviewer packets, `25/25` matching JSON submission templates, and `qa/beta-human-review-assignments-2026-05-21.csv/.md`; `npm run qa:beta-review-all-wave-ops` writes the 25-row all-wave outreach board for the full planned review queue; `npm run qa:visual-review-schedule` writes scheduled production visual-review templates plus `qa/production-visual-review-assignments-2026-05-21.csv/.md`; `npm run qa:visual-review-progress` proves the latest visual artifact and dated history state; and `npm run qa:public-launch-status` exposes the two remaining blockers until completed beta reviews reach `25/25`, production visual-review history reaches `4/4` distinct passing dates, and the status artifact reports `public-launch-ready`.

The newest local continuation QA checkpoint keeps the first-time and returning-user shell surfaces fresh while the human beta-review queue is still pending. The in-app Browser backend was unavailable in this run, so the fallback used the repo's Chrome/Playwright runners against `localhost:3000`: the responsive visual route sweep passed `18/18` across landing, planner, saved trips, saved journal, account profile, account billing, login, signup, and public share at phone/laptop widths; accessibility and keyboard passed `16/16` across the same launch routes at phone/desktop widths; and Trip Studio owner/read-only/recovery UI passed `7/7` with fixture cleanup. Evidence: `qa/visual-baseline-2026-05-21-continuation-route-sweep/` and `qa/accessibility-keyboard-2026-05-21-continuation-route-sweep/`.

The same continuation pass exposed and closed a first-load guest reliability race. When protected saved/account surfaces hydrate multiple API calls for the same new guest at once, Supabase can return a generic create-user database error to one racing request even though another request already created the user. Guest provisioning now re-checks the explicit auth user id before treating that error as fatal, and the new `npm run qa:guest-race` command exercises concurrent `/api/trips` and `/api/journal` requests for the same new guest. The focused race smoke passed `2/2` and cleaned up its generated guest. Evidence: `qa/guest-account-race-2026-05-21-continuation/`.

The newest beta-review intake checkpoint gives the invite-beta program a validated path from reviewer packets to counted launch evidence. `npm run qa:beta-review-intake` now validates completed review JSON submissions in `qa/beta-human-review-submissions-2026-05-21`, ignores `.template.json` examples, checks each submission against its assigned packet, scorecard, viewport, URL, findings format, and planned review id, writes `qa/beta-human-review-intake-2026-05-21.json` and `.md`, and imports only when `QA_BETA_REVIEW_IMPORT=1` is explicitly set. Dry-run intake passed `4/4`, the missing-directory negative check failed as expected, and exact signoff now verifies the intake artifact and passed `78/78` against production commit `ec38399177df6919d31e128baab202ad74444679`.

The newest production visual-review intake checkpoint gives the remaining `GT-P2-002` history path the same guarded intake model. `npm run qa:visual-review-intake` now validates completed production visual-review JSON submissions in `qa/production-visual-review-submissions-2026-05-21`, ignores `.template.json` examples, checks each submission against its scheduled review id, due date, artifact prefix, visual summary, screenshots, routes, viewports, stable diff routes, production commit, verdict, blocking findings, and notes, writes `qa/production-visual-review-intake-2026-05-21.json` and `.md`, and imports only when `QA_VISUAL_REVIEW_IMPORT=1` is explicitly set. Dry-run intake passed `4/4`, the missing-directory negative check failed as expected, and exact signoff now verifies the intake artifact and passed `81/81` against production commit `ec38399177df6919d31e128baab202ad74444679`.

The newest paid-path readiness checkpoint makes subscription value and billing evidence part of the launch packet instead of a side note. `npm run qa:paid-path-readiness` writes `qa/paid-path-readiness-2026-05-21.json` and `.md`, proves the Stripe setup, account billing recovery, hosted checkout, hosted billing portal, commercial smoke, and release-candidate paid-path artifacts, and passed `6/6`. Launch signoff now verifies the paid-path readiness artifact, the production release gate passed `10/10`, production visual QA passed `20/20`, prompt suite with production actuals passed `60/60`, and exact signoff passed `78/78` against production commit `ec38399177df6919d31e128baab202ad74444679`.

The newest beta-review progress checkpoint gives the invite-beta work a launch-readable operating dashboard. `npm run qa:beta-review-progress` now writes `qa/beta-human-review-progress-2026-05-21.json` and `.md`, tracking planned reviews, completed reviews, remaining reviews to public launch, completed-review audience/style/region/device/surface coverage, evidence gaps, unresolved P0/P1 and P2 findings, scorecard averages, and launch score thresholds. Launch signoff now verifies this progress artifact is fresh and matches `qa/beta-human-review-register.json`; exact signoff passed `78/78` against production commit `ec38399177df6919d31e128baab202ad74444679`. Public-progress mode fails as expected until completed beta reviews reach `25/25` and completed-review matrix coverage exists.

The newest production visual-review schedule checkpoint makes the remaining `GT-P2-002` path operational instead of vague. `npm run qa:visual-review-schedule` now verifies that the production visual-review register has enough future review slots to reach the four-date public-launch history threshold, that every scheduled entry has an owner, date, production release command, visual artifact name, required routes, five viewports, diff routes, and acceptance criteria, and that `nextReviewDueAt` matches the next scheduled review. The current schedule passes `3/3` for planned review dates `2026-05-28`, `2026-06-04`, and `2026-06-11`; exact launch signoff now includes the schedule and intake checks and passed `81/81`. This does not count as completed history; public launch still needs those reviews actually run and recorded.

The newest beta-review operations checkpoint turns the 25 planned human reviews into reviewer-ready assignments. `npm run qa:beta-review-packets` now generates `qa/beta-human-review-packet-manifest-2026-05-21.json` plus `qa/beta-human-review-packets-2026-05-21/`, with one packet per planned review containing the prompt, production start URL, device viewport, assigned surfaces, journey checklist, scorecard, required written evidence, and finding severity rules. Current exact-commit launch signoff verifies the packet manifest and all 25 packet files, passing `78/78` against production commit `ec38399177df6919d31e128baab202ad74444679`. Public launch is still intentionally blocked until completed reviews reach `25/25` and production visual-review history reaches `4/4` distinct passing dates.

The newest public-launch signoff checkpoint separates beta readiness from public launch approval. `npm run qa:launch-signoff` now accepts `QA_LAUNCH_REQUIRE_PUBLIC_BETA_REVIEWS=1` or `QA_LAUNCH_MODE=public`; in that mode, it fails unless completed beta human reviews meet `minimumCompletedReviewsForPublicLaunch` from `qa/beta-human-review-register.json` and production visual-review history has at least four distinct passing review dates. Default exact-commit signoff passed `81/81`, while public-launch mode failed as expected at `81/83` with `0/25` completed reviews and `1/4` visual-review history entries. Commit `ec38399` deployed to Vercel production with health `ok`, `11/11`; the full production release gate passed `10/10`, including production visual QA `20/20`, viral loop `5/5`, Athens public-share map integrity, prompt-suite production actual validation `60/60`, and paid-path readiness `6/6`. Evidence: `qa/public-launch-beta-review-signoff-mode-2026-05-21.md`, `qa/beta-human-review-intake-2026-05-21.json`, `qa/beta-human-review-packet-manifest-2026-05-21.json`, `qa/production-visual-review-intake-2026-05-21.json`, `qa/production-visual-review-schedule-2026-05-21.md`, and `qa/visual-baseline-production-paid-path-readiness-2026-05-21-ec38399/`.

The newest beta human-review evidence checkpoint tightens the remaining `GT-P2-001` path from "planned reviews exist" to "completed reviews must contain auditable evidence." `npm run qa:beta-review-readiness` now checks completed review records for reviewer role, route/share URL, viewport, device, prompt, completed date, first-minute outcome, map-trust notes, share-feedback outcome, complete 1-5 scorecard ratings, and well-formed findings. `npm run qa:launch-signoff` applies the same completed-review evidence-quality guard. Intake mode passed `12/12`; the public-launch threshold correctly still fails at `0/25` completed reviews; a malformed completed-review negative test failed on missing/invalid evidence. Commit `b634fee` deployed to Vercel production with health `ok`, `11/11`; the full production release gate passed `10/10`, including production visual QA `20/20`, viral loop `5/5`, Athens public-share map integrity, and prompt-suite production actual validation `60/60`; exact-commit launch signoff passed `66/66` against live production commit `b634fee74687159c515b8446c94efc3536f3acdd`. Evidence: `qa/beta-human-review-evidence-quality-2026-05-21.md`, `qa/beta-human-review-readiness-2026-05-21.md`, `qa/beta-human-review-readiness-2026-05-21-min-25.md`, and `qa/visual-baseline-production-beta-review-evidence-2026-05-21-b634fee/`.

The newest design-system polish checkpoint turns the visual/design quality bar into a repeatable release signal. Removed remaining production `console.log` debug calls from app/API code, added `npm run qa:design-system`, and generated `qa/design-system-readiness-2026-05-21.json` plus `qa/design-system-readiness-2026-05-21.md`. The gate verifies `.impeccable.md` design context, atmosphere tokens in `client/app/globals.css`, shared UI primitives, editorial travel components, source-copy hygiene, no debug `console.log` calls, full responsive visual QA `50/50`, no layout polish blockers, and production public visual QA `20/20`. Commit `dc353ba` deployed to Vercel production with health `ok`, `11/11`; the full production release gate passed `10/10`, including production visual QA `20/20`, viral loop `5/5`, Athens public-share map integrity, and prompt-suite production actual validation `60/60`; exact-commit launch signoff now includes this artifact and passed `65/65` against live production commit `dc353ba5922ed45987a1cf27a40c7903615a60d0`.

The newest production-monitoring checkpoint turns scheduled monitoring from runbook guidance into enforceable launch-signoff evidence. Added `qa/production-monitoring-register.json`, `npm run qa:production-monitoring`, and `qa/production-monitoring-readiness-2026-05-21.md`. The new gate proves the production alias, health endpoint, stable Athens share slug, GitHub Actions release and visual workflows, monitoring signals for health/acquisition/auth/public share/feedback/release/visual/launch signoff/rollback, alert policy, first-response steps, runbook coverage, live production health, and current verification freshness. Commit `acf72d1` deployed to Vercel production with health `ok`, `11/11`; the full production release gate passed `10/10`, including production visual QA `20/20`, viral loop `5/5`, Athens public-share map integrity, and prompt-suite production actual validation `60/60`; `npm run qa:production-monitoring` passed `9/9`; exact-commit launch signoff now includes the monitoring register and passed `61/61` against live production commit `acf72d18a0bbfffae7d5423d5970577638404ede`.

The newest beta human-review checkpoint turns the remaining `GT-P2-001` work into an operational intake gate. `qa/beta-human-review-register.json` defines 25 planned reviews across friend groups, couples, families, solo travelers, budget, premium, food, nightlife, outdoors, culture, Africa, Asia, Europe, Latin America, North America, Oceania, phone, desktop, planner, Trip Studio, map, public share, feedback, and save/reopen surfaces. `qa/beta-human-review-scorecard.md` defines required reviewer evidence, scorecard fields, and severity rules. `npm run qa:beta-review-readiness` passed `11/11`; `QA_BETA_REVIEW_MIN_COMPLETED=25 npm run qa:beta-review-readiness` correctly fails with `0/25` completed reviews until real beta records are entered. Launch signoff now checks the beta human-review register and passed `53/53` against production commit `41cb7fd6d570708ec31d650dfd531bced8482c49`. Evidence: `qa/beta-human-review-readiness-2026-05-21.md`, `qa/beta-human-review-register.json`, and `qa/beta-human-review-scorecard.md`.

The newest production visual-review checkpoint turns visual QA review cadence into launch-signoff evidence. `npm run qa:launch-signoff` now reads `qa/production-visual-review-register.json` and fails unless the review is fresh, owned, attached to the current live production commit/deployment URL, tied to a passing `20/20` production visual artifact, covers landing/login/signup/public-share across five viewports, includes stable-route diff coverage, has all reviewed screenshots present, records a future next-review date, and has no unresolved blockers. Commit `678044e` is deployed to Vercel production with health `ok`, `11/11`; exact-commit signoff passed `42/42`; log-driven signoff passed `41/41`. Evidence: `qa/production-visual-review-cadence-2026-05-21.md` and `qa/visual-baseline-production-visual-review-cadence-2026-05-21-678044e/`.

The newest beta-readiness checkpoint makes representative trip coverage enforceable instead of purely narrative. `npm run qa:prompt-suite` now requires at least `60` planner fixtures and explicit beta coverage across friend groups, couples, families, solo travelers, budget, premium, food, nightlife, outdoors, culture, and Africa/Asia/Europe/Latin America/North America/Oceania. The fixture set now includes solo trips for Kyoto, Seattle, Bali, and Nairobi, and `npm run qa:planner-actuals:beta-representative` defines a 25-trip generated-actuals preset for the next live beta map-trust run. Commit `678044e` is deployed to Vercel production with health `ok`, `11/11`; the non-mutating production release gate passed `10/10`, including production visual QA `20/20`, viral loop `5/5`, Athens public-share map integrity, and prompt-suite production actual validation `60/60`. Evidence: `qa/beta-representative-prompt-coverage-2026-05-21.md` and `qa/visual-baseline-production-visual-review-cadence-2026-05-21-678044e/`.

The newest rollback-readiness checkpoint closes a current-production drift gap in launch signoff. `npm run qa:launch-signoff` now compares `qa/launch-rollback-plan.json` against live `/api/health` deployment metadata and fails unless `knownGoodDeployment.commit`, `knownGoodDeployment.url`, and `verifiedBy` match the current verified production commit and launch-signoff command. The rollback plan is updated to commit `678044eb1feb626f9b8ece8d38cb145d1ca5f249` on deployment `globe-travel-1rw32jba6-rodney-blairs-projects.vercel.app`; exact-commit launch signoff passed `42/42`, and a stale rollback-plan negative test failed as expected. Evidence: `qa/launch-signoff-rollback-current-deployment-2026-05-21.md`.

The newest release-operations hardening closes a same-day evidence ambiguity in launch signoff and now requires production visual evidence. `npm run qa:launch-signoff` requires postdeploy production evidence to include the live production commit from `/api/health` or `QA_LAUNCH_EXPECTED_COMMIT`, a visual-inclusive production release gate `10/10`, and production visual QA `20/20`; its default evidence artifact points at the current production-evidence record. The older same-day release note now fails as expected when it lacks the current production commit. Commit `678044e` deployed to Vercel production with health `ok`, `11/11`; the full production release gate passed `10/10`, including production visual QA `20/20`; and log-driven launch signoff passed `41/41` against the workflow-style production release log. Evidence: `qa/launch-signoff-current-production-evidence-2026-05-21.md`, `qa/launch-signoff-production-visual-evidence-2026-05-21.md`, and `qa/visual-baseline-production-visual-review-cadence-2026-05-21-678044e/`.

The latest release-ops maintenance pass closes artifact-date drift across the remaining beta human-review gates. `npm run qa:beta-review-readiness`, `npm run qa:beta-review-packets`, `npm run qa:beta-review-progress`, and `npm run qa:beta-review-intake` now derive their default output date from `qa/beta-human-review-register.json`, so routine reruns keep regenerating the active `2026-05-21` review queue instead of creating stray current-date artifacts. The same release-ops pattern is now in place for public-launch status, production visual review scheduling, production visual review intake, production monitoring, and beta review readiness/progress/intake.

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

The newest release-operations hardening prevents evidence-only commits from repeatedly triggering Vercel production deploys. `client/vercel.json` now defines an ignored build step, backed by `client/scripts/vercel-ignore-build.mjs`, which skips only conservative documentation/evidence-only changes while continuing builds for runtime-relevant paths. Dry-runs proved the latest evidence-only commit skips and the billing runtime commit still builds; `npm run lint` and `npm run build` passed. Evidence: `qa/vercel-ignore-docs-only-build-2026-05-21.md`.

The Vercel ignored-build control is now proven end to end. A QA-only probe commit `5a9e78c` changed only `qa/vercel-ignore-end-to-end-probe-2026-05-21.md`; the ignore script exited `0`, and production stayed on the prior runtime/config deployment `60a565a9566c28c48c03407204e93a278389466a` with health `11/11` across repeated checks. Evidence: `qa/vercel-ignore-end-to-end-probe-2026-05-21.md`.

The newest production monitoring checkpoint fixes a release-workflow false-failure path. The GitHub Actions production release gate now uploads its required log separately from the production visual artifact, and uploads the visual artifact only when `include_production_visual` is enabled. Manual visual-disabled investigation runs can now pass cleanly, while scheduled gates still require visual QA and its artifact. Commit `6cc678c` deployed to Vercel production with health `11/11`, then the full non-mutating production release gate passed `10/10` with visual QA `20/20`, viral loop `5/5`, Athens map integrity, and prompt-suite production actual validation `56/56`. Evidence: `qa/production-release-workflow-artifact-hardening-2026-05-21.md` and `qa/visual-baseline-production-workflow-artifact-2026-05-21-6cc678c/`.

The newest deployment-hygiene checkpoint prevents GitHub workflow-only release-ops commits from creating unnecessary Vercel production deployments. `.github/workflows/**` is now part of the Vercel skip-safe policy, while runtime, package/config, `client/**`, and unknown paths still force a build. Commit `06eb269` deployed the ignore-script change to Vercel production with health `11/11`, then the non-mutating postdeploy production release gate passed `9/9` with visual disabled intentionally for speed. Evidence: `qa/vercel-ignore-workflow-only-build-2026-05-21.md`.

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

The newest release-candidate coverage checkpoint moves that multi-itinerary public-share Browser loop into the orchestrated predeploy gate. `QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1 npm run qa:release-candidate` now runs `qa:share-multi-itinerary-ui` as part of the local launch-candidate matrix. Focused validation passed `18/18`; the multi-itinerary task passed `37/37` with ten disposable fixtures, social-card image checks, recipient feedback flows, owner feedback readback, feedback refresh, and cleanup. Commit `a7a1416` deployed to Vercel production with health `11/11`, then the non-mutating postdeploy production release gate passed `9/9` with visual disabled intentionally for speed. Evidence: `qa/release-candidate-share-multi-integration-2026-05-21/README.md`.

The latest full local launch-candidate checkpoint is now green with every optional gate enabled, including the new multi-itinerary share loop. `npm run qa:release-candidate` passed `33/33` with share fixture sweep, multi-itinerary Browser UI `37/37`, hosted Stripe Checkout `15/15`, hosted Stripe portal `16/16`, responsive visual QA `50/50`, prompt suite `56/56`, billing recovery `15/15`, Trip Studio owner/feedback/recovery coverage, slow-network recovery, and cleanup. Evidence: `qa/release-candidate-full-with-multi-2026-05-21/`, `qa/visual-baseline-2026-05-21-full-with-multi-2026-05-21/`, `qa/stripe-checkout-browser-full-with-multi-2026-05-21/`, and `qa/stripe-portal-browser-full-with-multi-2026-05-21/`.

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
   - Latest May 21 recovery check: commit `f07fbad` is live on Vercel production; missing Trip Studio routes now render recovery instead of lingering on the loading skeleton, the Athens public-share viral loop passes `5/5`, and full production `qa:release-production` passes `10/10` with production visual QA `20/20`.
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

Current signoff checkpoint: `npm run qa:launch-signoff` now provides the fast evidence audit for release meetings. It passed `32/32` on 2026-05-21, proving production health `11/11`, full local release-candidate evidence `35/35`, responsive visual QA `50/50`, all `50` visual screenshots present, hosted Stripe evidence, launch docs, fresh postdeploy production evidence, current launch risk register, current rollback plan, and fresh regional generated-itinerary map-trust evidence for Istanbul, Seoul, Bangkok, Marrakech, Cape Town, and Sydney. Use `QA_LAUNCH_EXPECTED_COMMIT=<sha>` when a launch meeting needs the audit to prove a specific production commit is live.

Current production checkpoint: commit `f07fbad` (`f07fbadc7fdad3c54d23123d2e0e9473609c5dc3`) is the live production deployment for the latest recovery fix. Production `qa:release-production` passed `10/10`, production visual QA passed `20/20` in `qa/visual-baseline-production-recovery-2026-05-21-f07fbad/`, and the fast launch audit should be run with `QA_LAUNCH_EXPECTED_COMMIT=f07fbadc7fdad3c54d23123d2e0e9473609c5dc3`.

Planner actuals checkpoint: `npm run qa:release-candidate` now supports `QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1`, which inserts live generated-itinerary map-trust checks and a prompt-suite cross-check into the predeploy release-candidate orchestrator. This gives Phase 1 and beta releases a repeatable way to prove real planner output, mapped stops, unique pins, country consistency, usable routes, and cleanup inside the same release-candidate evidence packet.

Full release-candidate checkpoint: the standing full local launch packet now includes planner actuals directly. `QA_RELEASE_ARTIFACT_NAME=release-candidate-full-with-multi-planner-2026-05-21 QA_VISUAL_RUN_ID=full-with-multi-planner-2026-05-21 QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=1 QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1 QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1 QA_RELEASE_PLANNER_ACTUALS_PRESET=regional-edge-cities QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1 QA_RELEASE_INCLUDE_STRIPE_PORTAL=1 QA_STRIPE_CHECKOUT_ARTIFACT_NAME=stripe-checkout-browser-full-with-multi-planner-2026-05-21 QA_STRIPE_PORTAL_ARTIFACT_NAME=stripe-portal-browser-full-with-multi-planner-2026-05-21 npm run qa:release-candidate` passed `35/35`.

Scheduled production release checkpoint: `.github/workflows/production-release-gate.yml` now runs launch signoff after the production release gate by default. The workflow passes its freshly captured production release log into `npm run qa:launch-signoff`, so scheduled operations prove both live production behavior and the standing launch packet. Launch signoff treats explicit `Date:` / JSON `checkedAt` values as evidence dates and uses file mtime for generated CI logs, which keeps static evidence from going stale without breaking freshly captured workflow output. This matters because docs/evidence-only commits intentionally skip Vercel and should not make signoff depend on the GitHub workflow SHA matching the deployed app SHA.

Launch-blocker checkpoint: `qa/launch-risk-register.json` is now the machine-readable no-open-P0/P1 source for launch signoff. `npm run qa:launch-signoff` fails if release-candidate evidence, visual evidence, or the risk register is older than `QA_LAUNCH_MAX_EVIDENCE_AGE_DAYS` days, if any P0/P1 item is not closed, or if any open P2 lacks owner, target month, and meaningful accepted-risk notes.

Rollback checkpoint: `qa/launch-rollback-plan.json` is now part of launch signoff. The gate fails if rollback evidence is stale, does not identify the production alias and known-good deployment, lacks restore steps, or omits post-rollback `qa:release-production` and `qa:launch-signoff` verification commands.

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
