import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/app/api/trips/_utils'
import { createServiceClient } from '@/lib/supabase-service'

type SwapOption = {
  id: string
  title: string
  placeQuery: string
  type: 'activity' | 'meal' | 'lodging' | 'transport'
  latitude: number
  longitude: number
  country: string
  countryCode: string
  notes: string
}

const SwapBodySchema = z.object({
  preference: z.string().min(1),
  choiceId: z.string().optional(),
})

const ATHENS_SWAP_OPTIONS: Array<{
  pattern: RegExp
  options: SwapOption[]
}> = [
  {
    pattern: /\blotte\b|cafe|bistrot|brunch/i,
    options: [
      {
        id: 'little-tree-books-coffee',
        title: 'Little Tree Books & Coffee',
        placeQuery: 'Little Tree Books & Coffee, Athens',
        type: 'meal',
        latitude: 37.96772,
        longitude: 23.72917,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Nearby cafe with a calmer bookshop feel, good for an easy group reset.',
      },
      {
        id: 'bel-ray',
        title: 'Bel Ray Bar',
        placeQuery: 'Bel Ray Bar, Koukaki, Athens',
        type: 'meal',
        latitude: 37.96384,
        longitude: 23.72442,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'A relaxed Koukaki cafe-bar option with more of a neighborhood feel.',
      },
      {
        id: 'drupes-and-drips',
        title: 'Drupes & Drips',
        placeQuery: 'Drupes & Drips, Athens',
        type: 'meal',
        latitude: 37.96902,
        longitude: 23.72855,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Compact wine, coffee, and snack stop close to the Acropolis Museum.',
      },
    ],
  },
  {
    pattern: /mani mani|dinner|restaurant/i,
    options: [
      {
        id: 'strofi',
        title: 'Strofi',
        placeQuery: 'Strofi, Athens',
        type: 'meal',
        latitude: 37.96801,
        longitude: 23.72453,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Classic Greek dinner with Acropolis views, close enough to keep Day 1 coherent.',
      },
      {
        id: 'to-kati-allo',
        title: 'To Kati Allo',
        placeQuery: 'To Kati Allo, Athens',
        type: 'meal',
        latitude: 37.96824,
        longitude: 23.72825,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Simple, family-run taverna near the museum with a less polished local feel.',
      },
      {
        id: 'point-a',
        title: 'Point a Bar and Restaurant',
        placeQuery: 'Point a Bar and Restaurant, Athens',
        type: 'meal',
        latitude: 37.96856,
        longitude: 23.72819,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Easy rooftop alternative when the group wants views without changing the route.',
      },
    ],
  },
  {
    pattern: /brettos|bar|drinks/i,
    options: [
      {
        id: 'baba-au-rum',
        title: 'Baba au Rum',
        placeQuery: 'Baba au Rum, Athens',
        type: 'activity',
        latitude: 37.97814,
        longitude: 23.72952,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'A more cocktail-forward swap for a drink stop before dinner.',
      },
      {
        id: 'the-clumsies',
        title: 'The Clumsies',
        placeQuery: 'The Clumsies, Athens',
        type: 'activity',
        latitude: 37.97951,
        longitude: 23.72972,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Polished Athens cocktail bar for a more social evening stop.',
      },
      {
        id: 'couleur-locale',
        title: 'Couleur Locale',
        placeQuery: 'Couleur Locale, Athens',
        type: 'activity',
        latitude: 37.97638,
        longitude: 23.72452,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Rooftop drink option near Monastiraki with a strong group vibe.',
      },
    ],
  },
  {
    pattern: /a for athens|rooftop/i,
    options: [
      {
        id: '360-cocktail-bar',
        title: '360 Cocktail Bar',
        placeQuery: '360 Cocktail Bar, Athens',
        type: 'activity',
        latitude: 37.97621,
        longitude: 23.72564,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Very nearby rooftop alternative with direct Acropolis views.',
      },
      {
        id: 'couleur-locale-rooftop',
        title: 'Couleur Locale',
        placeQuery: 'Couleur Locale, Athens',
        type: 'activity',
        latitude: 37.97638,
        longitude: 23.72452,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'A slightly more casual rooftop option for a group.',
      },
      {
        id: 'ms-roof-garden',
        title: 'MS Roof Garden',
        placeQuery: 'MS Roof Garden, Athens',
        type: 'activity',
        latitude: 37.97613,
        longitude: 23.72525,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Close-by rooftop swap that keeps the same evening structure.',
      },
    ],
  },
  {
    pattern: /acropolis museum/i,
    options: [
      {
        id: 'ilias-lalaounis-jewelry-museum',
        title: 'Ilias Lalaounis Jewelry Museum',
        placeQuery: 'Ilias Lalaounis Jewelry Museum, Athens',
        type: 'activity',
        latitude: 37.96822,
        longitude: 23.72711,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'A smaller cultural stop almost beside the Acropolis Museum.',
      },
      {
        id: 'national-museum-contemporary-art',
        title: 'National Museum of Contemporary Art Athens',
        placeQuery: 'National Museum of Contemporary Art Athens',
        type: 'activity',
        latitude: 37.96022,
        longitude: 23.72482,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Better if the group wants modern culture instead of ancient history.',
      },
      {
        id: 'museum-greek-folk-musical-instruments',
        title: 'Museum of Greek Folk Musical Instruments',
        placeQuery: 'Museum of Greek Folk Musical Instruments, Athens',
        type: 'activity',
        latitude: 37.97427,
        longitude: 23.72794,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Small Plaka museum that keeps the morning light and walkable.',
      },
    ],
  },
  {
    pattern: /acropolis of athens|anafiotika/i,
    options: [
      {
        id: 'ancient-agora',
        title: 'Ancient Agora of Athens',
        placeQuery: 'Ancient Agora of Athens',
        type: 'activity',
        latitude: 37.97569,
        longitude: 23.72247,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'A history-rich swap that is still central and easy to sequence.',
      },
      {
        id: 'roman-agora',
        title: 'Roman Agora',
        placeQuery: 'Roman Agora, Athens',
        type: 'activity',
        latitude: 37.97417,
        longitude: 23.72619,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'Shorter, easier ancient-site stop near Plaka.',
      },
      {
        id: 'areopagus-hill',
        title: 'Areopagus Hill',
        placeQuery: 'Areopagus Hill, Athens',
        type: 'activity',
        latitude: 37.97189,
        longitude: 23.72383,
        country: 'Greece',
        countryCode: 'GR',
        notes: 'A scenic, lower-friction swap with strong views.',
      },
    ],
  },
]

