import { NextResponse } from 'next/server'

export function GET() {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirming account...</title>
  </head>
  <body style="margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif">
    <div style="min-height:100vh;display:grid;place-items:center;padding:24px">
      <p>Confirming your account...</p>
    </div>
    <script>
      window.location.replace('/auth/callback-client' + window.location.search + window.location.hash);
    </script>
  </body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  )
}
