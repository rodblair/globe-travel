import { NextResponse } from 'next/server'
import { GUEST_SESSION_COOKIE } from '@/lib/dev-auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = new URL('/chat', url.origin)
  const response = NextResponse.redirect(redirectTo)

  response.cookies.set(GUEST_SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: false,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })

  return response
}
