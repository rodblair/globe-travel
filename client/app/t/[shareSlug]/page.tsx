import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import SharedTripClient from './SharedTripClient'

type SharePageProps = {
  params: Promise<{ shareSlug: string }>
}

async function getPublicTripMeta(shareSlug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trips')
    .select('title')
    .eq('share_slug', shareSlug)
    .eq('is_public', true)
    .maybeSingle()

  return data
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { shareSlug } = await params
  const trip = await getPublicTripMeta(shareSlug)

  if (!trip) {
    return {
      title: 'Shared Globe.travel itinerary unavailable',
      description: 'This Globe.travel trip link may have been made private or removed.',
    }
  }

  const title = `${trip.title} | Globe.travel`
  const description = `Review the ${trip.title} itinerary, react to the day plan, and help the group choose the trip everyone can say yes to.`
  const url = `/t/${shareSlug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Globe.travel',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function SharedTripPage({ params }: SharePageProps) {
  const { shareSlug } = await params
  return <SharedTripClient shareSlug={shareSlug} />
}
