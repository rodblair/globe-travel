'use client'

import { useEffect, useState } from 'react'

function getLocationSearch() {
  return typeof window === 'undefined' ? '' : window.location.search
}

export function useCurrentSearch() {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const update = () => setSearch(getLocationSearch())
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  return search
}
