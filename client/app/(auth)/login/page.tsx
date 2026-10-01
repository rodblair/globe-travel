'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'
import { AuthDivider, GoogleButton, PasswordInput } from '@/components/auth/AuthParts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { appendAuthNext, getAuthNextFromSearchParams } from '@/lib/auth-next'
import { clearBrowserGuestSession } from '@/lib/dev-auth'
import { useCurrentSearch } from '@/lib/use-current-search'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const authError = params.get('error_description') || params.get('error')
    if (!authError) return null
    return authError === 'auth_error'
      ? 'That confirmation link is expired or invalid. Please request a new one.'
      : authError
  })
  const [message, setMessage] = useState<string | null>(null)
  const currentSearch = useCurrentSearch()
  const authNext = getAuthNextFromSearchParams(new URLSearchParams(currentSearch))
  const router = useRouter()
  const supabase = createClient()
  const authRedirectTo =
    typeof window === 'undefined'
      ? `/callback?next=${encodeURIComponent(authNext)}`
      : `${window.location.origin.replace('127.0.0.1', 'localhost')}/callback?next=${encodeURIComponent(authNext)}`

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    if (isMagicLink) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: authRedirectTo },
      })
      if (error) setError(error.message)
      else setMessage('Magic link sent. Check your email.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        clearBrowserGuestSession()
        router.push(authNext)
        router.refresh()
      }
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    clearBrowserGuestSession()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo },
    })
  }

  const handlePasswordReset = async () => {
    setError(null)
    setMessage(null)

    if (!email) {
      setError('Enter your email first, then we can send a reset link.')
      return
    }

    setIsResettingPassword(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTo,
    })
    if (error) setError(error.message)
    else setMessage(`Reset link sent to ${email}.`)
    setIsResettingPassword(false)
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to keep planning your next trip.">
      <GoogleButton onClick={handleGoogleLogin} />
      <AuthDivider>or continue with email</AuthDivider>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 pl-9"
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || isLoading}
                className="h-auto text-sm"
             >
                {isResettingPassword ? 'Sending…' : 'Forgot password?'}
              </Button>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              autoComplete="current-password"
              required={!isMagicLink}
            />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert>
            <CheckCircle2 className="text-success" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isLoading} size="lg" className="w-full">
          {isLoading ? <Loader2 className="animate-spin" /> : isMagicLink ? 'Send magic link' : 'Sign in'}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setIsMagicLink(!isMagicLink)
          setError(null)
          setMessage(null)
        }}
        className="mt-3 w-full text-muted-foreground"
     >
        {isMagicLink ? 'Sign in with password instead' : 'Email me a magic link instead'}
      </Button>

      <div className="mt-6 space-y-3 border-t pt-6 text-center text-sm text-muted-foreground">
        <p>
          New to Globe.travel?{' '}
          <Link href={appendAuthNext('/signup', authNext)} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <p>
          Just exploring?{' '}
          <Link href={appendAuthNext('/api/guest/start', authNext)} className="font-medium text-foreground hover:underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
