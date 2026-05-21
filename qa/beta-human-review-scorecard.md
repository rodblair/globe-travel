# Beta Human Review Scorecard

Date: 2026-05-21

Use this scorecard for every review in `qa/beta-human-review-register.json`. A review is complete only when the reviewer records the prompt, route or share URL, viewport, device, scorecard ratings, and findings.

## Reviewer Setup

- Use a clean browser profile or an isolated guest session.
- Test the assigned prompt as a first-time user.
- Use the assigned device lens: phone or desktop.
- Complete the journey through planner, Trip Studio, map review, save/reopen when assigned, public share, and feedback when assigned.
- Record any confusing, broken, or untrustworthy moment with severity.

## Required Ratings

Score each item from `1` to `5`.

- `firstMinuteClarity`: Can a new user understand what to do and why?
- `itineraryUsefulness`: Would this itinerary help the intended traveler make decisions?
- `mapTrust`: Do pins, day geography, and route states feel truthful?
- `editAndSwapConfidence`: Can the user safely adjust the plan?
- `saveReopenConfidence`: Can the user trust that work is preserved?
- `shareRecipientClarity`: Can a friend understand the public page without context?
- `feedbackLoopClarity`: Does friend feedback feel easy and useful to the organizer?
- `mobileUsability`: Are key actions visible and usable on the assigned device?
- `paidValueCredibility`: Does the app feel useful and polished enough to support a paid plan?

## Severity Rules

- `P0`: blocks a core journey, corrupts work, breaks production, or exposes sensitive data.
- `P1`: makes a core journey confusing, inaccessible, untrustworthy, or commercially unacceptable.
- `P2`: creates friction but has a workaround.
- `P3`: polish issue with no direct completion risk.

Public launch approval requires at least `25` completed reviews and zero unresolved `P0` or `P1` findings.

## Review Record Template

```json
{
  "id": "BETA-HR-001",
  "status": "passed",
  "reviewerRole": "first-time guest",
  "routeOrShareUrl": "https://globe-travel-two.vercel.app/...",
  "viewport": "390x844",
  "device": "phone",
  "completedAt": "2026-06-01",
  "firstMinuteOutcome": "Understood the planner CTA and created a trip without assistance.",
  "mapTrustNotes": "All visible map pins matched the expected city or region.",
  "shareFeedbackOutcome": "Recipient could submit feedback and owner could understand it.",
  "scorecard": {
    "firstMinuteClarity": 4,
    "itineraryUsefulness": 4,
    "mapTrust": 4,
    "editAndSwapConfidence": 3,
    "saveReopenConfidence": 4,
    "shareRecipientClarity": 4,
    "feedbackLoopClarity": 4,
    "mobileUsability": 4,
    "paidValueCredibility": 3
  },
  "findings": [
    {
      "severity": "P2",
      "status": "open",
      "surface": "Trip Studio",
      "title": "Swap copy was understandable but not confidence-building",
      "notes": "Reviewer wanted clearer before/after explanation."
    }
  ]
}
```
