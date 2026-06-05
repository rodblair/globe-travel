# Release Candidate Gate

Date: 2026-06-05
Environment: http://localhost:3000
Public share slug: x3m2c8cnws

## Result

- Checked tasks: 16
- Passed: 14
- Failed: 2
- Visual QA included: no
- Trip Studio fixture included: no
- Public share fixture sweep included: no
- Public share fixture owner id: n/a
- Multi-itinerary share UI included: no
- Owner feedback readback included: yes
- Planner generated actuals included: no
- Planner generated actuals preset: n/a
- Accessibility and keyboard included: no
- Slow-network recovery included: no
- Hosted Stripe Checkout included: no
- Hosted Stripe billing portal included: no
- Summary JSON: `qa/release-candidate-runner-watchdog-smoke-2026-06-05-pass/summary.json`

| Task | Result | Checks | Elapsed | Mutation |
| --- | --- | ---: | ---: | --- |
| lint | Pass | n/a | 5.1s | no |
| production build | Pass | n/a | 9.2s | no |
| local ops readiness | Pass | 3 | 0.1s | no |
| geocode quality smoke | Pass | 44 | 0.3s | no |
| local route smoke | Pass | 8 | 2.0s | no |
| Trip Studio missing-trip recovery UI smoke | Pass | 1 | 4.9s | no |
| auth and guest access smoke | Pass | 16 | 47.1s | local |
| saved and account smoke | Fail | 16 | 936.2s | local |
| local commercial smoke | Pass | 4 | 0.4s | no |
| public share and social preview smoke | Pass | 5 | 1.2s | no |
| public share recovery smoke | Pass | 4 | 12.0s | no |
| public share viral loop smoke | Fail | n/a | 951.1s | local |
| public share map fallback smoke | Pass | 1 | 4.3s | no |
| planner handoff smoke | Pass | 17 | 11.6s | local |
| billing recovery smoke | Pass | 15 | 29.0s | no |
| Stripe test-mode readiness | Pass | 11 | 0.7s | no |

## Fixture

- Trip id: n/a
- Share slug: n/a
- Run id: n/a
- Cleanup task: n/a

## Failure Detail

### saved and account smoke

- Code: null
- Checks: 16
- Failure: {
  "name": "saved and account smoke",
  "ok": false,
  "code": null,
  "elapsedMs": 936185,
  "mutatesLocal": true,
  "timedOut": true,
  "checked": 16,
  "passed": 15,
  "failed": 1,
  "baseUrl": "http://localhost:3000",
  "tripId": "9a936b77-f1b9-426f-9310-b14e21a1a283",
  "guestId": "6bba3b7d-6aec-4266-b826-8a5471e62369",
  "runId": "099f9d39",
  "cleanup": {
    "attempted": true,
    "tripDeleted": true,
    "journalDeleted": true,
    "profileDeleted": true,
    "userDeleted": true,
    "error": null
  },
  "stdout": " \"journal editor dialog has keyboard focus management\",\n      \"ok\": true,\n      \"activeInsideDialog\": true,\n      \"ariaModal\": \"true\",\n      \"focusStayedInDialog\": true,\n      \"visibleAfterEscape\": false\n    },\n    {\n      \"name\": \"journal reader and delete dialogs have keyboard focus management\",\n      \"ok\": true,\n      \"reader\": {\n        \"activeInsideDialog\": true,\n        \"ariaModal\": \"true\",\n        \"focusStayedInDialog\": true\n      },\n      \"deleteDialog\": {\n        \"activeInsideDialog\": true,\n        \"ariaModal\": \"true\",\n        \"focusStayedInDialog\": true,\n        \"visibleAfterEscape\": false\n      }\n    },\n    {\n      \"name\": \"account profile page renders for returning guest without overflow\",\n      \"ok\": true,\n      \"url\": \"http://localhost:3000/account\",\n      \"horizontalOverflow\": false,\n      \"hasAppError\": false\n    },\n    {\n      \"name\": \"account profile save shows clear success confirmation\",\n      \"ok\": true,\n      \"url\": \"http://localhost:3000/account\",\n      \"hasSavedNotice\": true,\n      \"hasSavedButton\": true,\n      \"horizontalOverflow\": false,\n      \"hasAppError\": false\n    },\n    {\n      \"name\": \"saved trip card exposes reopen link to Trip Studio\",\n      \"ok\": true,\n      \"linkCount\": 3,\n      \"href\": \"/trips/9a936b77-f1b9-426f-9310-b14e21a1a283\"\n    },\n    {\n      \"name\": \"saved trip card reopens editable Trip Studio without recovery dead end\",\n      \"ok\": true,\n      \"url\": \"http://localhost:3000/trips/9a936b77-f1b9-426f-9310-b14e21a1a283\",\n      \"hasTripTitle\": true,\n      \"hasSaveTrip\": true,\n      \"hasShareWithFriends\": true,\n      \"hasBuildMaps\": true,\n      \"hasUnavailableRecovery\": false,\n      \"horizontalOverflow\": false,\n      \"hasAppError\": false,\n      \"mainCount\": 1\n    }\n  ],\n  \"failures\": [\n    {\n      \"name\": \"saved trips page shows disposable trip without overflow\",\n      \"ok\": false,\n      \"url\": \"http://localhost:3000/saved\",\n      \"hasTripTitle\": false,\n      \"horizontalOverflow\": false,\n      \"hasAppError\": false\n    }\n  ]\n}",
  "stderr": "Timed out after 900000ms while running saved and account smoke."
}

### public share viral loop smoke

- Code: null
- Checks: n/a
- Failure: {
  "name": "public share viral loop smoke",
  "ok": false,
  "code": null,
  "elapsedMs": 951131,
  "mutatesLocal": true,
  "timedOut": true,
  "stdout": "",
  "stderr": "node:internal/modules/run_main:123\n    triggerUncaughtException(\n    ^\n\nlocator.click: Timeout 30000ms exceeded.\nCall log:\n\u001b[2m  - waiting for getByRole('button', { name: 'Copy link' })\u001b[22m\n\n    at /Users/rodneyblair/Documents/GitHub/globe-travel/client/scripts/platform-share-viral-smoke.mjs:269:61 {\n  name: 'TimeoutError'\n}\n\nNode.js v22.20.0\n\nTimed out after 900000ms while running public share viral loop smoke."
}


## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set `QA_RELEASE_INCLUDE_SHARE_MULTI_ITINERARY=1` to include the multi-itinerary public share Browser loop with disposable public trips, social-card image checks, recipient feedback, owner readback, and feedback refresh.
- Set `QA_RELEASE_INCLUDE_PLANNER_ACTUALS=1` to include live planner generated-actual map-trust checks; use `QA_RELEASE_PLANNER_ACTUALS_PRESET` to choose the fixture preset.
- Set `QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set `QA_RELEASE_INCLUDE_STRIPE_PORTAL=1` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
