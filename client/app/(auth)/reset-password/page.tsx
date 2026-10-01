'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/AuthParts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
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
    <AuthShell title="Set a new password" subtitle="Pick a fresh password and we'll take you back to your planner.">
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
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
          <Alert>
            <CheckCircle2 className="text-success" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSaving} size="lg" className="w-full">
          {isSaving ? <Loader2 className="animate-spin" /> : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  )
}
