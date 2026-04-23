'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { motion } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import LandingGlobe from '@/components/globes/LandingGlobe'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const authRedirectTo = typeof window === 'undefined'
    ? '/callback'
    : `${window.location.origin.replace('127.0.0.1', 'localhost')}/callback`

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authError = params.get('error_description') || params.get('error')
    if (!authError) return

    setError(
      authError === 'auth_error'
        ? 'That confirmation link is expired or invalid. Please request a new one.'
        : authError
    )
  }, [])

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
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the magic link!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
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
      setError('Enter your email address first, then we can send a reset link.')
      return
    }

    setIsResettingPassword(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTo,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(`Password reset link sent to ${email}.`)
    }

    setIsResettingPassword(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left: Globe Background */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <LandingGlobe />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80" />
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-3xl font-serif font-semibold mb-3">
              Your crew, your next break.
            </h2>
            <p className="text-white/50 text-lg">
              Coordinate quick city escapes, align everyone&apos;s taste, and get to a plan your friends will actually commit to.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Branding */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <span className="text-2xl">🌍</span>
              <span className="text-2xl font-serif font-semibold tracking-tight">
                Globe Travel
              </span>
            </Link>
            <h1 className="text-3xl font-serif font-semibold mb-2">Welcome back</h1>
            <p className="text-white/50">Sign in to keep planning your next city break</p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all duration-300"
              />
            </div>

            {!isMagicLink && (
              <motion.div
                className="relative"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isMagicLink}
                  className="w-full h-12 pl-11 pr-11 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </motion.div>
            )}

            {!isMagicLink && (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || isLoading}
                className="text-left text-xs font-medium text-amber-400/80 hover:text-amber-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResettingPassword ? 'Sending reset link...' : 'Forgot your password?'}
              </button>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 text-sm text-center"
              >
                {message}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {isMagicLink ? 'Send Magic Link' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Magic Link */}
          <button
            onClick={() => {
              setIsMagicLink(!isMagicLink)
              setError(null)
              setMessage(null)
            }}
            className="w-full text-center text-sm text-white/40 hover:text-white/60 mt-4 transition-colors"
          >
            {isMagicLink ? 'Sign in with password instead' : 'Sign in with magic link instead'}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-white/40 mt-8">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
