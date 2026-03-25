'use client'

import { useChat as useAIChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useCallback, useEffect, useMemo, useRef } from 'react'

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

function isClarifyingQuestion(text: string) {
  const normalized = text.trim()
  if (!normalized) return false

  return (
    normalized.includes('?') ||
    /\b(tell me|what city|which city|how many days|what dates|do you have|could you|would you|please share|let me know|what's the|what is the)\b/i.test(normalized)
  )
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
  const hadPlanActivityRef = useRef(false)
  const restoredMessagesRef = useRef(false)

  const storageKey = useMemo(() => {
    if (options.type === 'plan' && options.tripId) {
      return `globe-travel:chat:plan:${options.tripId}`
    }

    if (options.conversationId) {
      return `globe-travel:chat:${options.type}:${options.conversationId}`
    }

    return `globe-travel:chat:${options.type}`
  }, [options.conversationId, options.tripId, options.type])

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

  const parseToolOutput = useCallback((output: unknown) => {
    if (typeof output === 'string') {
      try {
        return JSON.parse(output)
      } catch {
        return null
      }
    }

    if (output && typeof output === 'object') {
      return output
    }

    return null
  }, [])

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
          const parsed = parseToolOutput(output)
          if (!parsed) continue

          if (optionsRef.current.type === 'plan') {
            hadPlanActivityRef.current = true
          }

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
        }
      }
    }
  }, [aiMessages, parseToolOutput])

  useEffect(() => {
    if (
      status === 'ready' &&
      optionsRef.current.type === 'plan' &&
      optionsRef.current.tripId &&
      optionsRef.current.onTripPatch &&
      hadPlanActivityRef.current
    ) {
      hadPlanActivityRef.current = false
      optionsRef.current.onTripPatch(optionsRef.current.tripId)
    }
  }, [status])

  const isLoading = status === 'streaming' || status === 'submitted'

  // Convert AI SDK UIMessages to our simple Message format
  const messages: Message[] = aiMessages.map((m: UIMessage) => {
    const textContent = m.parts
      ?.filter((p: { type: string }) => p.type === 'text')
      .map((p: { type: string; text?: string }) => (p as { type: 'text'; text: string }).text)
      .join('') || ''

    const hasSuccessfulTripPatch =
      options.type === 'plan' &&
      m.role === 'assistant' &&
      m.parts?.some((part) => {
        if (!part.type.startsWith('tool-') || !('state' in part) || (part as { state: string }).state !== 'output-available') {
          return false
        }

        const output = (part as { output?: unknown }).output
        const parsed = parseToolOutput(output)
        return parsed?.kind === 'trip_patch'
      }) === true

    const shouldCollapseAssistantCopy =
      hasSuccessfulTripPatch &&
      m.role === 'assistant' &&
      !isClarifyingQuestion(textContent)

    return {
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: shouldCollapseAssistantCopy ? '' : textContent,
    }
  }).filter((m: Message) => m.content.length > 0 || m.role === 'user')

  useEffect(() => {
    restoredMessagesRef.current = false
  }, [storageKey])

  useEffect(() => {
    if (restoredMessagesRef.current || typeof window === 'undefined') return

    const raw = window.localStorage.getItem(storageKey)
    restoredMessagesRef.current = true
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as Message[]
      if (!Array.isArray(parsed) || parsed.length === 0) return

      setAIMessages(
        parsed.map((message) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: message.content }],
        }))
      )
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }, [setAIMessages, storageKey])

  useEffect(() => {
    if (typeof window === 'undefined' || !restoredMessagesRef.current) return

    if (messages.length === 0) {
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  const sendMessage = useCallback(async (content: string) => {
    if (optionsRef.current.type === 'plan') {
      hadPlanActivityRef.current = true
    }
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
