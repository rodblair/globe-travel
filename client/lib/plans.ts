// Plan definitions — safe to import in both client and server code
// (No Stripe SDK dependency here)

export const PLANS = {
  free: {
    name: 'Explorer',
    price: 0,
    limits: {
      journalEntries: 3,
      trips: 2,
      aiMessagesPerDay: 10,
    },
    features: [
      '3 journal entries',
      '2 saved trips',
      '10 AI messages / day',
      'Basic maps & routes',
      'Bucket list (10 places)',
    ],
  },
  pro: {
    name: 'Adventurer',
    monthlyPrice: 4.99,
    yearlyPrice: 49,
    limits: {
      journalEntries: Infinity,
      trips: Infinity,
      aiMessagesPerDay: Infinity,
    },
    features: [
      'Unlimited journal entries',
      'Unlimited trips',
      'Unlimited AI messages',
      'Advanced maps & walking routes',
      'Unlimited bucket list',
      'Share trip itineraries',
      'Priority AI responses',
      'Export to PDF (coming soon)',
    ],
  },
} as const

export type Plan = keyof typeof PLANS
