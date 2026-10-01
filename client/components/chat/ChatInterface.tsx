'use client'

import { useRef, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { AnimatePresence } from 'motion/react'
import { Send, Square } from 'lucide-react'
import type { Message } from '@/hooks/useChat'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  error?: string | null
  onSendMessage: (content: string) => void
  onStop: () => void
  placeholder?: string
  suggestions?: string[]
  storageKey?: string
  emptyState?: {
    eyebrow?: string
    title: string
    prompts: Array<{
      label: string
      detail?: string
      prompt: string
    }>
  }
}

export default function ChatInterface({
  messages,
  isLoading,
  error,
  onSendMessage,
  onStop,
  placeholder = 'Type your message...',
  suggestions = [],
  storageKey: _storageKey,
  emptyState,
}: ChatInterfaceProps) {
  void _storageKey
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const visibleSuggestions = useMemo(() => {
    const askedPrompts = new Set(
      messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content.trim().toLowerCase())
    )
    const seen = new Set<string>()

    return suggestions
      .map((suggestion) => suggestion.trim())
      .filter((suggestion) => {
        if (!suggestion) return false
        const key = suggestion.toLowerCase()
        if (seen.has(key) || askedPrompts.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 3)
  }, [messages, suggestions])
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.content || message.role === 'user'),
    [messages]
  )
  const visibleEmptyPrompts = useMemo(() => {
    const askedPrompts = new Set(
      messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content.trim().toLowerCase())
    )
    const seen = new Set<string>()

    return (emptyState?.prompts || [])
      .filter((prompt) => {
        const key = prompt.prompt.trim().toLowerCase()
        if (!key || askedPrompts.has(key) || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 3)
  }, [emptyState?.prompts, messages])
  const hasUserMessage = messages.some((message) => message.role === 'user')
  const showSuggestions = visibleSuggestions.length > 0 && !hasUserMessage && !isLoading && !emptyState

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSendMessage(trimmed)
    setInput('')
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  // Show typing indicator when loading and last message is assistant with empty content
  const showTyping =
    isLoading &&
    (messages.length === 0 || messages[messages.length - 1]?.content === '')
  const showEmptyState = Boolean(emptyState && visibleMessages.length === 0 && !showTyping && !isLoading && !error)

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        {showEmptyState && (
          <div className="rounded-md border border-border bg-muted/55 p-3">
            {emptyState?.eyebrow && (
              <p className="text-xs text-muted-foreground">{emptyState.eyebrow}</p>
            )}
            <p className="mt-1 text-sm font-semibold text-foreground">{emptyState?.title}</p>
            <div className="mt-3 grid gap-2">
              {visibleEmptyPrompts.map((prompt) => (
                <button
                  key={prompt.prompt}
                  type="button"
                  onClick={() => onSendMessage(prompt.prompt)}
                  className="touch-target rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span className="block text-xs font-semibold text-foreground">{prompt.label}</span>
                  {prompt.detail && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{prompt.detail}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {visibleMessages
            .map((message, index) => (
              <ChatMessage key={message.id} message={message} index={index} />
            ))}
        </AnimatePresence>

        {showTyping && <TypingIndicator />}

        {error && (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 border-t border-border bg-card/90 px-4 pt-3 backdrop-blur-md sm:px-6"
        style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
      >
        {showSuggestions && (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-2 pb-1">
            {visibleSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSendMessage(s)}
                className="touch-target rounded-sm border border-foreground/30 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto flex min-h-14 max-w-3xl items-end gap-2 rounded-md border border-foreground/40 bg-card px-3 py-2 transition-all focus-within:border-foreground focus-within:ring-[3px] focus-within:ring-ring/30 sm:px-4">
                    <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Trip planning message"
            placeholder={placeholder}
            rows={1}
            className="min-h-11 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-5 text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
            style={{ maxHeight: '120px' }}
          />

          {isLoading ? (
            <button
              onClick={onStop}
              className="touch-target flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
              aria-label="Stop"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="touch-target flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
