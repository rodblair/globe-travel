# Planner Handoff Smoke

Date: 2026-05-26
Base URL: http://localhost:3000
Status: pass
Checked: 17
Passed: 17
Failed: 0
Prompt: Plan a 5 day Athens trip for 4 friends with history food relaxed pacing and one memorable night out

## Coverage

- Verifies /chat?q prompt preservation.
- Verifies disposable five-day Athens draft creation.
- Verifies failed planner start keeps the prompt and retry path.
- Verifies delayed mobile planner start shows progress, disables duplicate-start controls, reaches Trip Studio, and cleans up disposable state.

## Results

| Check | Result |
| --- | --- |
| Planner source derives query prompt from current search params | Pass |
| Planner source does not use stale one-shot query refs | Pass |
| Planner query handoff marks query as sent only inside the delayed send | Pass |
| Planner handoff preserves the prompt in the Trip Studio URL | Pass |
| Planner handoff creates draft trips with days and destination constraints | Pass |
| Planner mobile composer keeps an explicit trip idea label | Pass |
| Planner handoff has a visible opening state | Pass |
| Planner handoff preserves failed prompts for retry | Pass |
| Planner handoff disables starter prompts while opening | Pass |
| Trip Studio explains initial prompt generation before stops arrive | Pass |
| /chat?q prompt route is reachable | Pass |
| Planner draft API accepts the handoff payload | Pass |
| Planner draft API creates the requested five-day Athens trip shell | Pass |
| Planner handoff smoke cleans up disposable draft trip | Pass |
| Browser planner query failure preserves the trip idea and retry path | Pass |
| Browser planner delayed query shows progress and reaches Trip Studio | Pass |
| Browser planner start checks clean up disposable state | Pass |

## Failures

- none
