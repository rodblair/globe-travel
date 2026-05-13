type CreateTripInput = {
  title: string;
  days: number;
  travelers: number;
  vibe: string;
};

type CreateTripResult = {
  tripId: string;
};

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const apiBaseUrl = configuredApiUrl || 'http://localhost:3000';

export async function createTripDraft(input: CreateTripInput): Promise<CreateTripResult> {
  const response = await fetch(`${apiBaseUrl}/api/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      travelers_count: input.travelers,
      pace: 'balanced',
      budget_level: 'mid',
      constraints: {
        days: input.days,
        group_vibe: input.vibe,
        source: 'expo-mobile',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Trip draft failed with ${response.status}`);
  }

  return response.json() as Promise<CreateTripResult>;
}
