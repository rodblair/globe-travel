'use client'

import { useSyncExternalStore } from 'react'

function subscribeToLocationChange(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getLocationSearch() {
  return typeof window === 'undefined' ? '' : window.location.search
}

function getServerSearch() {
  return ''
}

export function useCurrentSearch() {
  return useSyncExternalStore(subscribeToLocationChange, getLocationSearch, getServerSearch)
}
