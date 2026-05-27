# Globe.travel Operations Runbook

Status: active
Owner: release operator

## Purpose

This runbook turns release operations into a repeatable path. Use it for deploys, failed QA gates, production incidents, and rollback decisions.

## Production URLs

- Production alias: `https://globe-travel-two.vercel.app`
- Health endpoint: `https://globe-travel-two.vercel.app/api/health`
- Known public QA share: `https://globe-travel-two.vercel.app/t/x3m2c8cnws`

## Required Release Gates

Run from `client/` before deploy:

```bash
npm run qa:smoke
QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial
npm run qa:ops
npm run qa:mobile-readiness
QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
# or validate several public itinerary links at once:
QA_SHARE_SLUGS=x3m2c8cnws,<next-share-slug> npm run qa:share
QA_TRIP_ID=<owned-trip-id> QA_SHARE_SLUG=x3m2c8cnws npm run qa:studio
npm run qa:studio-actions
QA_PROMPT_SUITE_SHARE_MAP=athens-5-day-couples-rest=x3m2c8cnws QA_PROMPT_SUITE_ACTUALS_OUT=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-actuals
QA_PROMPT_SUITE_ACTUALS=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-suite
npm run qa:vercel-ignore
npm run lint
npm run build
```

Run from `client/` after deploy:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production
```

The production release gate above runs the read-only post-deploy checks together:

- production ops with deployment metadata
- production smoke
- production commercial safety checks
- production public share, map integrity, metadata, and share-card image
- production prompt actuals export for the stable Athens share
- prompt-suite validation with the production actual

Set `QA_INCLUDE_PROMPT_ACTUALS=0` to skip the prompt-suite actuals check. Set `QA_INCLUDE_FEEDBACK_MUTATION=1` only during an approved release window if production friend-feedback insert/readback/cleanup should also be tested.

## Documentation-Only Commits

Vercel uses `client/vercel.json` and `client/scripts/vercel-ignore-build.mjs` to skip production builds for commits that only change release evidence, release monitoring workflows, the sibling Expo mobile app, or documentation. The skip list is intentionally conservative: `.github/workflows/**`, `mobile/**`, `qa/**`, `README.md`, `OPERATIONS_RUNBOOK.md`, `PLATFORM_*.md`, and `RELEASE_READINESS_MEMO.md`.

Run `npm run qa:vercel-ignore` before release-ops-only pushes. It writes `qa/vercel-ignore-smoke-2026-05-23.json` and `.md`, proving representative release evidence, workflow, QA-script, and launch QA-hardening commits skip Vercel builds while a known runtime application change still forces a build. `npm run qa:launch-signoff` requires that artifact so deployment hygiene stays repeatable.

Any `client/**` runtime change, package/config change, or unknown path continues the build. Vercel may briefly show a release-ops-only commit as building before the ignored-build command resolves; wait for the deployment to cancel or skip before removing it manually. If a release-ops-only commit unexpectedly deploys, run the production gate and then tighten the ignore script before adding more evidence commits.

## Vercel Deploy Quota And Skipped Commits

Do not force a production deploy for release-ops-only commits after `npm run qa:vercel-ignore` proves they are skip-safe. A canceled Vercel deployment for documentation, QA evidence, or launch-signoff script hardening is expected and should not be treated as a broken app release when `/api/health` is still green on the known-good runtime commit.

If Vercel returns `api-deployments-free-per-day` or `more than 100`, stop retrying deploys for the day. Record the quota hit in the release notes or handoff, verify the current production alias with `curl -fsS https://globe-travel-two.vercel.app/api/health`, inspect `vercel ls --scope rodney-blairs-projects`, and continue only non-deploy launch work such as beta dispatch, visual-review intake, lint/build, or launch signoff. Retry `vercel deploy --prod --yes --force --scope rodney-blairs-projects` from the repo root after the quota resets and then rerun `npm run qa:launch-refresh` and `npm run qa:launch-signoff`.

## Public Launch Evidence Dispatch

The current public-launch blocker work is operational, not app-code blocked. Production is healthy on `a717ab309ed3ee39b1b2cedf10b06030c5fc7ec8` at `globe-travel-11mnlyb8o-rodney-blairs-projects.vercel.app`, and `npm run qa:public-launch-status` reports `beta-ready-public-blocked`: release operations are ready, public launch remains closed until external beta and visual-review evidence is imported. After every deploy, refresh production visual, monitoring, rollback, launch status, and signoff evidence before relying on public-launch status. Use the daily launch board, guarded refresh command, and sent-record template as the source of truth:

```bash
npm run qa:launch-today
npm run qa:launch-refresh
npm run qa:dispatch-sent-record-template
npm run qa:dispatch-sent-record-template-rejection
npm run qa:dispatch-mark-sent-import-rehearsal
npm run qa:review-intake-import-rehearsal
npm run qa:public-launch-threshold-rehearsal
npm run qa:public-launch-mode-rehearsal
```

Current artifacts:

- Daily board: `qa/launch-operator-today-2026-05-27.json`, `.md`, and `.csv`
- Guarded launch refresh: `qa/launch-refresh-2026-05-27.json` and `qa/launch-refresh-2026-05-27.md`
- Sent-record starter: `qa/dispatch-sent-record-template-2026-05-27.json`, `qa/dispatch-sent-record-template-2026-05-27.md`, and `qa/dispatch-sent-record-template-2026-05-27.csv`
- Sent-record blank-template rejection: `qa/dispatch-sent-record-template-rejection-2026-05-27.json` and `qa/dispatch-sent-record-template-rejection-2026-05-27.md`
- Sent-record isolated import rehearsal: `qa/dispatch-log-mark-sent-import-rehearsal-2026-05-27.json` and `qa/dispatch-log-mark-sent-import-rehearsal-2026-05-27.md`
- Review intake isolated import rehearsal: `qa/review-intake-import-rehearsal-2026-05-27.json` and `qa/review-intake-import-rehearsal-2026-05-27.md`
- Public-launch threshold rehearsal: `qa/public-launch-threshold-rehearsal-2026-05-27.json` and `qa/public-launch-threshold-rehearsal-2026-05-27.md`
- Public-launch mode rehearsal: `qa/public-launch-mode-rehearsal-2026-05-27.json` and `qa/public-launch-mode-rehearsal-2026-05-27.md`
- Sent-record JSON validation: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.json npm run qa:dispatch-mark-sent`
- Sent-record JSON import after real sends: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.json npm run qa:dispatch-mark-sent`
- Sent-record CSV validation: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent`
- Sent-record CSV import after real sends: `QA_BETA_REVIEW_DISPATCH_LOG=qa/beta-human-review-dispatch-log-all-wave-2026-05-21.json QA_VISUAL_REVIEW_DISPATCH_LOG=qa/production-visual-review-dispatch-log-2026-05-26.json QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/dispatch-sent-record-template-2026-05-27.csv npm run qa:dispatch-mark-sent`

The daily board and guarded refresh both expose an `operatorHandoff` block. Treat `operatorHandoff.immediateExternalAction`, `operatorHandoff.rows`, `operatorHandoff.followUpsBlockedUntilInitialSendIds`, `operatorHandoff.sentRecordTemplateCsv`, `operatorHandoff.validationCommand`, and `operatorHandoff.importCommand` as the fastest source for the release operator's current outreach queue. Follow-ups listed in `followUpsBlockedUntilInitialSendIds` are draft-only until the corresponding initial invite has real sent proof imported.

The sent-record starter is deliberately not ready for import when generated. `npm run qa:dispatch-sent-record-template-rejection` proves the blank starter and placeholder proof values fail even in import mode, import zero rows, and cannot mutate canonical dispatch logs. `npm run qa:dispatch-mark-sent-import-rehearsal` proves both JSON and CSV sent-record imports against isolated copied logs. Fill `reviewerAlias`, `deliveryChannel`, `sentAt`, and `contactRecordLocation` only after real outreach happens outside the repo; `deliveryChannel` must be an allowed outreach channel and proof pointers must be stable external references rather than private contact data. Keep real names, emails, phone numbers, and contact details in the external contact system. Use only non-sensitive aliases and pointers in the repo.

After importing sent state, rerun:

```bash
npm run qa:beta-review-follow-up-outbox
npm run qa:launch-refresh
npm run qa:launch-signoff
```

Sent proof still does not count as completed beta or visual-review evidence. `npm run qa:review-intake-import-rehearsal` proves valid completed beta and visual-review submissions can be imported into copied registers without mutating canonical launch evidence. `npm run qa:public-launch-threshold-rehearsal` proves copied complete registers make the beta and production visual-review threshold gates turn ready. Public launch remains blocked until completed beta review submissions pass canonical intake and production visual-review submissions pass canonical intake.

Manual equivalents:

```bash
QA_BASE_URL=https://globe-travel-two.vercel.app npm run qa:smoke
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:commercial
QA_BASE_URL=https://globe-travel-two.vercel.app QA_REQUIRE_PRODUCTION_METADATA=1 npm run qa:ops
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:share
# or:
QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUGS=x3m2c8cnws,<next-share-slug> npm run qa:share
QA_BASE_URL=https://globe-travel-two.vercel.app QA_PROMPT_SUITE_SHARE_MAP=athens-5-day-couples-rest=x3m2c8cnws QA_PROMPT_SUITE_ACTUALS_OUT=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-actuals
QA_PROMPT_SUITE_ACTUALS=/tmp/globe-travel-prompt-actuals.json npm run qa:prompt-suite
```

## Health Status

`/api/health` should return:

- HTTP `200`
- `status: "ok"`
- `summary.criticalMissing: 0`
- `summary.warningMissing: 0` for a launch-candidate production deployment

Treat HTTP `503`, missing JSON, or any missing critical check as a release blocker. Treat warning checks as pre-launch cleanup items unless an owner explicitly accepts the risk.

## Incident Severity

P0:

- Production app unavailable.
- Public share pages unavailable.
- Planner cannot create trips.
- Maps fail for saved/shared itineraries.
- Auth/guest access blocks core use.
- Checkout creates broken or unsafe subscription state.

P1:

- `/api/health` degraded.
- Public feedback submission fails.
- Production smoke, commercial, ops, or share QA fails.
- Trip Studio opens but key actions fail.
- Wrong-country maps appear in generated trips.

P2:

- Non-blocking visual regression.
- Missing optional metadata or analytics.
- Slow but usable route.
- Recoverable copy/share failure.

## First Checks

1. Confirm the failing URL and exact timestamp.
2. Run the matching production QA command.
3. Check `/api/health`.
4. Inspect the latest Vercel deployment status and aliases.
5. Compare the failing deployment with the last known good commit.
6. Record the finding in `RELEASE_READINESS_MEMO.md` or a `qa/` evidence file.

## Rollback Decision

Rollback immediately when:

- A P0 is confirmed.
- A P1 affects new users or public share recipients and no quick fix is ready.
- `/api/health` returns `503` in production because a critical environment value is missing.
- A deploy changes billing, auth, public sharing, or planner behavior and the matching production QA gate fails.

Patch forward when:

- The issue is P2/P3.
- The fix is obvious, low-risk, and can be validated locally and in production within the same release window.

## Rollback Procedure

1. Identify the last known good production deployment in Vercel.
2. Promote the last known good deployment to production.
3. Run all post-deploy QA commands.
4. Confirm `/api/health` is `ok`.
5. Record the rollback deployment id, reason, and verification in `RELEASE_READINESS_MEMO.md`.
6. Create a follow-up fix branch from `main`.

Launch signoff also reads `qa/launch-rollback-plan.json`. Keep that file current whenever the known-good production deployment changes; `npm run qa:launch-signoff` fails if the rollback plan is stale, does not identify the production alias and known-good deployment, lacks restore steps, or omits post-rollback production and launch-signoff verification commands.

## Monitoring Targets

GitHub Actions production release gate:

- Workflow: `.github/workflows/production-release-gate.yml`
- Schedule: every 6 hours
- Manual run: Actions -> Production release gate -> Run workflow
- Default command: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws npm run qa:release-production`
- Artifacts: `production-release-gate-log` on every run; `production-launch-signoff-log` when launch signoff is enabled; `production-release-visual-<run_id>` when production visual QA is enabled.
- Mutation policy: feedback insertion is off by default; enable `include_feedback_mutation=1` only during an approved release window.
- Visual isolation: `include_production_visual=0` may be used for visual-runner infrastructure debugging. The workflow still uploads the release log and skips only the visual artifact upload.

GitHub Actions production visual gate:

- Workflow: `.github/workflows/production-visual-gate.yml`
- Schedule: daily
- Manual run: Actions -> Production visual gate -> Run workflow
- Default command: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_VISUAL_BASELINE_DIR=qa/visual-baseline-production-2026-05-18 QA_VISUAL_ROUTES=landing,login,signup,public-share QA_VISUAL_DIFF_ROUTES=landing,login,signup npm run qa:visual`
- Artifact: `production-visual-gate-<run_id>`
- Scope: public production surfaces only by default; authenticated Trip Studio/account/saved visual QA remains a signed-in local or preview fixture gate.

Add external uptime or scheduled checks for:

- `/api/health`
- `/pricing`
- `/trips`
- `/trips/new`
- `/`
- `/login`
- `/signup`
- `/t/x3m2c8cnws`
- `/api/trips/share/x3m2c8cnws`
- `/api/trips/share/x3m2c8cnws/feedback`

Alert on:

- Any `5xx`
- `/api/health` not `ok`
- `/pricing` fails, loses conversion copy, or shows application errors
- `/trips` or `/trips/new` fail, redirect to the wrong surface, or show application errors
- app surface gate reports broken compatibility redirects, missing markers, cleanup failures, or horizontal-overflow issues
- accessibility gate reports blocking focus, landmark, skip-link, axe, marker, or cleanup issues
- public share route not returning trip-specific metadata
- public feedback validation not returning structured JSON
- production smoke failure

## Product-Specific Debug Pointers

Planner:

- Check `OPENAI_API_KEY`.
- Check Supabase read/write configuration.
- Re-run a known prompt from the prompt suite.

Maps:

- Check `NEXT_PUBLIC_MAPBOX_TOKEN`.
- Check Trip Studio day tabs and route/stop counts.
- Re-run Athens five-day map checks.

Public sharing:

- Check `/api/trips/share/[slug]`.
- Check `/api/trips/share/[slug]/feedback`.
- Check Open Graph metadata with `npm run qa:share`.

Billing:

- Check Stripe env values in `/api/health`.
- Run `npm run qa:commercial`.
- Run `npm run qa:stripe-readiness` before release candidates to verify Stripe test-mode keys, prices, webhook signature verification, and billing portal configuration.
- Run `QA_STRIPE_CREATE_TEST_SESSIONS=1 npm run qa:stripe-readiness` during approved release rehearsals to create and clean up a test customer, test checkout session, and test portal session.
- Confirm checkout/portal failures return structured JSON when unauthenticated.
