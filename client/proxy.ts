import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeAuthNext } from '@/lib/auth-next'
import { GUEST_SESSION_COOKIE } from '@/lib/dev-auth'

export async function proxy(request: NextRequest) {
  const isDevAuthBypass = process.env.NODE_ENV === 'development'
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require auth
  const publicPaths = [
    '/',
    '/pricing',
    '/login',
    '/signup',
    '/reset-password',
    '/callback',
    '/auth',
    '/share',
    '/t',
    '/manifest.webmanifest',
    '/opengraph-image',
    '/sitemap.xml',
    '/twitter-image',
  ]
  const pathname = request.nextUrl.pathname
  const isPublicPath = publicPaths.some((path) => {
    if (path === '/auth') return pathname.startsWith('/auth')
    if (path === '/share') return pathname.startsWith('/share')
    if (path === '/t') return pathname.startsWith('/t')
    return pathname === path
  })
  const isApiPath = request.nextUrl.pathname.startsWith('/api')
  const hasGuestSession = Boolean(request.cookies.get(GUEST_SESSION_COOKIE)?.value)

  if (isDevAuthBypass && !isApiPath) {
    return supabaseResponse
  }

  if (!user && !hasGuestSession && !isPublicPath && !isApiPath) {
    const url = request.nextUrl.clone()
    const next = getSafeAuthNext(`${request.nextUrl.pathname}${request.nextUrl.search}`)
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', next)
    return NextResponse.redirect(url)
  }

  // If logged in, check onboarding
  if (user && !hasGuestSession && !isPublicPath && !isApiPath && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from login/signup
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = new URL(getSafeAuthNext(request.nextUrl.searchParams.get('next')), request.url)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
}
