'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  Globe2,
  MapPin,
  Flame,
  Trophy,
  Share2,
  Edit3,
  BookOpen,
  Calendar,
  Check,
} from 'lucide-react'
import Link from 'next/link'

const ProfileGlobe = dynamic(
  () => import('@/components/globes/ProfileGlobe'),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
)

export default function ProfilePage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? window.location.origin + (profile?.username ? `/u/${profile.username}` : '/globe')
      : '/globe'
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: try opening share sheet on mobile
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Globe Travel', url: shareUrl }).catch(() => {})
      }
    }
  }

  const { data: userPlaces } = useQuery({
    queryKey: ['user-places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_places')
        .select('*, place:places(*)')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const { data: recentEntries } = useQuery({
    queryKey: ['journal-entries', 'recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('*, user_place:user_places(*, place:places(*))')
        .order('created_at', { ascending: false })
        .limit(3)
      return data
    },
  })

  const pins = useMemo(() => {
    if (!userPlaces) return []
    return userPlaces
      .filter((up: any) => up.place?.latitude && up.place?.longitude)
      .map((up: any) => ({
        latitude: up.place.latitude,
        longitude: up.place.longitude,
        status: up.status as 'visited' | 'bucket_list',
        name: up.place.name,
      }))
  }, [userPlaces])

  const countriesCount = new Set(
    userPlaces?.filter((p: any) => p.status === 'visited' && p.place?.country).map((p: any) => p.place.country) ?? []
  ).size
  const placesCount = userPlaces?.filter((p: any) => p.status === 'visited').length ?? 0

  const stats = [
    { icon: Globe2, label: 'Countries', value: countriesCount, color: 'text-amber-400' },
    { icon: MapPin, label: 'Places', value: placesCount, color: 'text-emerald-400' },
    { icon: Flame, label: 'Streak', value: profile?.streak_days ?? 0, color: 'text-orange-400' },
    { icon: Trophy, label: 'Achievements', value: 0, color: 'text-purple-400' },
  ]

  const achievements = [
    { emoji: '🌍', name: 'First Country', unlocked: placesCount > 0 },
    { emoji: '✈️', name: '5 Countries', unlocked: countriesCount >= 5 },
    { emoji: '🏆', name: 'Globe Trotter', unlocked: countriesCount >= 10 },
    { emoji: '📝', name: 'Storyteller', unlocked: (recentEntries?.length ?? 0) > 0 },
    { emoji: '🔥', name: '7 Day Streak', unlocked: (profile?.streak_days ?? 0) >= 7 },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Globe Hero */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        <div className="absolute inset-0">
          <ProfileGlobe pins={pins} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            <div className="relative w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || ''}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl">🌍</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-serif font-semibold text-white truncate">
                {profile?.display_name || 'Traveler'}
              </h1>
              {profile?.username && (
                <p className="text-white/50 text-sm">@{profile.username}</p>
              )}
              {profile?.bio && (
                <p className="text-white/40 text-sm mt-1 line-clamp-1">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-sm font-medium text-amber-400 hover:bg-amber-500/30 transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Your Globe
              </>
            )}
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
              <p className="text-xl font-serif font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Achievement badges */}
        <div>
          <h2 className="text-lg font-serif font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            Achievements
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {achievements.map((a) => (
              <div
                key={a.name}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${
                  a.unlocked
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/[0.02] border-white/5 opacity-40'
                }`}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-xs text-white/60 whitespace-nowrap">{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent journal entries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Recent Entries
            </h2>
            <Link href="/journal" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              View all
            </Link>
          </div>
          {recentEntries && recentEntries.length > 0 ? (
            <div className="space-y-3">
              {recentEntries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {entry.mood && <span>{entry.mood}</span>}
                    <h3 className="font-medium text-white">{entry.title}</h3>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2">{entry.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-white/40 text-sm">No journal entries yet. Start writing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
