# Production Release Full Visual And Viral Gate

Date: 2026-05-20
Environment: `https://globe-travel-two.vercel.app`
Deployment checked: `dpl_D7nRJhcYC6DZQfKsTL5iG2Qkfp8t`
Commit checked: `d9465e4`
Status: Passed

## Purpose

This run rechecked the latest production deployment with the full non-mutating production release gate after the owner-feedback hardening deployment. The previous post-deploy smoke intentionally disabled production visual and viral coverage for speed; this pass re-enabled both so the live release evidence covers public visual QA and the viral share loop.

## Command

```sh
QA_BASE_URL=https://globe-travel-two.vercel.app \
QA_SHARE_SLUG=x3m2c8cnws \
QA_PRODUCTION_VISUAL_ARTIFACT_NAME=visual-baseline-production-release-2026-05-20 \
npm run qa:release-production
```

## Result

- Production release summary: `9/9`
- Production ops: passed
- Production smoke: passed
- Production auth and guest access: `14/14`
- Production commercial: `4/4`
- Production share: `5/5`
- Production public share viral loop: `5/5`
- Production public visual gate: `20/20`
- Production prompt actuals export: `1` actual exported
- Prompt suite with production actuals: `56/56`, `actualsChecked: 1`
- Production feedback mutation: disabled
- Production guest-start mutation: skipped for remote base URL

## Visual Evidence

Visual artifact directory: `qa/visual-baseline-production-release-2026-05-20/`

The public production visual gate checked landing, login, signup, and the stable Athens public share across phone, tablet, laptop, desktop, and wide viewports. Landing, login, and signup were pixel-compared against `qa/visual-baseline-production-2026-05-18` with a `1.5%` threshold. All compared routes had `0.000%` visual diff, and every checked route had:

- no horizontal overflow;
- no app-owned small touch targets;
- no actionable Mapbox control failures;
- no clipped heading/action text;
- no overlapping app-owned controls;
- no visible app error markers.

## Production Share Evidence

Stable share slug: `x3m2c8cnws`

The production share gate verified the Athens public itinerary API, page metadata, social-card PNG, public feedback API, and map integrity. The stable Athens itinerary still has five days, all stops mapped in Greece, no duplicate mapped stops, and one usable route per checked day.

## In-App Browser Spot Check

The Codex in-app Browser opened `https://globe-travel-two.vercel.app/t/x3m2c8cnws` and verified the live public share rendered the title, day plan, Mapbox canvas, two contextual `Start your own trip` links, no visible app error, and no horizontal overflow. After scrolling deeper, Browser confirmed the page exposes the feedback and sharing loop content: `Add your reaction`, `Friend feedback`, `3 reactions`, `Share trip`, `Copy link`, `Share`, and the lower `Start your own trip` CTA.

## Launch Readiness Impact

This closes the evidence gap left by the focused post-deploy smoke: the latest production alias is now verified with public production visual QA and viral-loop QA enabled. The broader platform-readiness goal remains active because protected authenticated visual coverage, subscription flows, multi-itinerary release rehearsal, and final launch-candidate signoff still need continuing current-state evidence before the whole platform can be called complete.
