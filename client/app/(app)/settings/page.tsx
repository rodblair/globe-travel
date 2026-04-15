'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Settings, User, LogOut, Save } from 'lucide-react'

export default function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
        })
        .eq('id', profile.id)
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-white/40" />
            Settings
          </h1>
          <p className="text-white/40 mt-1 text-sm">Manage your profile and preferences</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full bg-white/8 border border-white/15 overflow-hidden flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-white/25" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{profile?.display_name || 'Traveler'}</p>
                <p className="text-xs text-white/35 mt-0.5">{profile?.username ? `@${profile.username}` : 'No username set'}</p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2 block">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourusername"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about your travels..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 text-sm resize-none focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40'
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.04] border border-white/8 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Sign out</p>
              <p className="text-xs text-white/35 mt-0.5">You can sign back in anytime</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
