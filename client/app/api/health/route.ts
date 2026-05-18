import { NextResponse } from 'next/server'

type HealthSeverity = 'critical' | 'warning'
type HealthStatus = 'ok' | 'missing'

type HealthCheck = {
  name: string
  label: string
  status: HealthStatus
  severity: HealthSeverity
}

const PLACEHOLDER_VALUES = new Set([
  '',
  'sk_test_placeholder',
  'price_placeholder_monthly',
  'price_placeholder_yearly',
])

function isConfigured(value: string | undefined) {
  return Boolean(value && !PLACEHOLDER_VALUES.has(value.trim()))
}

function checkEnv(
  name: string,
  label: string,
  envName: string,
  severity: HealthSeverity = 'critical',
): HealthCheck {
  return {
    name,
    label,
    status: isConfigured(process.env[envName]) ? 'ok' : 'missing',
    severity,
  }
}

export function GET() {
  const checks: HealthCheck[] = [
    checkEnv('supabase_url', 'Supabase URL', 'NEXT_PUBLIC_SUPABASE_URL'),
    checkEnv('supabase_anon_key', 'Supabase anon key', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    checkEnv('supabase_service_role', 'Supabase service role key', 'SUPABASE_SERVICE_ROLE_KEY'),
    checkEnv('mapbox_token', 'Mapbox token', 'NEXT_PUBLIC_MAPBOX_TOKEN'),
    checkEnv('openai_api_key', 'OpenAI API key', 'OPENAI_API_KEY'),
    checkEnv('stripe_secret_key', 'Stripe secret key', 'STRIPE_SECRET_KEY'),
    checkEnv('stripe_publishable_key', 'Stripe publishable key', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    checkEnv('stripe_webhook_secret', 'Stripe webhook secret', 'STRIPE_WEBHOOK_SECRET'),
    checkEnv('stripe_monthly_price', 'Stripe monthly price ID', 'STRIPE_PRO_MONTHLY_PRICE_ID'),
    checkEnv('stripe_yearly_price', 'Stripe yearly price ID', 'STRIPE_PRO_YEARLY_PRICE_ID'),
    checkEnv('site_url', 'Public site URL', 'NEXT_PUBLIC_SITE_URL', 'warning'),
  ]

  const criticalMissing = checks.filter(
    (check) => check.severity === 'critical' && check.status !== 'ok',
  )
  const warningMissing = checks.filter(
    (check) => check.severity === 'warning' && check.status !== 'ok',
  )
  const status = criticalMissing.length === 0 ? 'ok' : 'degraded'

  return NextResponse.json(
    {
      service: 'globe-travel',
      status,
      checkedAt: new Date().toISOString(),
      deployment: {
        environment: process.env.VERCEL_ENV ?? 'local',
        region: process.env.VERCEL_REGION ?? null,
        url: process.env.VERCEL_URL ?? null,
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      },
      summary: {
        total: checks.length,
        ok: checks.filter((check) => check.status === 'ok').length,
        criticalMissing: criticalMissing.length,
        warningMissing: warningMissing.length,
      },
      checks,
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
