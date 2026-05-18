# Month 1 Critique And Audit Scorecard

Date: 2026-05-18
Environment: local app at `http://localhost:3000`
Browser profile: signed-in local profile `b643aed0-e6d2-4f56-8836-0fed5a1e12ea`
Design context: `.impeccable.md`

## Scope

Monthly scorecard across the six core launch-readiness surfaces:

- Landing
- Planner `/chat`
- Trip Studio `/trips/15591fa6-01d1-4412-a54c-c08f7279d0de`
- Saved `/saved`
- Public share `/t/x3m2c8cnws`
- Account and billing `/account`, `/account?tab=billing`

Browser viewports checked:

- `390 x 844`
- `1440 x 950`
- `1728 x 1050`

## Browser Evidence Summary

| Surface | 390 x 844 | 1440 x 950 | 1728 x 1050 | Notes |
|---|---|---|---|---|
| Landing | Pass | Pass after target fix | Pass after target fix | No overflow, no visible app errors |
| Planner | Pass after input target fix | Pass after input/sidebar fixes | Pass after input/sidebar fixes | Composer remains visible and labeled |
| Saved | Pass | Pass after sidebar fixes | Pass after sidebar fixes | Trips visible, no overflow |
| Account | Pass | Pass after sidebar fixes | Pass after sidebar fixes | Profile/billing surfaces stable |
| Billing | Pass | Pass after sidebar fixes | Pass after sidebar fixes | Upgrade and plan comparison visible |
| Public share | Pass | Pass with third-party control caveat | Pass with third-party control caveat | Public CTA and feedback remain reachable |
| Trip Studio | Pass | Pass with third-party control caveat | Pass with third-party control caveat | Owner actions and map/itinerary markers present |

Checked for:

- Required route markers.
- Horizontal overflow.
- Visible app error copy.
- Missing labels on icon-only app controls.
- App-owned visible controls below `44px`.
- Heading visibility and core information hierarchy.

## Fixes Made During Scorecard

### P1: App-Owned Touch Targets Below Release Bar

Browser found several app-owned targets below the `44px` target:

- Landing desktop nav links were `18px` tall.
- Sidebar brand link was `32px` tall.
- Sidebar account/avatar link was `32px` tall.
- Planner empty-state input was `39px` tall.

Fixes:

- Landing top nav links now use `flex min-h-11 items-center`.
- Landing brand link now has `min-h-11`.
- Sidebar brand link now has `min-h-11`.
- Sidebar account link now uses `w-11 h-11`.
- Planner composer input now uses `min-h-11`.

Retest:

- Landing nav links: `44px` tall.
- Sidebar brand link: `44px` tall.
- Sidebar account link: `44 x 44`.
- Planner input: `44px` tall.
- No app-owned small visible targets remained on the checked landing, planner, saved, and account surfaces.
- No horizontal overflow appeared after the fixes.

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|---:|---:|---|
| 1 | Accessibility | 3 | App-owned labels and touch targets are mostly good after fixes; third-party Mapbox controls remain below `44px` and need a policy decision/wrapper if required. |
| 2 | Performance | 3 | Build is clean and pages render, but Mapbox-heavy pages still make in-app screenshot capture unreliable. |
| 3 | Responsive Design | 4 | Core surfaces passed `390`, `1440`, and `1728` width checks with no horizontal overflow. |
| 4 | Theming | 3 | Surfaces mostly use tokens and preserve the navigator-log direction; some legacy hard-coded shadows/radii remain for later normalization. |
| 5 | Anti-Patterns | 3 | The UI is not obvious AI slop; remaining risk is density/card repetition on operational surfaces, not a fundamental aesthetic mismatch. |
| **Total** |  | **16/20** | **Good; Month 1 target met.** |

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---:|---:|---|
| 1 | Visibility of System Status | 3 | Save/build/rewrite states are now visible; route-generation and screenshot-capture states need stronger QA artifacts. |
| 2 | Match System / Real World | 3 | Trip language is understandable and group-oriented; some QA/generated titles can still sound mechanical. |
| 3 | User Control and Freedom | 3 | Reorder, swap, save, share, and cleanup paths are covered; destructive/delete undo remains a later hardening topic. |
| 4 | Consistency and Standards | 3 | Navigation and action patterns are now more consistent; app shell and public pages still use different interaction densities. |
| 5 | Error Prevention | 3 | Query handoff and failure states are now guarded; checkout and third-party map edge cases remain release risks. |
| 6 | Recognition Rather Than Recall | 4 | Planner, Trip Studio, public share, and saved surfaces expose recognizable labels and next actions. |
| 7 | Flexibility and Efficiency | 3 | Desktop owner actions are efficient; keyboard and power-user coverage should be expanded. |
| 8 | Aesthetic and Minimalist Design | 3 | Refined editorial direction holds, but operational surfaces remain dense. |
| 9 | Error Recovery | 3 | Planner/Map/Stripe failure copy exists; recovery still needs broader slow-network and failed-share Browser checks. |
| 10 | Help and Documentation | 3 | Empty states guide users; release support/debug docs are still stronger than in-product help. |
| **Total** |  | **31/40** | **Good; Month 1 target met.** |

