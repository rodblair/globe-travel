# Guest Account Race Smoke

Date: 2026-05-26
Environment: http://localhost:3000
Guest id: 4fcae8e6-dc4a-466d-8cbc-05d6db58275c
Status: pass

## Result

- Checked: 2
- Passed: 2
- Failed: 0
- Request paths: /api/trips, /api/journal, /api/trips, /api/journal, /api/trips, /api/journal
- Cleanup: ok

## Waves

### initial-parallel

- Pass: /api/trips -> 200
- Pass: /api/journal -> 200
- Pass: /api/trips -> 200
- Pass: /api/journal -> 200
- Pass: /api/trips -> 200
- Pass: /api/journal -> 200

### follow-up-parallel

- Pass: /api/trips -> 200
- Pass: /api/journal -> 200
- Pass: /api/trips -> 200
- Pass: /api/journal -> 200
- Pass: /api/trips -> 200
- Pass: /api/journal -> 200

## Checks

- Pass: parallel guest API requests all returned 2xx
- Pass: generated guest cleanup completed

## Notes

- This smoke catches guest auth/profile provisioning races where protected route hydration fires multiple API requests for the same new guest at once.
- Remote runs are blocked by default because this command creates and deletes a guest auth user.
