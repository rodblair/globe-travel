import { google } from '@ai-sdk/google'
import {
  type UIMessage,
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'

const SYSTEM_PROMPTS: Record<string, string> = {
  onboarding:
    `You are a warm, enthusiastic travel companion helping someone set up their Globe Travel profile. Be concise and energetic — keep responses to 2-3 sentences max.

CRITICAL: When the user mentions ANY place they've been to, IMMEDIATELY call addVisitedPlace for EACH place. Do not wait or ask follow-up questions before calling the tool. Call the tool first, then respond.

Your flow:
1. When they mention places → call addVisitedPlace for each one right away
2. Ask what they loved about those places and where else they've been
3. After 3+ places, call setTravelPreferences based on what you've learned
4. Ask if they have any dream destinations (bucket list)
5. If they mention dream places → call addBucketListPlace

Keep it fast, fun, and interactive. Use emojis sparingly. Be genuinely excited.`,
  explore:
    `You are Globe Travel's AI travel companion. The user's visited places and bucket list are provided below. You KNOW where they've been — reference their trips when chatting.

Keep responses concise (2-4 sentences unless they ask for detail). Be warm and knowledgeable.

You can:
- Answer questions about their travel history (you have the data below)
- Suggest new destinations based on their taste
- Add places to their map using addVisitedPlace or addBucketListPlace tools
- Help plan trips with tips, itineraries, and local recommendations
- Navigate the map to show places using navigateToPlace tool

IMPORTANT: When discussing a specific city or place, ALWAYS call navigateToPlace to fly the map there. When they ask to add a place, use the appropriate tool immediately.`,
  plan:
    "You are a trip planning assistant. Help the user plan their trip to a specific destination with itinerary suggestions, must-see attractions, local food recommendations, budget estimates, and practical tips.",
}

const tools = {
  addVisitedPlace: tool({
    description: 'Add a place the user has visited to their travel map',
    inputSchema: z.object({
      name: z.string().describe('Name of the place or city'),
      country: z.string().describe('Country name'),
      country_code: z.string().describe('ISO 2-letter country code'),
      latitude: z.number().describe('Latitude coordinate'),
      longitude: z.number().describe('Longitude coordinate'),
      rating: z.number().min(1).max(5).optional().describe('User rating 1-5'),
    }),
    execute: async ({ name, country, country_code, latitude, longitude, rating }) => {
      // Will be overridden per-request with user context
      return { success: true, name, country, status: 'visited' as const }
    },
  }),
  addBucketListPlace: tool({
    description: 'Add a place to the user bucket list',
    inputSchema: z.object({
      name: z.string().describe('Name of the place or city'),
      country: z.string().describe('Country name'),
      country_code: z.string().describe('ISO 2-letter country code'),
      latitude: z.number().describe('Latitude coordinate'),
      longitude: z.number().describe('Longitude coordinate'),
      reason: z.string().optional().describe('Why the user wants to visit'),
    }),
    execute: async ({ name, country }) => {
      return { success: true, name, country, status: 'bucket_list' as const }
    },
  }),
  setTravelPreferences: tool({
    description: 'Set the user travel style and preferences',
    inputSchema: z.object({
      style: z.string().describe('Travel style: adventure, luxury, budget, family, backpacker, etc.'),
      interests: z.array(z.string()).describe('List of travel interests'),
      budget_preference: z.string().describe('Budget preference: budget, moderate, luxury'),
    }),
    execute: async ({ style, interests, budget_preference }) => {
      return { success: true, style, interests, budget_preference }
    },
  }),
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, type } = await req.json() as {
      messages: UIMessage[]
      type: 'onboarding' | 'explore' | 'plan'
    }

    // Fetch user's places for context in explore/plan modes
    let placesContext = ''
    if (type === 'explore' || type === 'plan') {
      const { data: userPlaces } = await supabase
        .from('user_places')
        .select('status, place:places(name, country)')
        .eq('user_id', user.id)

      if (userPlaces && userPlaces.length > 0) {
        const visited = userPlaces
          .filter((p: any) => p.status === 'visited')
          .map((p: any) => `${p.place?.name}, ${p.place?.country}`)
        const bucketList = userPlaces
          .filter((p: any) => p.status === 'bucket_list')
          .map((p: any) => `${p.place?.name}, ${p.place?.country}`)

        placesContext = `\n\nUSER'S TRAVEL DATA:\nVisited (${visited.length}): ${visited.join('; ')}\nBucket list (${bucketList.length}): ${bucketList.join('; ')}`
      }

      // Also fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('travel_style, display_name')
        .eq('id', user.id)
        .single()

      if (profile?.travel_style) {
        placesContext += `\nTravel style: ${profile.travel_style}`
      }
      if (profile?.display_name) {
        placesContext += `\nName: ${profile.display_name}`
      }
    }

    const systemPrompt = (SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.explore) + placesContext

    // Create tools with user context for DB operations
    const userTools = {
      addVisitedPlace: tool({
        description: 'Add a place the user has visited to their travel map',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          country_code: z.string().describe('ISO 2-letter country code'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          rating: z.number().min(1).max(5).optional().describe('User rating 1-5'),
        }),
        execute: async ({ name, country, country_code, latitude, longitude, rating }) => {
          let placeId: string
          const { data: existing } = await supabase.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await supabase.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await supabase.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'visited', rating: rating || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'visited' })
        },
      }),
      addBucketListPlace: tool({
        description: 'Add a place to the user bucket list',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          country_code: z.string().describe('ISO 2-letter country code'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          reason: z.string().optional().describe('Why the user wants to visit'),
        }),
        execute: async ({ name, country, country_code, latitude, longitude, reason }) => {
          let placeId: string
          const { data: existing } = await supabase.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await supabase.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await supabase.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'bucket_list', notes: reason || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'bucket_list' })
        },
      }),
      navigateToPlace: tool({
        description: 'Navigate/fly the map to show a specific place. Use this when the user asks to see, show, or go to a place, or when you are describing a specific location.',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          description: z.string().describe('A 2-3 sentence vivid description of this place - what makes it special, what a traveler should know'),
          highlights: z.array(z.string()).describe('3-4 top highlights or things to do, each 3-6 words'),
          best_time: z.string().optional().describe('Best time to visit, e.g. "March to May"'),
        }),
        execute: async ({ name, country, latitude, longitude, description, highlights, best_time }) => {
          return JSON.stringify({ success: true, action: 'navigate', name, country, latitude, longitude, description, highlights, best_time })
        },
      }),
      setTravelPreferences: tool({
        description: 'Set the user travel style and preferences',
        inputSchema: z.object({
          style: z.string().describe('Travel style: adventure, luxury, budget, family, backpacker, etc.'),
          interests: z.array(z.string()).describe('List of travel interests'),
          budget_preference: z.string().describe('Budget preference: budget, moderate, luxury'),
        }),
        execute: async ({ style, interests, budget_preference }) => {
          await supabase.from('profiles').update({ travel_style: `${style} | ${interests.join(', ')} | ${budget_preference}` }).eq('id', user.id)
          return `Successfully set travel preferences: ${style}`
        },
      }),
    }

    const result = streamText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools: userTools,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
