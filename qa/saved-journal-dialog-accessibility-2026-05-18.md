# Saved Journal Dialog Accessibility QA

Date: 2026-05-18
Surface: `/saved?tab=journal`
User lens: returning organizer managing trip notes with keyboard or assistive technology.

## Finding

Saved journal modal surfaces did not yet match the platform keyboard quality bar. The note editor, note reader, and delete confirmation opened visually as modals, but they lacked explicit dialog semantics, initial focus handling, Escape close behavior, and focus containment while open.

## Fix

- Added a shared `useDialogFocus` hook for modal focus, Escape close, and Tab focus containment.
- Moved the upgrade modal onto the shared hook so paid-path behavior stays consistent.
- Added `role="dialog"` / `aria-modal="true"` to the journal editor and note reader.
- Added `role="alertdialog"` / `aria-modal="true"` to the delete confirmation.
- Added labelled/described relationships for journal dialogs.
- Added accessible labels for note card open/edit/delete actions.
- Expanded `npm run qa:saved-account` to prove journal editor, reader, and delete dialogs keep focus inside and close with Escape.
- Hardened `npm run qa:billing-recovery` so it exits cleanly after summary output.

## Browser Evidence

Checked in Browser on localhost:

- `/saved?tab=journal` opened.
- `Add first note` opened the `New trip note` dialog.
- Dialog exposed `aria-modal="true"`.
- Focus started inside the dialog.
- Repeated Tab stayed inside the dialog.
- Escape closed the dialog.
- No horizontal overflow was detected.

## Automated Evidence

- `npm run qa:saved-account` passed `12/12`.
- `npm run qa:billing-recovery` passed `13/13`.
- `QA_SHARE_SLUG=x3m2c8cnws npm run qa:a11y` passed `16/16`.
- `QA_VISUAL_ROUTES=saved-journal,saved-trips QA_VISUAL_VIEWPORTS=phone,tablet,laptop QA_VISUAL_ARTIFACT_NAME=visual-baseline-2026-05-18-saved-journal-dialogs npm run qa:visual` passed `6/6`.
