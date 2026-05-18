import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase-server'

export const alt = 'Globe.travel shared itinerary preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

function compactTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim().slice(0, 92)
}

function titleDestination(title: string) {
  const normalized = title.replace(/^QA\s+/i, '').replace(/\s+[a-f0-9]{8}$/i, '').trim()
  const match = normalized.match(/\bin\s+(.+)$/i)
  if (match?.[1]) return match[1].replace(/\s+in\s+mid\s+september/i, '').trim()
  return normalized
}

export async function GET(_request: Request, ctx: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await ctx.params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('id,title')
    .eq('share_slug', shareSlug)
    .eq('is_public', true)
    .maybeSingle()

  if (!trip) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#f6f1e6',
            color: '#0c1f33',
            padding: 72,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 5, textTransform: 'uppercase', color: '#7c5824' }}>
            Globe.travel
          </div>
          <div style={{ marginTop: 32, maxWidth: 780, fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
            This itinerary link is unavailable.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: '#2a3d51' }}>
            Start a new group trip map instead.
          </div>
        </div>
      ),
      size
    )
  }

  const { count: dayCount } = await supabase
    .from('trip_days')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id)

  const title = compactTitle(trip.title)
  const destination = titleDestination(trip.title)
  const days = dayCount || 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#f6f1e6',
          color: '#0c1f33',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 16%, rgba(124,88,36,0.16), transparent 28%), radial-gradient(circle at 84% 18%, rgba(90,154,168,0.18), transparent 28%), linear-gradient(135deg, #fdfaf2 0%, #f6f1e6 52%, #ede6d4 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 72,
            right: 72,
            top: 58,
            bottom: 58,
            border: '2px solid rgba(12,31,51,0.12)',
            borderRadius: 34,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 86,
            top: 86,
            width: 300,
            height: 300,
            borderRadius: 999,
            border: '2px solid rgba(124,88,36,0.32)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 157,
            top: 157,
            width: 158,
            height: 158,
            borderRadius: 999,
            border: '1px solid rgba(12,31,51,0.16)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 212,
            top: 92,
            width: 4,
            height: 288,
            background: '#7c5824',
            transform: 'rotate(42deg)',
            borderRadius: 999,
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '82px 92px 72px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 25, letterSpacing: 6, textTransform: 'uppercase', color: '#7c5824' }}>
                Globe.travel
              </div>
              <div style={{ fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', color: '#596879' }}>
                Shared group trip map
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                border: '1px solid rgba(12,31,51,0.16)',
                borderRadius: 999,
                padding: '12px 20px',
                fontSize: 22,
                color: '#2a3d51',
                background: 'rgba(253,250,242,0.72)',
              }}
            >
              {days} day{days === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ fontSize: 78, fontWeight: 760, lineHeight: 0.98, letterSpacing: -1.4 }}>
              {title}
            </div>
            <div style={{ maxWidth: 690, fontSize: 31, lineHeight: 1.26, color: '#2a3d51' }}>
              Review the route, react to the day plan, and help the group choose the trip everyone can say yes to.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    background: index === 1 ? '#7c5824' : 'rgba(124,88,36,0.32)',
                  }}
                />
              ))}
              <div style={{ marginLeft: 10, fontSize: 23, color: '#596879' }}>
                {destination}
              </div>
            </div>
            <div style={{ fontSize: 24, color: '#7c5824' }}>
              Start your own trip at Globe.travel
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