function getOptionsForTitle(title: string) {
  return ATHENS_SWAP_OPTIONS.find((entry) => entry.pattern.test(title))?.options || [
    {
      id: 'ancient-agora-fallback',
      title: 'Ancient Agora of Athens',
      placeQuery: 'Ancient Agora of Athens',
      type: 'activity',
      latitude: 37.97569,
      longitude: 23.72247,
      country: 'Greece',
      countryCode: 'GR',
      notes: 'A dependable central Athens swap that keeps the day walkable.',
    },
    {
      id: 'monastiraki-square-fallback',
      title: 'Monastiraki Square',
      placeQuery: 'Monastiraki Square, Athens',
      type: 'activity',
      latitude: 37.97608,
      longitude: 23.72557,
      country: 'Greece',
      countryCode: 'GR',
      notes: 'An easy central fallback with food, shops, and transit nearby.',
    },
    {
      id: 'national-garden-fallback',
      title: 'National Garden',
      placeQuery: 'National Garden, Athens',
      type: 'activity',
      latitude: 37.97393,
      longitude: 23.73624,
      country: 'Greece',
      countryCode: 'GR',
      notes: 'A calmer swap when the group needs a softer pace.',
    },
  ]
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string; itemId: string }> }) {
  const { id: tripId, itemId } = await ctx.params
  const { supabase: accessSupabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: trip, error: tripErr } = await accessSupabase
    .from('trips')
    .select('id,user_id')
    .eq('id', tripId)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (trip.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = await createServiceClient()

  const json = await req.json().catch(() => null)
  const parsed = SwapBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: item, error: itemErr } = await supabase
    .from('trip_items')
    .select('id,title,start_time,end_time,duration_minutes,trip_day_id,trip_day:trip_days!inner(id,trip_id)')
    .eq('id', itemId)
    .eq('trip_day.trip_id', tripId)
    .maybeSingle()

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const options = getOptionsForTitle(item.title)
  if (!parsed.data.choiceId) {
    return NextResponse.json({ options })
  }

  const choice = options.find((option) => option.id === parsed.data.choiceId)
  if (!choice) return NextResponse.json({ error: 'Swap choice not found' }, { status: 404 })

  const { data: place, error: placeErr } = await supabase
    .from('places')
    .upsert(
      {
        name: choice.title,
        country: choice.country,
        country_code: choice.countryCode,
        latitude: choice.latitude,
        longitude: choice.longitude,
        mapbox_id: `manual:swap:${choice.id}`,
      },
      { onConflict: 'mapbox_id' }
    )
    .select('id')
    .single()

  if (placeErr) return NextResponse.json({ error: placeErr.message }, { status: 500 })

  const { error: updateErr } = await supabase
    .from('trip_items')
    .update({
      title: choice.title,
      type: choice.type,
      place_id: place.id,
      notes: choice.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, item: { ...choice, itemId } })
}
