import { NextResponse } from 'next/server'
import { GUEST_SESSION_COOKIE } from '@/lib/dev-auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = new URL('/chat', url.origin)
  const prompt = url.searchParams.get('q')?.trim()
  if (prompt && prompt.length <= 500) {
    redirectTo.searchParams.set('q', prompt)
  }
  const response = NextResponse.redirect(redirectTo)
  const requestedGuestId = url.searchParams.get('id')
  const guestId =
    process.env.NODE_ENV === 'development' &&
    requestedGuestId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedGuestId)
      ? requestedGuestId
      : crypto.randomUUID()

  response.cookies.set(GUEST_SESSION_COOKIE, guestId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })

  return response
}
