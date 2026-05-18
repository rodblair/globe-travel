const AUTH_FALLBACK_NEXT = '/chat'

function safeFallback(fallback: string) {
  return fallback.startsWith('/') && !fallback.startsWith('//') ? fallback : AUTH_FALLBACK_NEXT
}

export function getSafeAuthNext(value: string | null | undefined, fallback = AUTH_FALLBACK_NEXT) {
  const cleanFallback = safeFallback(fallback)
  if (!value || !value.startsWith('/') || value.startsWith('//')) return cleanFallback

  try {
    const url = new URL(value, 'https://globe.local')
    const pathname = url.pathname
    if (
      pathname.startsWith('/api') ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/callback' ||
      pathname.startsWith('/auth')
    ) {
      return cleanFallback
    }
    return `${pathname}${url.search}${url.hash}`
  } catch {
    return cleanFallback
  }
}

export function getAuthNextFromSearchParams(searchParams: URLSearchParams, fallback = AUTH_FALLBACK_NEXT) {
  const explicitNext = searchParams.get('next')
  if (explicitNext) return getSafeAuthNext(explicitNext, fallback)

  const prompt = searchParams.get('q')?.trim()
  if (prompt && prompt.length <= 500) {
    const nextParams = new URLSearchParams({ q: prompt })
    return `/chat?${nextParams.toString()}`
  }

  return safeFallback(fallback)
}

export function appendAuthNext(path: string, next: string, fallback = AUTH_FALLBACK_NEXT) {
  const safeNext = getSafeAuthNext(next, fallback)
  const url = new URL(path, 'https://globe.local')
  if (safeNext !== cleanPathWithSearch(url, fallback)) {
    url.searchParams.set('next', safeNext)
  }
  return `${url.pathname}${url.search}${url.hash}`
}

function cleanPathWithSearch(url: URL, fallback: string) {
  return getSafeAuthNext(`${url.pathname}${url.search}${url.hash}`, fallback)
}
