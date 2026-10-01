'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { AlertCircle, CheckCircle2, Loader2, Mail, User } from 'lucide-react'
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

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null)
  const currentSearch = useCurrentSearch()
  const authNext = getAuthNextFromSearchParams(new URLSearchParams(currentSearch))
  const router = useRouter()
  const supabase = createClient()
  const authRedirectTo =
    typeof window === 'undefined'
      ? `/callback?next=${encodeURIComponent(authNext)}`
      : `${window.location.origin.replace('127.0.0.1', 'localhost')}/callback?next=${encodeURIComponent(authNext)}`

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)
    setPendingConfirmationEmail(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: authRedirectTo,
        },
      })

      if (error) {
        setError(error.message)
      } else if (data.session) {
        clearBrowserGuestSession()
        router.push(authNext)
        router.refresh()
      } else if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setPendingConfirmationEmail(email)
        setMessage(
          'This email already has an account or a pending confirmation. Try signing in, or resend the confirmation below.',
        )
      } else {
        setPendingConfirmationEmail(email)
        setMessage(
          `Confirmation link sent to ${email}. If it doesn't show up, check spam or resend it here.`,
        )
      }
    } catch {
      setError('Could not start signup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail) return
    setIsResending(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingConfirmationEmail,
        options: { emailRedirectTo: authRedirectTo },
      })
      if (error) setError(error.message)
      else setMessage(`Sent another confirmation link to ${pendingConfirmationEmail}.`)
    } catch {
      setError('Could not resend the confirmation. Please try again in a minute.')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoogleSignup = async () => {
    clearBrowserGuestSession()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTo },
    })
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. Plan a trip in minutes."
      panelTitle="Pick the crew, pick the city, plan it together."
    >
      <GoogleButton onClick={handleGoogleSignup} label="Sign up with Google" />
      <AuthDivider>or sign up with email</AuthDivider>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Maya Tanaka"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 pl-9"
            />
          </div>
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            minLength={6}
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <div className="space-y-3">
            <Alert>
              <CheckCircle2 className="text-success" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            {pendingConfirmationEmail && (
              <Button type="button" variant="outline" onClick={handleResendConfirmation} disabled={isResending} className="w-full">
                {isResending ? 'Sending…' : 'Resend confirmation email'}
              </Button>
            )}
          </div>
        )}

        <Button type="submit" disabled={isLoading} size="lg" className="w-full">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms of Service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
      </p>

      <div className="mt-6 space-y-3 border-t pt-6 text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{' '}
          <Link href={appendAuthNext('/login', authNext)} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p>
          Want to look around first?{' '}
          <Link href={appendAuthNext('/api/guest/start', authNext)} className="font-medium text-foreground hover:underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
