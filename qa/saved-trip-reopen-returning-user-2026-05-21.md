# Saved Trip Reopen Returning-User QA

Date: 2026-05-21
Surface: `/saved` to `/trips/[tripId]`
Status: Passed

## Change

`npm run qa:saved-account` now verifies the returning-user saved trip journey through completion instead of only checking that a saved trip card exposes a link.

The gate creates a disposable guest trip, loads `/saved`, confirms the trip appears, clicks the saved-trip card link, and verifies the resulting Trip Studio owner route.

## Automated Evidence

Command:

```bash
npm run qa:saved-account
```

Result:

- Passed `14/14`.
- Disposable trip and journal entry were created, read back, displayed, and cleaned up.
- `/saved` rendered the saved trip without app error or horizontal overflow.
- `/saved?tab=journal` rendered the edited note without app error or horizontal overflow.
- Journal editor, reader, and delete dialogs retained keyboard focus and Escape recovery.
- `/account` rendered for the returning guest without app error or horizontal overflow.
- The saved trip card exposed three valid `/trips/[tripId]` links.
- Clicking the saved trip card reopened the editable Trip Studio route.
- Reopened Trip Studio showed the saved title, `Save trip`, `Build maps`, and `Share with friends`.
- Reopened Trip Studio did not show the unavailable-trip recovery state.
- Reopened Trip Studio had no app error, no horizontal overflow, and exactly one page-level `main` landmark.

## In-App Browser Evidence

Browser repeated the user journey with a disposable guest and trip:

- Started a development guest session at `/api/guest/start?id=<guestId>&next=/saved`.
- Confirmed `/saved` showed the generated saved trip.
- Confirmed the saved-trip card exposed three matching Trip Studio links.
- Clicked through to `/trips/<tripId>`.
- Confirmed the Trip Studio URL matched the disposable trip.
- Confirmed the saved title, `Save trip`, `Build maps`, and `Share with friends` were present.
- Confirmed no unavailable-trip recovery, no app error, no horizontal overflow, and one page-level `main` landmark.
- Cleaned up the disposable trip, guest profile, and guest auth user.

## Verification

Additional commands:

```bash
npm run lint
npm run build
```

Both passed.
