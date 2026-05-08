'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { CompassRose } from '@/components/atmosphere/CompassRose'
import { ContourOverlay } from '@/components/atmosphere/ContourOverlay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsSaving(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setIsSaving(false)
      return
    }

    setMessage('Password updated. Taking you to your planner…')
    router.push('/chat')
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper px-6 text-foreground overflow-hidden">
      <div className="absolute inset-0 -z-0 opacity-80">
        <ContourOverlay density="sparse" />
      </div>
      <div className="paper-grain absolute inset-0 -z-0" />

      <div className="relative w-full max-w-md card-paper p-8 shadow-[var(--shadow-md)]">
        <Link href="/" className="mb-7 inline-flex items-center gap-2.5">
          <CompassRose size={28} showLabels={false} />
          <span className="t-serif text-[1rem] tracking-[-0.005em] text-foreground">
            Globe<span className="text-ink-3">.travel</span>
          </span>
        </Link>

        <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-ink-3 mb-3">
          RECALIBRATE
        </p>
        <h1 className="h-detail text-foreground mb-2">Set a new password.</h1>
        <p className="text-body text-ink-2 mb-7">
          Pick a fresh password, then we&apos;ll bring you back to your planner.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
                strokeWidth={1.5}
              />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="pl-10 pr-10 h-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-body-sm text-[var(--terracotta)] text-center">{error}</p>}
          {message && <p className="text-body-sm text-[var(--moss)] text-center">{message}</p>}

          <Button type="submit" disabled={isSaving} size="lg" className="w-full">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Update password
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
