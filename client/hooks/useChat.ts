'use client'

import { useChat as useAIChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useCallback, useEffect, useRef } from 'react'

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type PlaceEvent = {
  type: 'place_added'
  place: {
    name: string
    country: string
    latitude: number
    longitude: number
    status: 'visited' | 'bucket_list'
    description?: string
    highlights?: string[]
    best_time?: string
  }
}

export type NavigateEvent = {
  latitude: number
  longitude: number
  name?: string
  country?: string
  description?: string
  highlights?: string[]
  best_time?: string
}

export function useChat(options: {
  type: 'onboarding' | 'explore' | 'plan'
  conversationId?: string
  tripId?: string
  onPlaceAdded?: (event: PlaceEvent) => void
  onTripPatch?: (tripId: string) => void
  onNavigate?: (event: NavigateEvent) => void
}) {
  const optionsRef = useRef(options)
  const seenToolCallsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const {
    messages: aiMessages,
    status,
    sendMessage: aiSendMessage,
    stop,
    setMessages: setAIMessages,
  } = useAIChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        type: options.type,
        conversationId: options.conversationId,
        tripId: options.tripId,
      },
    }),
  })

  // Watch for tool call results in messages and fire events
  useEffect(() => {
    for (const msg of aiMessages) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        if (
          part.type.startsWith('tool-') &&
          'state' in part &&
          (part as { state: string }).state === 'output-available' &&
          'toolCallId' in part
        ) {
          const toolCallId = (part as { toolCallId: string }).toolCallId
          if (seenToolCallsRef.current.has(toolCallId)) continue
          seenToolCallsRef.current.add(toolCallId)

          const output = (part as { output?: unknown }).output
          if (typeof output === 'string') {
            try {
              const parsed = JSON.parse(output)
              if (parsed?.kind === 'trip_patch' && parsed.tripId && optionsRef.current.onTripPatch) {
                optionsRef.current.onTripPatch(parsed.tripId)
              }

              if (parsed?.kind === 'navigate' && optionsRef.current.onNavigate) {
                optionsRef.current.onNavigate({
                  latitude: parsed.latitude || 0,
                  longitude: parsed.longitude || 0,
                  name: parsed.name,
                  country: parsed.country,
                  description: parsed.description,
                  highlights: parsed.highlights,
                  best_time: parsed.best_time,
                })
              }

              // Back-compat: place add / navigate events used by onboarding/explore.
              if (parsed.success && parsed.name && optionsRef.current.onPlaceAdded) {
                if (parsed.action === 'navigate') {
                  optionsRef.current.onPlaceAdded({
                    type: 'place_added',
                    place: {
                      name: parsed.name,
                      country: parsed.country || '',
                      latitude: parsed.latitude || 0,
                      longitude: parsed.longitude || 0,
                      status: 'visited',
                      description: parsed.description,
                      highlights: parsed.highlights,
                      best_time: parsed.best_time,
                    },
                  })
                } else {
                  optionsRef.current.onPlaceAdded({
                    type: 'place_added',
                    place: {
                      name: parsed.name,
                      country: parsed.country || '',
                      latitude: parsed.latitude || 0,
                      longitude: parsed.longitude || 0,
                      status: parsed.status === 'bucket_list' ? 'bucket_list' : 'visited',
                    },
                  })
                }
              }
            } catch {
              // Not JSON, ignore
            }
          }
        }
      }
    }
  }, [aiMessages])

  const isLoading = status === 'streaming' || status === 'submitted'

  // Convert AI SDK UIMessages to our simple Message format
  const messages: Message[] = aiMessages.map((m: UIMessage) => {
    const textContent = m.parts
      ?.filter((p: { type: string }) => p.type === 'text')
      .map((p: { type: string; text?: string }) => (p as { type: 'text'; text: string }).text)
      .join('') || ''

    return {
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: textContent,
    }
  }).filter((m: Message) => m.content.length > 0 || m.role === 'user')

  const sendMessage = useCallback(async (content: string) => {
    aiSendMessage({ text: content })
  }, [aiSendMessage])

  const setMessages = useCallback((msgs: Message[]) => {
    setAIMessages(msgs.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    })))
  }, [setAIMessages])

  return { messages, isLoading, sendMessage, stop, setMessages }
}
