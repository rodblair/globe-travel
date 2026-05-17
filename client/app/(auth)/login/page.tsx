'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AuthCanvas } from '@/components/atmosphere/AuthCanvas'
import { AlbatrossBrand } from '@/components/atmosphere/AlbatrossBrand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
  const router = useRouter()
  const supabase = createClient()
  const authRedirectTo =
    typeof window === 'undefined'
      ? '/callback'
      : `${window.location.origin.replace('127.0.0.1', 'localhost')}/callback`

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
        router.push('/chat')
        router.refresh()
      }
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
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
    <AuthCanvas
      side="left"
      panelKicker="RETURN / FAMILIAR PORT"
      panelTitle="Welcome back to the journey."
      panelSubtitle="Pick up the itinerary, rejoin the conversation, keep the trip moving forward."
    >
      {/* Branding for mobile */}
      <div className="lg:hidden mb-10 flex items-center gap-2.5">
        <AlbatrossBrand textClassName="text-[1.125rem]" compact />
      </div>

      <div className="mb-8">
        <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-ink-3 mb-3">
          SIGN IN
        </p>
        <h1 className="h-detail text-foreground mb-2">Welcome back.</h1>
        <p className="text-body text-ink-2">Sign in to keep planning your next break.</p>
      </div>

      {/* Guest preview card */}
      <div className="mb-7 card-paper p-5 border-[color:var(--pillar-nature-wash)]">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-[var(--pillar-nature)] mb-1">
              QUICK PREVIEW
            </p>
            <h2 className="t-h3 text-foreground">Try Globe without an account</h2>
          </div>
        </div>
        <p className="text-body-sm text-ink-2 mb-4">
          Plan a trip, create a share link, and let friends react before you commit to an account.
        </p>
        <Button asChild variant="action" size="lg" className="w-full">
          <Link href="/api/guest/start">
            Continue as guest
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Google OAuth */}
      <Button
        onClick={handleGoogleLogin}
        variant="outline"
        size="lg"
        className="w-full mb-5"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        <span className="text-sm font-medium">Continue with Google</span>
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1 h-px bg-rule" />
        <span className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-ink-3">
          OR
        </span>
        <div className="flex-1 h-px bg-rule" />
      </div>

      {/* Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
              strokeWidth={1.5}
            />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-11"
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || isLoading}
                className="touch-target inline-flex items-center justify-center rounded-md px-2 t-mono text-[0.6875rem] tracking-[0.08em] text-[var(--brass)] transition-colors hover:text-[var(--brass-hover)] disabled:opacity-50"
              >
                {isResettingPassword ? 'Sending…' : 'Forgot?'}
              </button>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
                strokeWidth={1.5}
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isMagicLink}
                className="pl-10 pr-10 h-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="touch-target absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md text-ink-3 transition-colors hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-body-sm text-[var(--terracotta)] text-center">{error}</p>
        )}
        {message && (
          <p className="text-body-sm text-[var(--moss)] text-center">{message}</p>
        )}

        <Button type="submit" disabled={isLoading} size="lg" className="w-full">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {isMagicLink ? 'Send magic link' : 'Sign in'}
              <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <button
        onClick={() => {
          setIsMagicLink(!isMagicLink)
          setError(null)
          setMessage(null)
        }}
        className="touch-target mt-5 inline-flex w-full items-center justify-center text-center text-body-sm text-ink-3 transition-colors hover:text-foreground"
      >
        {isMagicLink
          ? 'Sign in with password instead'
          : 'Sign in with magic link instead'}
      </button>

      <p className="text-center text-body-sm text-ink-3 mt-7">
        New to Globe?{' '}
        <Link
          href="/signup"
          className="touch-target inline-flex items-center justify-center rounded-md px-1 text-[var(--brass)] font-medium transition-colors hover:text-[var(--brass-hover)]"
        >
          Begin a journey
        </Link>
      </p>
    </AuthCanvas>
  )
}