## Anti-Patterns Verdict

Pass with watch items. The app does not read as generic 2024/2025 AI interface slop: it avoids neon dark gradients, glassmorphism-heavy panels, gradient text, and hero metric templates. The strongest risk is repeated card/panel density in operational surfaces, especially Saved, Account/Billing, and Trip Studio readiness sections. That is a P2 normalization/polish concern, not a launch blocker.

## Persona Red Flags

**Jordan, first-time trip organizer**

- Before this pass, the planner input and desktop nav touch targets were weaker than the product promise. Fixed.
- Current risk: public share and Trip Studio are information-rich; first-time users may need stronger prioritization of the next best action after reading a shared plan.

**Maya, friend receiving a public share link**

- Public share passes metadata, day integrity, feedback field sizing, and recipient CTA checks.
- Current risk: Mapbox controls remain third-party-sized on desktop; app content around them is good, but map control accessibility is not fully owned.

**Rod, returning owner preparing a trip**

- Saved, Trip Studio, planner handoff, and owner actions are now covered by Browser and QA gates.
- Current risk: operational density can make Trip Studio feel more like an admin surface than a lightweight social planning surface.

## Priority Findings

### [P1] Small App-Owned Targets On Launch Surfaces

Status: fixed and retested.

Why it mattered: small visible targets reduce confidence on hybrid/touch desktops and violate the product's polished launch bar.

### [P2] Third-Party Mapbox Controls Remain Below App Touch Target Standard

Status: fixed for actionable controls and retested.

Why it mattered: Mapbox zoom controls were visible at about `29px` on public share and Trip Studio. They are third-party controls, but they still appear inside the product experience.

Resolution: global Mapbox control CSS now gives app-facing map controls a `46px` target, token-matched surface styling, and clearer hover/focus treatment. The visual QA runner now measures Mapbox navigation controls separately from attribution/legal links.

Retest: `QA_TRIP_ID=f1239381-f38f-4ede-9e2c-9d5321c27a59 QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_RUN_ID=mapbox-policy QA_VISUAL_ROUTES=public-share,trip-studio npm run qa:visual` passed `10/10` route-viewports with `0` small app targets and `0` small actionable map controls. Fixture `f1239381-f38f-4ede-9e2c-9d5321c27a59` / run `cc52e60f` was cleaned up.

### [P2] Operational Density In Trip Studio And Account/Billing

Status: documented.

Why it matters: the app is powerful, but release-quality social planning should feel lightweight. Trip Studio now works, but can still feel dense for a first-time organizer.

Recommended action: run `/distill`, `/arrange`, and `/polish` on Trip Studio readiness/workflows and billing panels.

### [P2] Durable Screenshot Artifacts Still Need A Non-Timeout Path

Status: documented.

Why it matters: Browser geometry checks are useful, but launch visual QA should include durable artifacts. In-app Browser screenshot capture has repeatedly timed out on Mapbox-heavy pages.

Recommended action: add a non-Mapbox screenshot mode or separate screenshot capture path for visual regression artifacts.

## Positive Findings

- Core routes passed `390`, `1440`, and `1728` width checks with no horizontal overflow.
- Planner handoff, Trip Studio actions, public share integrity, and multi-itinerary public share coverage now have repeatable QA gates.
- The current visual direction remains aligned with the refined navigator-log brand context in `.impeccable.md`.
- Public share metadata, feedback API, recipient CTA, and map integrity are stronger than the baseline from the start of the release-readiness work.

## Recommended Next Actions

1. **[P2] `/distill`** — Reduce Trip Studio readiness/workflow density while preserving owner power actions.
2. **[P2] `/normalize`** — Align app shell, public share, account/billing, and Trip Studio spacing/control patterns.
3. **[P2] `/harden`** — Expand slow-network, failed-share, failed-map, and delete/recovery states.
4. **[P3] `/polish`** — Final pass on typography rhythm, panel density, and desktop/wide-desktop optical alignment.

## Gate Status

Month 1 score targets:

- Audit Health target: `14/20`; current score: `16/20`.
- Design Health target: `26/40`; current score: `31/40`.

Result: Month 1 scorecard target met, with P2 work remaining for launch polish.
