'use client'

import { useRef, useEffect, useState, type KeyboardEvent } from 'react'
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
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 border-t border-white/10 bg-black/80 px-4 pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-6"
        style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
      >
        {suggestions.length > 0 && (
          <div className="max-w-3xl mx-auto mb-2 flex gap-2 overflow-x-auto pb-1">
            {suggestions.slice(0, 6).map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSendMessage(s)}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/70 hover:bg-white/10 transition-all"
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}
        <div className="mx-auto flex min-h-14 max-w-3xl items-end gap-2 rounded-[1.4rem] border border-white/15 bg-white/[0.07] px-3 py-2 shadow-lg shadow-black/30 transition-all focus-within:border-amber-400/40 focus-within:ring-1 focus-within:ring-amber-400/20 sm:px-4">
          <div className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-amber-300/70">
            <Sparkles className="h-4 w-4" />
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-5 text-white placeholder:text-white/35 focus:outline-none sm:text-sm"
            style={{ maxHeight: '120px' }}
          />

          {isLoading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30"
            >
              <Square className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-black transition-colors hover:bg-amber-400 disabled:cursor-default disabled:bg-white/10 disabled:text-white/30 disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
