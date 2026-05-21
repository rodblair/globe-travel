# Launch Signoff Audit

Date: 2026-05-21

## Scope

Close the launch-readiness evidence gap where current production health, full release-candidate evidence, visual QA, hosted Stripe evidence, and postdeploy verification had to be checked manually across separate files.

## Change

- Added `npm run qa:launch-signoff`.
- Added `client/scripts/platform-launch-signoff.mjs` as a read-only launch signoff audit.
- The audit fetches production `/api/health`, verifies deployment metadata and `11/11` health, parses the full local release-candidate summary, parses the responsive visual summary, checks hosted Stripe Checkout and portal screenshots, confirms required launch docs exist, and verifies postdeploy production evidence.

## Verification

```bash
node --check scripts/platform-launch-signoff.mjs
npm run qa:launch-signoff
```

Result:

- Launch signoff audit: `15/15`
- Production health: `ok`, `11/11`
- Production deployment commit at audit time: `a7a14162fdbaecaff6307642c0fbcc282d72121f`
- Full local release-candidate evidence: `33/33`
- Responsive visual QA evidence: `50/50`
- Hosted Stripe Checkout and portal screenshot evidence: present
- Postdeploy production release evidence: present

## Notes

- This is a signoff evidence gate, not a replacement for running the full local or production release gates after product changes.
- Set `QA_LAUNCH_EXPECTED_COMMIT=<sha>` when the audit must prove that a specific deployed commit is live.
