'use client'

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { Compass, Sparkles } from 'lucide-react'
import { useChat, type PlaceEvent } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  const handlePlaceAdded = useCallback((event: PlaceEvent) => {
    // Could trigger a toast or visual feedback
    console.log('Place added:', event.place.name)
  }, [])

  const { messages, isLoading, sendMessage, stop } = useChat({
    type: 'explore',
    onPlaceAdded: handlePlaceAdded,
  })

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03)_0%,transparent_50%)]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/5">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center"
              >
                <Compass className="w-5 h-5 text-amber-400" />
              </motion.div>
              <div>
                <h1 className="font-serif text-xl text-white">AI Travel Advisor</h1>
                <p className="text-xs text-white/40">Discover your next adventure</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400/40" />
              <span className="text-xs text-white/30">Powered by Gemini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome state when no messages */}
      {messages.length === 0 && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <Compass className="w-8 h-8 text-amber-400/60" />
            </motion.div>
            <h2 className="font-serif text-2xl text-white mb-3">
              Where to next?
            </h2>
            <p className="text-sm text-white/40 mb-8 leading-relaxed">
              Ask me for destination recommendations, trip planning help, local tips,
              or anything travel-related. I know your preferences and can suggest
              perfect spots for you.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Suggest a weekend getaway',
                'Best hidden gems in Europe',
                'Plan a 2-week Asia trip',
                'Beach destinations in winter',
              ].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(suggestion)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/70 hover:bg-white/10 transition-all"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Chat interface */}
      {messages.length > 0 && (
        <div className="relative z-10 flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onStop={stop}
            placeholder="Ask about destinations, trips, or travel tips..."
          />
        </div>
      )}

      {/* Input when no messages (overlaid at bottom) */}
      {messages.length === 0 && (
        <div className="relative z-10 flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Ask about destinations, trips, or travel tips..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value.trim())
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
