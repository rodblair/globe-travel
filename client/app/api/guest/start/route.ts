import { NextResponse } from 'next/server'
import { getAuthNextFromSearchParams, getSafeAuthNext } from '@/lib/auth-next'
import { GUEST_SESSION_COOKIE } from '@/lib/dev-auth'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = new URL(getAuthNextFromSearchParams(url.searchParams), url.origin)
  const prompt = url.searchParams.get('q')?.trim()
  if (redirectTo.pathname === '/chat' && !redirectTo.searchParams.has('q') && prompt && prompt.length <= 500) {
    redirectTo.searchParams.set('q', prompt)
  }
  const next = url.searchParams.get('next')
  if (next) {
    const safeNext = getSafeAuthNext(next)
    redirectTo.pathname = safeNext.split('?')[0].split('#')[0]
    redirectTo.search = new URL(safeNext, url.origin).search
    redirectTo.hash = new URL(safeNext, url.origin).hash
  }
  const response = NextResponse.redirect(redirectTo)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    response.cookies.set(GUEST_SESSION_COOKIE, '', {
      path: '/',
      maxAge: 0,
    })
    return response
  }

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
