'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-browser'

function getHashParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(hash)
}

function getSafeNext(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/chat'
}

function CallbackClientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [message, setMessage] = useState('Confirming your account...')

  useEffect(() => {
    let mounted = true

    async function completeAuth() {
      const hashParams = getHashParams()
      const next = getSafeNext(searchParams.get('next') || hashParams.get('next'))
      const authError =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error')

      if (authError) {
        router.replace(`/login?error=${encodeURIComponent(authError)}`)
        return
      }

      try {
        const code = searchParams.get('code')
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
        const type = (searchParams.get('type') || hashParams.get('type')) as EmailOtpType | null
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const isPasswordRecovery = type === 'recovery'

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          })
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (!session) {
            throw new Error('That confirmation link is expired or invalid. Please request a new one.')
          }
        }

        if (mounted) {
          setMessage(isPasswordRecovery
            ? 'Verified. Taking you to reset your password...'
            : 'Confirmed. Taking you to your planner...'
          )
          router.replace(isPasswordRecovery ? '/reset-password' : next)
          router.refresh()
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : 'That confirmation link is expired or invalid. Please request a new one.'
        router.replace(`/login?error=${encodeURIComponent(errorMessage)}`)
      }
    }

    void completeAuth()

    return () => {
      mounted = false
    }
  }, [router, searchParams, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <p className="text-sm text-white/70">{message}</p>
      </div>
    </div>
  )
}

export default function CallbackClientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CallbackClientContent />
    </Suspense>
  )
}
