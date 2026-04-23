'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

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

    setMessage('Password updated. Taking you to your planner...')
    router.push('/chat')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="mb-8 inline-flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="font-serif text-2xl font-semibold tracking-tight">
            Globe Travel
          </span>
        </Link>

        <h1 className="mb-2 font-serif text-3xl font-semibold">Set a new password</h1>
        <p className="mb-8 text-sm text-white/50">
          Choose a fresh password, then we&apos;ll bring you back to your planner.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-11 text-white placeholder:text-white/30 transition-all duration-300 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400">
              {error}
            </motion.p>
          )}

          {message && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-emerald-400">
              {message}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-semibold text-black transition-all duration-300 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <>
                Update Password
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
