'use client'

import { useRef, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Sparkles, Square } from 'lucide-react'
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
  const hasUserMessage = messages.some((message) => message.role === 'user')
  const showSuggestions = visibleSuggestions.length > 0 && !hasUserMessage && !isLoading

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
        <AnimatePresence mode="popLayout">
          {messages
            .filter((m) => m.content || m.role === 'user')
            .map((message, index) => (
              <ChatMessage key={message.id} message={message} index={index} />
            ))}
        </AnimatePresence>

        {showTyping && <TypingIndicator />}

        {error && (
          <div className="rounded-md border border-[color:var(--pillar-desert-wash)] bg-[var(--pillar-desert-wash)] px-4 py-3 text-body-sm text-[var(--terracotta)]">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 border-t border-rule bg-paper-raised/90 px-4 pt-3 backdrop-blur-md sm:px-6"
        style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
      >
        {showSuggestions && (
          <div className="max-w-3xl mx-auto mb-2 flex gap-2 overflow-x-auto pb-1">
            {visibleSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSendMessage(s)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-rule bg-paper text-caption text-ink-2 hover:bg-paper-hover hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto flex min-h-14 max-w-3xl items-end gap-2 rounded-md border border-rule bg-[var(--paper-recessed)]/60 px-3 py-2 transition-all focus-within:border-[var(--brass)] focus-within:ring-2 focus-within:ring-[var(--brass-glow)] sm:px-4">
          <div className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[var(--brass-subtle)] text-[var(--brass)]">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-5 text-foreground placeholder:text-ink-4 focus:outline-none sm:text-sm"
            style={{ maxHeight: '120px' }}
          />

          {isLoading ? (
            <button
              onClick={onStop}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[var(--pillar-desert-wash)] text-[var(--terracotta)] transition-colors hover:bg-[var(--terracotta)]/15"
              aria-label="Stop"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[var(--brass)] text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] disabled:cursor-default disabled:bg-[var(--paper-recessed)] disabled:text-ink-4 disabled:opacity-60"
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
