'use client'

import { useRef, useEffect, useState, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Send, Square } from 'lucide-react'
import type { Message } from '@/hooks/useChat'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string) => void
  onStop: () => void
  placeholder?: string
  suggestions?: string[]
  storageKey?: string
}

export default function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  placeholder = 'Type your message...',
  suggestions = [],
  storageKey,
}: ChatInterfaceProps) {
  const [input, setInput] = useState(() => {
    if (!storageKey || typeof window === 'undefined') return ''
    return window.localStorage.getItem(`${storageKey}:draft`) || ''
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    const saved = window.localStorage.getItem(`${storageKey}:draft`)
    queueMicrotask(() => setInput(saved || ''))
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    const key = `${storageKey}:draft`
    if (input.trim()) {
      window.localStorage.setItem(key, input)
    } else {
      window.localStorage.removeItem(key)
    }
  }, [input, storageKey])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSendMessage(trimmed)
    setInput('')
    if (storageKey && typeof window !== 'undefined') {
      window.localStorage.removeItem(`${storageKey}:draft`)
    }
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
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages
            .filter((m) => m.content || m.role === 'user')
            .map((message, index) => (
              <ChatMessage key={message.id} message={message} index={index} />
            ))}
        </AnimatePresence>

        {showTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3">
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
        <div className="flex items-center gap-2 max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 px-1 text-sm text-white placeholder:text-white/30 focus:outline-none"
            style={{ maxHeight: '120px' }}
          />

          {isLoading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Square className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-black hover:bg-amber-400 transition-colors disabled:opacity-20 disabled:cursor-default disabled:bg-white/10 disabled:text-white/30"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
