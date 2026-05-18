# Commercial Upgrade Modal Recovery QA

Date: 2026-05-18
Surface: `/saved?tab=journal&qaUpgradeModal=1&qaCheckoutFailure=1`
User lens: free journal user who reaches the note limit and is asked to upgrade.

## Finding

The journal upgrade modal was a launch-readiness gap because it could fail checkout silently and the paid feature list still included a "coming soon" item. That made the paid path feel unfinished and left users without a recovery action.

## Fix

- Removed the unshipped "Export to PDF (coming soon)" paid feature from shared plan copy.
- Replaced it with "Friend-ready public review pages", which reflects functionality already available in the app.
- Added accessible dialog semantics to the upgrade modal.
- Added a visible checkout error state with a `Try again` recovery action.
- Added a development-only QA path to open the journal upgrade modal and simulate checkout failure.
- Added this flow to `npm run qa:billing-recovery`.

## Browser Evidence

Checked in Browser on localhost:

- Upgrade modal opens from `/saved?tab=journal&qaUpgradeModal=1&qaCheckoutFailure=1`.
- Modal title is `Unlock the full planning workspace`.
- Modal exposes `role="dialog"` and `aria-modal="true"`.
- Modal takes initial keyboard focus.
- Modal keeps keyboard focus inside the dialog while open.
- Plan copy includes `Friend-ready public review pages`.
- Page text does not include `coming soon`.
- Checkout failure shows `Checkout is temporarily unavailable in QA mode.`.
- Recovery button `Try again` is visible.
- Escape closes the modal.
- No horizontal overflow was detected.

Screenshot: `qa/commercial-upgrade-modal-recovery-2026-05-18.png`

## Automated Evidence

`npm run qa:billing-recovery` passed `13/13`, including:

- `journal upgrade dialog is accessible and commercially ready`
- `journal upgrade dialog shows checkout recovery`
- `journal upgrade dialog traps keyboard focus`
- `journal upgrade dialog closes with Escape`
