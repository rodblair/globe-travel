import type { User } from '@supabase/supabase-js'

export const isDevAuthBypassEnabled = process.env.NODE_ENV === 'development'

export const devUser = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dev@globe-travel.local',
  app_metadata: { provider: 'dev', providers: ['dev'] },
  user_metadata: { full_name: 'Dev Traveler' },
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
} as User

export const devProfile = {
  id: devUser.id,
  username: 'dev-traveler',
  display_name: 'Dev Traveler',
  avatar_url: null,
  bio: 'Local development profile for QA walkthroughs.',
  travel_style: 'group city breaks',
  onboarding_completed: true,
  countries_count: 0,
  places_count: 0,
  streak_days: 0,
}
