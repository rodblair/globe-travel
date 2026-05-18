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
- `npm run qa:a11y` passes across the core route set.
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

- Auth/guest next handoff was hardened. Protected routes now redirect to login with a safe `next` destination, login/signup/guest actions preserve that destination through hydrated route search state, and guest start can carry a planner prompt through to Trip Studio instead of dropping the user's trip idea. Evidence: `qa/auth-guest-next-handoff-2026-05-18.md`; automated gate: `npm run qa:auth-access` passed `14/14`; `npm run lint`, `npm run build`, and `git diff --check` passed.
- Planner geocode quality was hardened. Strict Mapbox candidate scoring now prefers POIs, rejects wrong-country and far-away weak hits, avoids accepting street/address false positives for venue names, and uses exact destination anchors for Athens, Lisbon, Mexico City, and Tokyo, including country-qualified labels such as `Athens, Greece`. A new `npm run qa:geocode-quality` gate passed `14/14` and is now part of the release-candidate gate.
- Lisbon generated itinerary reliability was improved with trusted-place planner guidance and canonical pins for additional launch-risk venues including Padrão dos Descobrimentos, À Margem, Chapitô à Mesa, Canto da Vila, Oficina do Duque, Nicolau Lisboa, and Rooftop Santa Justa. Browser verified a kept generated public share page at `/t/god4jj9fi9` rendered the itinerary, Mapbox canvas, map markers, share/copy actions, and no console errors, then the disposable trip and guest were deleted.
- Live generated-itinerary map trust now has a repeatable default gate. `npm run qa:planner-actuals` creates a disposable guest/trip, sends a real Lisbon planner prompt through `/api/chat`, verifies every generated day has mapped Portugal stops, unique pins, usable routes, and cleanup, and exports actuals for prompt-suite cross-checking. Evidence: `qa/planner-generated-actuals-2026-05-18.md` and `qa/planner-generated-actuals-lisbon-2026-05-18.json`; automated gates: `npm run qa:planner-actuals` passed `3/3` and `QA_PROMPT_SUITE_ACTUALS=../qa/planner-generated-actuals-lisbon-2026-05-18.json npm run qa:prompt-suite` passed `56/56`.
- Planner start confidence was rechecked after the auth release. `npm run qa:planner-handoff` passed `17/17`, `npm run qa:slow-network` passed `7/7`, `npm run qa:prompt-suite` passed `56/56`, and `QA_VISUAL_ROUTES=planner QA_VISUAL_VIEWPORTS=phone,laptop,desktop QA_VISUAL_ARTIFACT_NAME=visual-baseline-2026-05-18-planner-start npm run qa:visual` passed `3/3`. Evidence: `qa/visual-baseline-2026-05-18-planner-start/`.
- Planner word-duration handoff was repaired. Browser reproduced `Plan five days in Athens...` creating `4 Days in five days in Athens`; the shared planner parser now extracts word-based day counts and clean destinations, Trip Studio opens as `5 Days in Athens` with five day tabs, and `npm run qa:planner-handoff` now verifies this Browser-style path. Evidence: `qa/planner-word-duration-handoff-2026-05-18.md`.
- Account profile identity validation was hardened. `PATCH /api/profile` now rejects invalid and overlong public identity updates, the account form shows field limits and clear username rules, profile fields sync after async load/refresh, and Browser verified invalid-error recovery plus a valid guest profile save without overflow. Evidence: `qa/account-profile-identity-validation-2026-05-18.md`; automated gate: `npm run qa:saved-account` passed `13/13`.
- Itinerary map stop verification was repaired.
- Six saved itineraries were retested locally.
- `npm run lint` and `npm run build` passed.
- Commit `a59fb4a` was deployed to Vercel production.
- Production release verification now includes public share viral-loop checks. The stable Athens public share passed remote affordance, copy-link, native-share payload, recipient CTA, visual, share integrity, and prompt-suite gates in the integrated `qa:release-production` run.

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
- 2026-05-18: Verified auth/guest protected-destination handoff. Browser confirmed `/login?next=/chat?q=Plan five days in Athens...` renders guest and signup links with the encoded planner destination, and automated auth access passed `14/14`.
- 2026-05-18: Rechecked planner start confidence and responsive planner layout. Planner handoff, slow-network recovery, prompt-suite coverage, and planner visual QA all passed; guest fixtures and disposable trips cleaned up successfully.
- 2026-05-17: Fixed mobile Trip Studio chat overlap by moving the drawer below the top action grid on phone viewports.
- 2026-05-17: Tested first-plan creation from `/chat`. The planner created a Trip Studio from natural language and generated itinerary items. Found and fixed a P1 destination anchoring bug where theme-heavy prompts such as "Porto food and viewpoints" could geocode Porto stops to the wrong country. Retested the same prompt and confirmed Porto stops mapped to Portugal.
- 2026-05-17: Cleaned temporary QA trips from Saved after planner testing.
- 2026-05-17: Final mobile Browser sweep passed for `/`, `/chat`, `/saved`, `/saved?tab=journal`, `/account`, `/account?tab=billing`, `/login`, `/signup`, the five-day Athens Trip Studio page, and the Athens public share page: no app-owned overflow, missing labels, stale branding, or undersized app-owned touch targets remained.
- 2026-05-17: `npm run lint` passed.
- 2026-05-18: Added `npm run qa:a11y` as a release-candidate gate. The gate injects axe into local Chrome, checks serious/critical accessibility violations, validates the global skip link and main-content target, and tabs through early focus paths across landing, planner, saved, account, billing, auth, and public share at phone and desktop widths.
- 2026-05-18: Fixed accessibility findings from the new gate: added a global skip link, corrected the destination pin ARIA role, darkened secondary ink/brass/moss/terracotta tokens to meet contrast on paper and wash surfaces, improved selected public-share sentiment helper contrast, and raised low-opacity foreground utility contrast for operational copy.
- 2026-05-18: `QA_SHARE_SLUG=x3m2c8cnws npm run qa:a11y` passed `16/16`. In-app Browser also verified public share and account billing have the skip link, no horizontal overflow, and expected visible route content; Browser screenshot capture continued to time out, so durable screenshots came from the Chrome visual runner.
- 2026-05-18: Focused visual QA after the accessibility color/token polish passed `15/15` for landing, account billing, and public share across phone, tablet, laptop, desktop, and wide viewports.
- 2026-05-18: Strengthened commercial upgrade readiness from the saved journal limit path. Removed the unshipped `Export to PDF (coming soon)` paid feature, made the journal upgrade modal an accessible dialog, added visible checkout failure recovery with `Try again`, and added Browser evidence in `qa/commercial-upgrade-modal-recovery-2026-05-18.md`.
- 2026-05-18: Expanded `npm run qa:billing-recovery` to exercise the journal upgrade modal through `/saved?tab=journal&qaUpgradeModal=1&qaCheckoutFailure=1`; local billing recovery passed `13/13`, including focus trap and Escape close behavior.
- 2026-05-18: Hardened public share feedback validation for logged-out recipients. The optional email field now validates before submission with explicit recovery copy, the feedback textarea enforces the API's 600-character limit, `npm run qa:share-recovery` covers invalid optional email plus forced feedback failure recovery, and public share viral/recovery scripts now exit cleanly after summary output. Evidence: `qa/public-share-feedback-validation-2026-05-18.md`.
- 2026-05-18: Hardened saved journal modal accessibility. Added a shared dialog focus hook, applied it to the journal editor, note reader, delete confirmation, and upgrade modal, added accessible note-card action labels, and expanded `npm run qa:saved-account` to verify focus containment and Escape close for the journal editor/reader/delete dialogs. Browser confirmed the note editor focus behavior on `/saved?tab=journal`; `qa:saved-account` passed `12/12`, `qa:billing-recovery` passed `13/13`, accessibility passed `16/16`, and focused saved visual QA passed `6/6`. Evidence: `qa/saved-journal-dialog-accessibility-2026-05-18.md`.
- 2026-05-18: Strengthened planner start-to-trip regression coverage. Browser verified landing to signup guest access, `/chat?q=...` forced failure recovery with prompt preservation and `Try again`, and delayed Porto planner handoff into Trip Studio with initial generation copy. `npm run qa:planner-handoff` now covers those Browser-style states and passed `17/17`; `npm run qa:slow-network` passed `7/7`, `npm run qa:prompt-suite` passed `53/53`, and focused planner visual QA passed `3/3`. Evidence: `qa/planner-start-browser-regression-2026-05-18.md`.
- 2026-05-18: Hardened public share map fallback trust. Public share cards can force static maps in development with `?qaMapFallback=1`, static route cards now label themselves as `Static Route`, and every fallback card shows `Static route preview` so logged-out recipients are not misled during Mapbox outages. Browser confirmed the Athens public share preserved title, itinerary, feedback, and CTA with `0` Mapbox canvases and no horizontal overflow; `npm run qa:map-fallback` passed `1/1` and is now part of `npm run qa:release-candidate`. Evidence: `qa/public-share-map-fallback-2026-05-18.md`.
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
- 2026-05-17: Active goal confirmed for the next several months of full-platform testing, Browser-driven user journey QA, visual QA, design-system polish, reliability hardening, viral sharing loops, subscription readiness, and release operations. Added `PLATFORM_QA_COMPLETION_PLAN.md` as the execution plan with monthly objectives, weekly QA cadence, Browser evidence standards, design QA gates, and launch-candidate criteria.
- 2026-05-17: Resolved the Vercel production queue blocker by safely removing six stale queued deployments. Deployment `dpl_ET7i958vfsvgGRis4f4RXQn3NTgx` for commit `2a554034cddba6a0d7dfff37a794297247a8ba62` became ready and the production aliases now point to `globe-travel-22uv0cm02-rodney-blairs-projects.vercel.app`. Production `/api/health` returned `200`; production `qa:ops` passed 2/2, `qa:commercial` passed 4/4, and `qa:share` passed 4/4 for the Athens five-day public itinerary.
- 2026-05-17: Updated `qa:smoke` so public share smoke checks server-rendered share metadata instead of client-rendered Suspense content. Production `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:smoke` passed 8/8.
- 2026-05-17: Added Month 2 planner/map prompt-suite QA with 52 fixtures across trip lengths, cities, budgets, group types, and travel styles. Fixed destination extraction regressions where Athens prompts with dates could extract `mid September`, Porto theme prompts could extract `Plan Porto`, and natural `Plan City for N days...` phrasing could fail. `npm run qa:prompt-suite` passed 52/52; evidence is in `qa/planner-map-prompt-suite-2026-05-17.md`.
- 2026-05-17: Expanded public share QA so `npm run qa:share` can validate either `QA_SHARE_SLUG` or comma-separated `QA_SHARE_SLUGS`. Added evidence in `qa/public-share-multi-itinerary-2026-05-17.md`; production Athens five-day remains the stable baseline slug until more generated public itineraries are promoted.
- 2026-05-17: Added `npm run qa:prompt-actuals` to export live public-share itinerary integrity into the prompt-suite actuals schema. Production Athens five-day actuals exported from `x3m2c8cnws`, then `QA_PROMPT_SUITE_ACTUALS=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-suite` passed 52/52 static checks plus the Athens generated-output map trust check.
- 2026-05-17: Restored the Trip Studio readiness dock that exposed group review, crew brief, friend feedback, and planner workflows. Clarified read-only shared-preview state by disabling owner-only save/share/workflow controls for non-owner sessions. Added `npm run qa:studio`; local `QA_TRIP_ID=bc1031dc-0df5-4c0d-9902-2aaaa7193ae0 QA_SHARE_SLUG=x3m2c8cnws npm run qa:studio` passed after the fix. Optional `QA_TRIP_ID=bc1031dc-0df5-4c0d-9902-2aaaa7193ae0 npm run qa:smoke` now checks the Studio API contract and passed 8/8.
- 2026-05-17: Added `npm run qa:studio-actions` for mutation-safe Trip Studio action coverage. The runner creates a disposable guest trip, seeds mapped stops, verifies update/reorder/move/delete/optimize/save/share/public-read behavior, and cleans up by default. Local run passed 18/18; a kept fixture was inspected in Browser and then cleaned up.
- 2026-05-17: Added Vercel production `NEXT_PUBLIC_SITE_URL=https://globe-travel-two.vercel.app`, then redeployed commit `fd61f346db3a1c8a60713d3b1c4cbcc527b00177` as production deployment `dpl_Gi5HXfZL4zCdu7g3CbCryP5FN1F1`. Production `/api/health` now reports `status: "ok"`, `summary.criticalMissing: 0`, and `summary.warningMissing: 0`; production `QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops` passed 2/2.
- 2026-05-18: Refreshed `PLATFORM_QA_COMPLETION_PLAN.md` as the active next-90-day execution plan. The plan now starts with true Browser click/type Trip Studio coverage, Browser-owned fixture evidence, multi-itinerary share QA, visual regression baselines, monthly critique/audit scorecards, and launch-candidate gates for the next several months.
- 2026-05-18: Added `npm run qa:studio-browser-fixture` for routed Browser-owned Trip Studio fixtures. Browser-tested owner-visible Trip Studio actions on disposable fixture `396044d2-153b-4de2-b0c0-ef62f7dd76a2`: day switching, item title edit by typing, save, share, View share, and public read-only handoff. Local `QA_EXPECT_OWNER=0 QA_TRIP_ID=396044d2-153b-4de2-b0c0-ef62f7dd76a2 QA_SHARE_SLUG=qaa827f8c6 npm run qa:studio` passed 7/7 and `QA_SHARE_SLUG=qaa827f8c6 npm run qa:share` passed 4/4 after route seeding. Disposable fixtures `a827f8c6` and `824560cd` were cleaned up.
- 2026-05-18: Expanded `npm run qa:studio-actions` from 18 to 21 checks by adding deterministic swap-option and apply-swap coverage for Athens fixtures. Local run passed 21/21 and verified `Little Tree Books & Coffee` persisted with a mapped place. Browser also opened the mobile-width swap menu at 390 x 844 with no horizontal overflow and confirmed `Similar nearby`, `More relaxed`, and `More iconic`; Browser apply-swap click remains a follow-up because the menu shifted and a stale target navigated to Plan. Published fixture `qaa2c199c6` passed local `qa:studio` 7/7 and `qa:share` 4/4 before cleanup.
- 2026-05-18: Closed the Browser apply-swap gap by making the mobile swap preference chooser a fixed bottom-sheet style panel while preserving the compact desktop dropdown. Added `destination_query: "Athens, Greece"` to Browser-owned fixtures. Browser at 390 x 844 opened the swap chooser, clicked `More relaxed`, selected `Little Tree Books & Coffee`, confirmed `Swapped to Little Tree Books & Coffee`, confirmed the original cafe disappeared, and confirmed no horizontal overflow. Published fixture `qa5a3f765e` passed local `qa:studio` 7/7 and `qa:share` 4/4 before cleanup.
- 2026-05-18: Added a visible `Maps built` success state to Trip Studio Build maps and expanded `npm run qa:studio-actions` to 23 checks with hydrate-map coverage. Local run passed 23/23, including route persistence after Build maps when Mapbox is configured. Browser at 390 x 844 clicked Build maps on fixture `f5eb0f94-910d-4216-9f0c-5dd12b66e978`, confirmed `Maps built`, no rebuild error, same Trip Studio URL, and no horizontal overflow. Published fixture `qa946392b8` passed local `qa:studio` 7/7 and `qa:share` 4/4 before cleanup.
- 2026-05-18: Added visible Rewrite day request state. Rewrite now opens Planner chat, shows `Rewrite request for Day X is opening in Planner chat.`, disables rewrite controls while sending, and surfaces failure copy if chat is unavailable or the send fails. Browser at 390 x 844 clicked Rewrite day on fixture `5f0b4e67-3068-4f3e-bc2a-a3489b968540`, confirmed Planner chat opened, pending/requesting state appeared, the planner request appeared in chat, Day 1 generated new stops including `Ancient Agora of Athens` and `Kuzina`, and no horizontal overflow appeared. Published fixture `qa56cbea9d` passed local `qa:studio` 7/7 and `qa:share` 4/4 before cleanup.
- 2026-05-18: Added explicit mobile-friendly `Move earlier` / `Move later` controls for Trip Studio itinerary items and restricted drag start to the grip handle. Browser at 390 x 844 verified reorder controls on fixture `e78bb398-0cc4-461b-804d-1b72d8ef948a`, clicked `Move QA Browser Plaka Cafe c7616ad4 earlier`, confirmed Plaka Cafe moved before Acropolis, confirmed adjacent time slots moved with the reordered items, reloaded the page, and confirmed the sequence persisted with no horizontal overflow.
- 2026-05-18: Added dev-only Browser QA flags for Trip Studio failure states: `?qaBuildMapsFailure=1` and `?qaRewriteUnavailable=1`. Browser at 390 x 844 verified Build maps shows `Could not rebuild the maps...` without a false success state, verified Rewrite day shows `Planner chat is still connecting...` without a pending rewrite notice, and confirmed no horizontal overflow. Fixture `c8dbe3d4-a30b-4944-89c1-f0216b300030` / run `e010ca3c` was cleaned up.
- 2026-05-18: Closed direct drag gesture coverage by replacing the grip's native HTML5 drag dependency with a pointer-driven drag fallback and centralizing same-day reorder operations. Browser at 390 x 844 dragged `QA Browser Lycabettus View 14bb4605` above Acropolis, confirmed the visible order and time slots updated, reloaded the Trip Studio page, and confirmed the direct-drag order persisted with no horizontal overflow. Fixture `37f2185a-4a66-4e6e-8faf-07811442c24e` / run `14bb4605` was cleaned up.
- 2026-05-18: Added `qa/trip-studio-responsive-visual-baseline-2026-05-18.md` for Trip Studio action surfaces. Browser viewport overrides checked `390 x 844`, `768 x 1024`, and `1280 x 800`; top owner actions and itinerary controls were visible/reachable, checked controls met `44px` touch-target sizing, and no horizontal overflow appeared. In-app Browser screenshot capture still timed out on this Mapbox-heavy page, so durable screenshot artifacts remain a visual-regression follow-up. Fixture `6cede65c-df12-4d7d-9067-f49cc7537645` / run `f10c1049` was cleaned up.
- 2026-05-18: Added `qa/public-account-responsive-visual-baseline-2026-05-18.md` for public share and account/billing surfaces. Browser viewport overrides checked `/t/x3m2c8cnws`, `/account`, and `/account?tab=billing` at `390 x 844`, `768 x 1024`, and `1280 x 800`; public share, profile, and billing controls rendered without horizontal overflow or visible app errors, and checked controls/forms met touch sizing.
- 2026-05-18: Added `qa/planner-handoff-responsive-visual-baseline-2026-05-18.md` for the first-time planner entry and `/chat?q=...` handoff. Fixed the mobile planner empty-state layout so the primary trip input is visible in the first phone viewport, and fixed a query-prompt auto-send race where a canceled timer could mark the prompt as handled before Trip Studio opened. Browser verified `390 x 844`, `768 x 1024`, and `1280 x 800` planner geometry with no horizontal overflow, then verified a normal five-day Athens query prompt opened Trip Studio as `5 Days in Athens` with day tabs, Save, Planner chat, Optimize day, Build maps, and Share available. Temporary Browser-created trips `8932993f-a960-464d-873a-3d40f1378d60` and `a52d8ef8-4579-4ad9-9f81-5f1f871854b3` were cleaned up.
- 2026-05-18: Post-fix local gates passed: `npm run qa:studio-actions` passed 23/23 with cleanup, `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed 4/4, `QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial` passed 4/4, `npm run lint` passed, `npm run build` passed, and `git diff --check` passed.
- 2026-05-18: Added `npm run qa:planner-handoff` so the `/chat?q=...` handoff regression is now covered by a repeatable local gate. The gate checks the query-prompt source guard, prompt-preserving Trip Studio target, labeled mobile composer, `/chat?q` route reachability, five-day Athens draft API creation, and cleanup. Local run passed 10/10 and deleted disposable draft `e17382a4-f39f-48d6-82cf-9ad982b15a32`. Browser at `390 x 844` then retested the full screen journey from `/saved` to `/chat?q=...` to Trip Studio, confirmed `5 Days in Athens`, all five day tabs, owner actions, prompt URL preservation, no visible errors, and no horizontal overflow. Temporary Browser trip `1146c861-c330-494b-8c09-38bf41c4638b` was cleaned up.
- 2026-05-18: Re-ran the planner-handoff release gate after evidence updates. `npm run qa:planner-handoff` passed 10/10 and cleaned disposable draft `a29b14b6-3c97-4a9f-a324-7b21b4ff6aa4`; `npm run lint` passed; `npm run build` passed; `git diff --check` passed.
- 2026-05-18: Added `npm run qa:share-fixtures` and evidence in `qa/public-share-fixture-multi-itinerary-2026-05-18.md`. The fixture tool creates deterministic public Lisbon, Kyoto, and Mexico City itineraries with mapped places and route rows for every day, then supports cleanup by trip IDs/run ID. Local `QA_SHARE_SLUGS=qa671ee6de1,qa671ee6de2,qa671ee6de3 npm run qa:share` passed 12/12 across three generated public itineraries, validating public API, mapped stop integrity, single-country days, route coverage, feedback API readability, and metadata. Browser at `390 x 844` opened generated Lisbon public share `qac699634a1`, confirmed all three days, recipient CTA, mobile feedback fields at `316px` width with no horizontal overflow or visible errors, then cleaned up both fixture runs.
- 2026-05-18: Post multi-share fixture gates passed: `npm run qa:planner-handoff` passed 10/10 and cleaned disposable draft `81dd9b49-ab9f-45c6-b4d4-e11d34ac4b6e`; `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed 4/4; `npm run lint` passed; `npm run build` passed; `git diff --check` passed.
- 2026-05-18: Added `qa/month-1-critique-audit-scorecard-2026-05-18.md`. Browser checked landing, planner, saved, account, billing, public share, and Trip Studio at `390 x 844`, `1440 x 950`, and `1728 x 1050`. Fixed app-owned small target regressions in landing nav, sidebar brand/account links, and planner composer input. Retest confirmed no app-owned visible controls below `44px` on the affected landing/planner/saved/account surfaces and no horizontal overflow. Month 1 scorecard: Audit Health `16/20`, Design Health `31/40`, both above target. Remaining P2s: third-party Mapbox control sizing, operational density, and durable screenshot capture path.
- 2026-05-18: Post-scorecard gates passed: `npm run lint` passed; `npm run qa:planner-handoff` passed 10/10 and cleaned disposable draft `9d5e4ac2-9ace-46db-8fb1-195a5f3fff89`; `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed 4/4; `npm run build` passed; `git diff --check` passed.
- 2026-05-18: Added `npm run qa:share-feedback` and evidence in `qa/public-share-feedback-loop-2026-05-18.md`. The gate verifies public feedback API readability, safe invalid feedback rejection, valid friend reaction submission, public readback, and cleanup; it also supports `QA_KEEP_FEEDBACK=1` for Browser inspection and `QA_CLEANUP_FEEDBACK_ID` cleanup. Stable Athens share `x3m2c8cnws` passed 5/5 and cleaned inserted feedback `ce64495c-6513-4b1d-8cc6-b959245ec2ac`. Disposable Lisbon fixture `qa713d52c81` passed `qa:share-feedback` 5/5; Browser at `390 x 844` then confirmed the kept reaction rendered on the public share page with author/comment/reaction count, touch-sized feedback fields, no overflow, and share/recipient CTAs still present. Feedback `f24c0de3-e170-4910-adcb-fbead43c35ef` and fixture run `713d52c8` were cleaned up.
- 2026-05-18: Confirmed the active goal remains the several-month platform-readiness goal. Refreshed `PLATFORM_QA_COMPLETION_PLAN.md` with a command-center roadmap for Months 1-6 and the next four execution sprints: owner feedback/share-loop closure, visual evidence and responsive polish, planner/map trust expansion, and commercial release-gate hardening.
- 2026-05-18: Closed the owner feedback/share-loop sprint with `qa/owner-feedback-refresh-2026-05-18.md`. Hardened `/api/trips/[id]/feedback` so Trip Studio feedback readback only returns for the owner or public trips, then extended `npm run qa:share-feedback` with optional `QA_TRIP_ID` / `QA_VERIFY_TRIP_FEEDBACK=1` coverage. Disposable owner fixture `qa6705e6571` passed the public feedback gate and Trip Studio feedback readback gate 6/6; Browser opened the owner Trip Studio, confirmed `1 review`, `QA Friend e8d89a4f`, readiness copy `crew reacting`, and completed `Refresh plan from feedback` with a `Feedback Refresh` result marked `COMPLETED` and `"status": "ready"`. All disposable feedback and fixture data from runs `6705e657` and `47de7d63` were cleaned up.
- 2026-05-18: Added `npm run qa:visual` with Chrome-backed `playwright-core` viewport capture to solve the durable visual evidence gap left by in-app Browser screenshot timeouts on Mapbox-heavy pages. The first run created `qa/visual-baseline-2026-05-18/README.md`, `summary.json`, and 50 screenshots covering landing, planner, saved trips, saved trip notes, account profile, account billing, login, signup, Athens public share, and a disposable Trip Studio fixture at `390`, `768`, `1280`, `1440`, and `1728` widths. Initial run exposed one real desktop auth-brand touch-target issue, fixed in `AuthCanvas`; retest passed 50/50 with no horizontal overflow, no app-owned targets below 44px, required markers present, and screenshots captured. Disposable Trip Studio fixture `9966a66f-da45-42e0-9846-8ee3d41ee03f` / run `52f3ca6a` was cleaned up.
- 2026-05-18: Extended `npm run qa:visual` with optional pixel-diff comparison using `QA_VISUAL_BASELINE_DIR`, `QA_VISUAL_RUN_ID`, `QA_VISUAL_DIFF_THRESHOLD`, `QA_VISUAL_ROUTES`, `QA_VISUAL_VIEWPORTS`, and `QA_VISUAL_DIFF_ROUTES`. The first full stable-route compare created `qa/visual-baseline-2026-05-18-compare-stable/README.md` and `summary.json`; it checked 45/45 route-viewport combinations against `qa/visual-baseline-2026-05-18`, pixel-compared 30 stable shell screenshots under the default 1.5% threshold, and kept dynamic saved/public-share surfaces on layout, marker, touch-target, overflow, and screenshot checks to avoid false failures from user-data changes.
- 2026-05-18: Implemented the Mapbox control policy for itinerary and public share maps. Actionable Mapbox navigation controls now use app-scale `46px` targets, token-matched styling, and clearer hover/focus states; attribution/legal links remain compact. `npm run qa:visual` now reports `Small Map Controls` separately from app-owned targets and fails actionable map controls below the target bar. Focused retest `QA_TRIP_ID=f1239381-f38f-4ede-9e2c-9d5321c27a59 QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_RUN_ID=mapbox-policy QA_VISUAL_ROUTES=public-share,trip-studio npm run qa:visual` passed 10/10 route-viewports with zero small app targets and zero small actionable map controls; fixture `f1239381-f38f-4ede-9e2c-9d5321c27a59` / run `cc52e60f` was cleaned up. Added Browser evidence in `qa/mapbox-control-policy-browser-2026-05-18.md`: the in-app Browser loaded `/t/x3m2c8cnws`, found the public CTA, detected no horizontal overflow, and measured 12 public-itinerary Mapbox zoom controls at `46 x 46` with no small actionable map controls.
- 2026-05-18: Hardened Trip Studio recovery states and fixed a real laptop overlap found by the new recovery gate. `Optimize day` now checks failed API responses; share/copy/share-sheet actions catch failures with visible recovery copy; workflow startup has a QA failure path; itinerary delete now requires inline confirmation; and the desktop/laptop itinerary pane no longer overlaps the right readiness/workflow panel at `1280px`. Added `npm run qa:studio-recovery`, which verified owner controls, forced optimize/share/workflow failures, delete confirmation, and no horizontal overflow at 6/6 checks. Focused visual retest `QA_TRIP_ID=22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02 QA_SHARE_SLUG=qa1ba54771 QA_VISUAL_RUN_ID=recovery-layout QA_VISUAL_ROUTES=trip-studio QA_VISUAL_SETTLE_MS=2200 npm run qa:visual` passed 5/5 Trip Studio viewports. Evidence: `qa/trip-studio-recovery-states-2026-05-18.md`; disposable fixture `22d85a5f-3fb7-4ddd-80d6-44c40c5a9c02` / run `1ba54771` was cleaned up.
- 2026-05-18: Hardened account and subscription recovery states. Billing checkout/portal actions now have deterministic local QA failure flags, checkout failure shows clear recovery copy plus `Try again`, cancelled checkout and successful return states show explicit status messages, and profile save failures no longer fail silently. Added `npm run qa:billing-recovery`, which passed 5/5 for billing visibility, forced checkout recovery, cancelled-return notice, upgraded-return notice, and desktop overflow. Focused visual retest `QA_VISUAL_RUN_ID=billing-recovery QA_VISUAL_ROUTES=account-billing QA_VISUAL_SETTLE_MS=1200 npm run qa:visual` passed 5/5 account-billing viewports. Evidence: `qa/billing-recovery-states-2026-05-18.md`.
- 2026-05-18: Hardened public-share recipient recovery and strengthened the ops monitoring contract. Public feedback submission now catches thrown/network failures, exposes `?qaFeedbackFailure=1`, gives clearer invalid-feedback copy, shows readiness guidance and character count, and offers a `Retry feedback` state if the feedback list fails. Added `npm run qa:share-recovery`, which passed 3/3 on the Athens public share link for recipient surface visibility, forced feedback recovery, and mobile overflow. Existing `qa:share` passed 4/4, `qa:share-feedback` passed 5/5, and the focused visual sweep `QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_RUN_ID=public-share-recovery QA_VISUAL_ROUTES=public-share QA_VISUAL_SETTLE_MS=1500 npm run qa:visual` passed 5/5. The in-app Browser verified `/t/x3m2c8cnws?qaFeedbackFailure=1` showed Start your own trip, Add your reaction, Friend feedback, feedback guidance, and no overflow. `npm run qa:ops` now also checks no-store cache behavior, parseable `checkedAt`, and the expected health-check roster; it passed 3/3. Evidence: `qa/public-share-recovery-states-2026-05-18.md` and `qa/ops-monitoring-contract-2026-05-18.md`.
- 2026-05-18: Expanded planner/map-trust actuals from one Athens actual to ten local public itinerary actuals tied directly to prompt-suite IDs. `npm run qa:share-fixtures` now creates ten prompt-suite-mapped disposable public itineraries and emits `promptSuiteShareMap`. Local `QA_SHARE_SLUGS=qab1250de81,qab1250de82,qab1250de83,qab1250de84,qab1250de85,qab1250de86,qab1250de87,qab1250de88,qab1250de89,qab1250de810 npm run qa:share` passed 40/40; `QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-expanded-2026-05-18-actuals.json npm run qa:prompt-suite` passed 52/52 with `actualsChecked: 10`; Browser spot-checked the Mexico City public share with all four days, no overflow, and `46 x 46` map controls; fixture cleanup deleted ten trips and sixty-two QA places. Evidence: `qa/planner-map-trust-expanded-2026-05-18.md` and `qa/planner-map-trust-expanded-2026-05-18-actuals.json`.
- 2026-05-18: Confirmed the active goal remains the multi-month platform-readiness objective and added `PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md` as the month-by-month execution roadmap. The new plan defines Month 1-6 outcomes, Browser testing loops, visual QA targets, impeccable audit/critique gates, commercial readiness gates, social/viral share requirements, production release gates, weekly cadence, score targets, and the immediate next execution slice.
- 2026-05-18: Strengthened public-share social previews for the viral loop. Added a dynamic 1200 x 630 PNG share-card endpoint at `/api/share-card/[shareSlug]`, wired public share metadata to emit `og:image`, image dimensions, image alt text, and `twitter:image`, and expanded `npm run qa:share` to fail when the generated share-card image is missing or not a non-trivial PNG. Local `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed 5/5 for the Athens five-day public share with `content-type: image/png` and `byteLength: 81579`; evidence and rendered artifact are in `qa/public-share-social-preview-2026-05-18.md` and `qa/share-card-athens-2026-05-18.png`.
- 2026-05-18: Browser rechecked `/t/x3m2c8cnws` for the social-preview pass. The document head exposed `og:image`, `og:image:width=1200`, `og:image:height=630`, and `twitter:image`; the rendered page showed the Athens title, day content through Day 5, feedback form, and Start your own trip CTA with no horizontal overflow at the active Browser viewport. Screenshot artifact: `qa/public-share-browser-social-preview-2026-05-18.png`.
- 2026-05-18: Re-ran release-adjacent local gates after the social-preview work. Passing results: `npm run qa:ops` 3/3, `QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial` 4/4, `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-feedback` 5/5 with feedback cleanup, `QA_SHARE_SLUG=x3m2c8cnws npm run qa:share-recovery` 3/3, `npm run qa:smoke` 7/7, `npm run qa:planner-handoff` 10/10 with draft cleanup, and `npm run qa:billing-recovery` 5/5. Also hardened `npm run qa:studio-recovery` so it waits for loaded owner controls and uses the first visible delete action instead of a fixture-specific item name; disposable fixture `39a46761-0bbb-4eef-bbb4-7328aca344b4` then passed `qa:studio-actions` 23/23, passed `qa:studio-recovery` 6/6, and was cleaned up.
- 2026-05-18: Post-social-preview hard gates passed: `npm run lint`, `npm run build`, `git diff --check`, `node --check scripts/platform-trip-studio-recovery-smoke.mjs`, and `node --check scripts/platform-share-smoke.mjs`.
- 2026-05-18: Ran a production release rehearsal against `https://globe-travel-two.vercel.app`. Production `qa:ops` passed 3/3 with deployment metadata, `qa:smoke` passed 8/8, and `qa:commercial` passed 4/4. Production `qa:share` failed 3/5 because the live alias does not yet include the local share-card endpoint or social image metadata: `og:image`, `og:image:width`, `og:image:height`, and `twitter:image` are missing, and `/api/share-card/x3m2c8cnws` returns 404. Browser confirmed the production public share title and CTA render without overflow, but the image metadata is absent. Evidence: `qa/production-release-rehearsal-2026-05-18.md`. Release decision: production is healthy, but the verified local social-preview batch must be committed, pushed, deployed, and rechecked before the viral sharing release gate can pass in production.
- 2026-05-18: Committed the verified release-readiness batch as `e70b4a2` (`Advance platform release readiness`) and pushed it to `origin/main`. Vercel built production deployment `dpl_67z9WNZWz4wuRNk9soZpTmp1PGcb`, aliased to `https://globe-travel-two.vercel.app`. Post-deploy production gates passed: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops` passed 3/3, `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:smoke` passed 8/8, `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial` passed 4/4, and `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed 5/5. Browser confirmed production now emits `og:image`, `og:image:width=1200`, `og:image:height=630`, and `twitter:image` for the Athens public share with no horizontal overflow. Updated evidence: `qa/production-release-rehearsal-2026-05-18.md`.
- 2026-05-18: Added `npm run qa:release-production` as a one-command read-only production release gate. The command runs production ops, smoke, commercial, public share/social preview, production prompt actuals export, and the 52-prompt suite with the production Athens actual. Local run against `https://globe-travel-two.vercel.app` passed 6/6; production prompt actual id `athens-5-day-couples-rest` passed map-trust validation with `actualsChecked: 1`. Production feedback insertion remains opt-in with `QA_INCLUDE_FEEDBACK_MUTATION=1`. Evidence: `qa/production-release-command-2026-05-18.md`.
- 2026-05-18: Added scheduled production monitoring with `.github/workflows/production-release-gate.yml`. The workflow runs every 6 hours and can be manually dispatched with a custom production URL/share slug. It runs `npm run qa:release-production`, uploads `production-release-gate-log`, and keeps production feedback mutation disabled unless explicitly enabled for an approved release window. Evidence: `qa/production-release-monitoring-workflow-2026-05-18.md`.
- 2026-05-18: Added scheduled production visual monitoring with `.github/workflows/production-visual-gate.yml`. The workflow runs daily and can be manually dispatched with a custom base URL/share slug/route list. It runs `npm run qa:visual` against public production routes, pixel-compares stable public shell routes against `qa/visual-baseline-production-2026-05-18`, and uploads screenshot/diff artifacts for inspection. Evidence: `qa/production-visual-monitoring-workflow-2026-05-18.md`.
- 2026-05-18: Hardened billing subscription-state UI for Sprint 4 commercial readiness. Trialing subscriptions now count as Adventurer access, stored paid-plan state is preserved for past-due/canceled subscriptions, and account billing exposes QA state overrides for repeatable recovery checks. Expanded `npm run qa:billing-recovery` passed 9/9, focused account-billing visual QA passed 3/3, and in-app Browser confirmed the past-due billing state shows Update billing/Manage billing with no horizontal overflow. Evidence: `qa/billing-subscription-state-hardening-2026-05-18.md`.
- 2026-05-18: Added Stripe test-mode readiness coverage with `npm run qa:stripe-readiness`. The gate verifies configured Stripe test keys, monthly/yearly price IDs, webhook signature verification, and active billing portal configuration. The opt-in mutation run `QA_STRIPE_CREATE_TEST_SESSIONS=1 npm run qa:stripe-readiness` created a test customer, test subscription checkout session, and test billing portal session, then expired the checkout session and deleted the customer. Evidence: `qa/stripe-test-mode-readiness-2026-05-18.md`.
- 2026-05-18: Added hosted Stripe Checkout Browser coverage with `npm run qa:stripe-checkout-browser`. The opt-in run `QA_STRIPE_RUN_HOSTED_CHECKOUT=1 npm run qa:stripe-checkout-browser` creates a test checkout session, fills hosted Stripe Checkout with the standard test card, confirms return to `/account?tab=billing&upgraded=true`, verifies the Stripe checkout session is complete and the subscription is trialing, then cancels the subscription and deletes the test customer. Evidence: `qa/stripe-hosted-checkout-browser-2026-05-18.md`.
- 2026-05-18: Added `npm run qa:release-candidate` as the one-command local release-candidate gate. The gate runs lint, build, ops, smoke, commercial, accessibility/keyboard, public share/social preview, share recovery, feedback mutation cleanup, planner handoff cleanup, billing recovery, Trip Studio action and recovery checks on one kept disposable fixture, Stripe readiness, prompt contract suite, full responsive visual QA, and fixture cleanup. The first full pass completed `17/17` top-level tasks, with accessibility `16/16` and visual QA `50/50`, and writes durable output in `qa/release-candidate-2026-05-18/`. It also fixed a desktop account-billing contrast regression and made visual marker waits stable for saved Trip Studio and client-rendered public-share states. Evidence: `qa/release-candidate-gate-2026-05-18.md`.
- 2026-05-18: Added `npm run qa:auth-access` for Browser-backed auth and guest access coverage. The gate checks logged-out login/signup guest entry, public share readability, saved/account/pricing safe resolution, guest-start-to-planner, guest saved/account access, local guest trip-list API access, and disposable guest cleanup. Local passed `11/11`; production non-mutating passed `10/10`. `npm run qa:release-candidate` now includes this gate and passed `18/18` top-level tasks after integration. Evidence: `qa/auth-guest-access-2026-05-18.md`.
- 2026-05-18: Integrated auth/guest access into the production release gate. `npm run qa:release-production` now runs production auth and guest Browser smoke between route smoke and commercial checks, and `.github/workflows/production-release-gate.yml` locates Chrome for scheduled runs. The updated production release gate passed `7/7` against `https://globe-travel-two.vercel.app`. Evidence: `qa/production-release-command-2026-05-18.md`.
- 2026-05-18: Integrated owner-side feedback readback into the local release-candidate gate. `npm run qa:release-candidate` now keeps one disposable Trip Studio fixture alive long enough to submit public feedback to its share link, verify the same reaction appears in the owner Trip Studio feedback feed, and then clean up the fixture. Focused validation with `QA_RELEASE_INCLUDE_VISUAL=0 QA_RELEASE_ARTIFACT_NAME=release-candidate-owner-feedback-2026-05-18 npm run qa:release-candidate` passed `18/18`; the new `Trip Studio owner feedback readback smoke` task passed `6/6`. Evidence: `qa/release-candidate-owner-feedback-2026-05-18/README.md`.
- 2026-05-18: Added authenticated protected-route visual QA. `npm run qa:visual` now supports guest-authenticated visual contexts for saved, account, and Trip Studio owner surfaces, and `npm run qa:release-candidate` passes the kept Trip Studio fixture guest ID into visual QA. Focused validation passed `8/8` for generated-guest saved/account visual sweeps, `6/6` for owner-fixture saved/account/Trip Studio visual sweeps, and `18/18` for a release-candidate orchestration with authenticated visual QA. `qa:studio-actions` cleanup now removes disposable guest profiles/users as well as trips and places. Evidence: `qa/authenticated-visual-qa-2026-05-18.md`.
- 2026-05-18: Added slow-network recovery coverage with `npm run qa:slow-network`. The Browser-backed gate delays key API routes and verifies Trip Studio slow itinerary loading, public share delayed feedback, account billing delayed subscription state, planner delayed draft creation, and disposable cleanup. Standalone passed `7/7`; focused release-candidate validation with `QA_RELEASE_ARTIFACT_NAME=release-candidate-slow-network-2026-05-18 QA_RELEASE_INCLUDE_VISUAL=0 QA_RELEASE_INCLUDE_PROMPT_SUITE=0 npm run qa:release-candidate` passed `18/18`, including slow-network recovery `5/5`. Evidence: `qa/slow-network-recovery-2026-05-18.md`.
- 2026-05-18: Began Week 1 of the next 12-week execution board by reducing Trip Studio operational density for non-wide owner layouts. Browser found that the active desktop/laptop viewport showed readiness cards before the itinerary, pushing the map and day plan below the first working view. The Trip Studio shell now keeps owner actions first, then prioritizes the itinerary/map/day controls, with group review, crew brief, feedback, and planner workflows after the itinerary on non-wide layouts while preserving the wide-desktop workspace. Browser retest on Athens-context fixture `e4078deb-d26a-48c2-866f-bef409aa62ff` showed itinerary, day tabs, selected route map, and pinned stops in the first working view with horizontal overflow `0`; Day 2 switching and Save state were also checked. Focused visual QA passed `3/3`, `npm run qa:studio-actions` passed `23/23`, and `npm run qa:studio-recovery` passed `6/6`. Evidence: `qa/trip-studio-density-polish-2026-05-18.md`.
- 2026-05-18: Began Week 2 planner start-to-trip confidence hardening. The planner handoff now shows a visible `Opening Trip Studio...` state, carries the prompt into that state, disables starter prompts while a draft is opening, preserves failed prompts in the input, and gives a `Try again` recovery action. Added local Browser QA flags `?qaPlannerDraftFailure=1` and `?qaPlannerDraftDelayMs=<ms>` for repeatable failed/slow draft checks. Browser verified a delayed forced-failure Athens prompt showed the opening state, disabled duplicate starters, recovered with the original prompt preserved, exposed `Try again`, and had no visible app error. `npm run qa:planner-handoff` passed `13/13`, focused planner visual QA passed `3/3`, `npm run qa:slow-network` passed `7/7` including the slow planner draft creation path, `npm run qa:prompt-suite` passed `52/52`, `npm run lint` passed, `npm run build` passed, and `git diff --check` passed. Evidence: `qa/planner-start-confidence-2026-05-18.md`.
- 2026-05-18: Confirmed the active several-month platform readiness goal and tightened the Month 2 map-trust actuals contract. Production prompt actuals now fail on destination-title mismatch, non-sequential day indexes, or duplicate mapped stop coordinates; exported actuals include unique stop counts, duplicate-stop details, and route distances. The stricter gate found a real P1 on stable Athens share `x3m2c8cnws`: Days 2 and 5 reused generic `Athina` pins for distinct stops. Added canonical Athens planner/hydration overrides, repaired the stable production share to specific Acropolis, Strofi, Monastiraki Square, and Ancient Agora pins, and recomputed the affected routes. Retest passed `QA_PROMPT_SUITE_ACTUALS=../qa/planner-map-trust-expanded-2026-05-18-actuals.json npm run qa:prompt-suite` at `52/52` with `actualsChecked: 10`, production Athens actuals passed `52/52` with `actualsChecked: 1`, Browser verified `/t/x3m2c8cnws` rendered the repaired stop names with `0` horizontal overflow, `npm run lint` passed, `npm run build` passed, `git diff --check` passed, and production `qa:release-production` passed `7/7`. Evidence: `qa/planner-map-trust-title-duplicates-2026-05-18.md` and `qa/planner-map-trust-title-duplicate-actuals-2026-05-18.json`.
- 2026-05-18: Promoted duplicate mapped-stop protection directly into `npm run qa:share` so public share, release-candidate, and production-release gates fail when distinct itinerary items share the same rounded coordinate. Production Athens `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share` passed `5/5` and now reports unique stop counts, duplicate-stop arrays, and route distances for all five days. A fresh ten-fixture public-share sweep across Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin passed `50/50`, with every checked day reporting `duplicateMappedStops: []`; cleanup deleted `10` trips and `62` QA places. Browser verified the disposable Lisbon public share had day content, map elements, and `0` horizontal overflow. `npm run lint` passed, `npm run build` passed, `git diff --check` passed, and production `qa:release-production` passed `7/7` with the stronger share output. Evidence: `qa/public-share-duplicate-stop-gate-2026-05-18.md`.
- 2026-05-18: Added `npm run qa:share-fixture-sweep` to make the ten-itinerary public share/map-trust sequence repeatable instead of manual. The gate creates disposable Lisbon, Porto, Mexico City, Tokyo, Rome, Barcelona, London, Paris, Copenhagen, and Berlin public fixtures, runs `qa:share` across all share slugs, exports prompt-suite actuals, runs `qa:prompt-suite` against those actuals, and cleans up the fixture set. Standalone validation passed `5/5`: `qa:share` passed `50/50`, prompt-suite actuals exported `10`, prompt suite passed `52/52` with `actualsChecked: 10`, and cleanup deleted `10` trips plus `62` QA places. Integrated the sweep into `npm run qa:release-candidate` when `QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP=1` or when a local release-candidate run has `QA_OWNER_USER_ID`; focused release-candidate validation passed `13/13`. Browser rechecked production `/t/x3m2c8cnws`, confirmed repaired Athens stop names, map elements, Start your own trip, and `0` horizontal overflow. Evidence: `qa/release-candidate-share-fixture-sweep-2026-05-18.md`.
- 2026-05-18: Strengthened responsive visual QA for launch polish. `npm run qa:visual` now fails on hit-test-visible app-owned control overlap and clipped action/heading text, while allowing intentional password-field adornments. Fixed the mobile app shell so protected app pages reserve viewport space above the fixed bottom nav instead of letting working controls sit under it. Focused layout QA passed `8/8`; the full visual matrix passed `45/45` across landing, planner, saved trips, saved journal, account/profile, billing, login, signup, and public share at phone, tablet, laptop, desktop, and wide viewports. Focused release-candidate validation passed `14/14` with the strengthened visual gate included. `npm run lint`, `npm run build`, `git diff --check`, and `node --check scripts/platform-visual-baseline.mjs` passed. Evidence: `qa/visual-layout-quality-gate-2026-05-18.md`.
- 2026-05-18: Hardened the public-share viral loop. Public share `Start your own trip` CTAs now route through `/api/guest/start?q=...`, creating a guest session and carrying the shared-trip prompt into Planner instead of sending logged-out recipients to a contextless `/chat` path. Added `npm run qa:share-viral` and integrated it into `npm run qa:release-candidate`; standalone viral-loop QA passed `5/5`, and focused release-candidate validation passed `14/14`. In-app Browser confirmed the Athens public share exposes Add your reaction, Friend feedback, Share trip, Copy link, and two contextual guest-start links with `0` horizontal overflow. Evidence: `qa/public-share-viral-loop-2026-05-18.md`.
- 2026-05-18: Added returning-user saved/account coverage. Journal and profile APIs now use the same guest-aware user contract as trip routes, and account profile saving now goes through `/api/profile`. Added `npm run qa:saved-account` and integrated it into `npm run qa:release-candidate`; standalone saved/account QA passed `10/10`, covering disposable guest saved trip creation/readback, trip-note create/edit/readback, profile update, saved trips UI, saved journal UI, account profile UI, reopen link, and cleanup. Focused release-candidate validation passed `15/15`. In-app Browser spot-checked `/saved`, `/saved?tab=journal`, and `/account` with no horizontal overflow or visible runtime errors. Evidence: `qa/saved-account-returning-user-2026-05-18.md`.
- 2026-05-18: Unblocked the full predeploy release candidate after the strengthened visual gate found real saved-card and Trip Studio title issues. Saved trip cards now use explicit non-overlapping open links instead of a hidden full-card overlay that collided with Delete, and itinerary headings now wrap long trip titles instead of clipping at tablet width. Focused visual QA for saved trips and Trip Studio passed `10/10`; `npm run qa:saved-account` passed `10/10`; `QA_TRIP_ID=135f0ef4-9562-4f1e-a5a5-d7bba2748dcd QA_GUEST_ID=b45ed007-84d6-46cc-b08b-35f529783aba npm run qa:studio-recovery` passed `6/6`; in-app Browser verified disposable public share `sqv54i8vlp` rendered its title and Start your own trip CTA with no horizontal overflow. Full local predeploy `QA_SHARE_SLUG=x3m2c8cnws QA_OWNER_USER_ID=b643aed0-e6d2-4f56-8836-0fed5a1e12ea QA_RELEASE_ARTIFACT_NAME=release-candidate-full-predeploy-2026-05-18 npm run qa:release-candidate` passed `23/23`, including lint, production build, auth/guest, saved/account, public share, viral loop, ten-itinerary fixture sweep, planner handoff, billing recovery, Trip Studio action/recovery/owner feedback, slow-network recovery, Stripe readiness, prompt suite, responsive visual QA `50/50`, and fixture cleanup. Evidence: `qa/release-candidate-full-predeploy-2026-05-18/README.md`.
- 2026-05-18: Upgraded the production release command so public production visual QA is part of `npm run qa:release-production` by default. The command now runs production ops, smoke, auth/guest, commercial, public share/social preview, public visual QA, production prompt actuals, and prompt-suite validation. `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-release-2026-05-18 npm run qa:release-production` passed `8/8`; the integrated visual gate passed `20/20` across landing, login, signup, and public share at phone, tablet, laptop, desktop, and wide viewports, with pixel diffs for landing/login/signup against `qa/visual-baseline-production-2026-05-18`. In-app Browser confirmed the live Athens public share had no horizontal overflow or visible runtime errors and still exposed the title/day content, feedback section, and Start your own trip CTA. Evidence: `qa/production-release-command-2026-05-18.md` and `qa/visual-baseline-production-release-2026-05-18/README.md`.
- 2026-05-18: Continued Week 2 planner start-to-trip confidence testing and fixed a P1 interim Trip Studio trust issue. Browser found that `/chat?q=...` could briefly show empty days, `0 stops`, and `Ask the AI to build this day` while the initial URL prompt was still generating. Trip Studio now shows an explicit `Building the first itinerary from your trip idea.` state, suppresses empty-map panels, and uses `Building named stops and map context...` until items arrive. The same Browser pass found and fixed destination extraction for phrasing like `Copenhagen design and food trip`; the prompt suite now includes this exact fixture and passed `53/53`. Browser verified the final generated Copenhagen trip had Denmark stops, a `7 stops` Day 1 walking map, no bad title, no overflow, and no console errors. `npm run qa:planner-handoff` passed `14/14`; `npm run lint`, `npm run build`, and `git diff --check` passed. Evidence: `qa/planner-initial-generation-state-2026-05-18.md`.
