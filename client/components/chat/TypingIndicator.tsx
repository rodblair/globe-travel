'use client'

import { motion } from 'motion/react'

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full border border-rule bg-[var(--brass-subtle)] flex items-center justify-center">
        <svg width="14" height="14" viewBox="-50 -50 100 100" aria-hidden>
          <circle cx="0" cy="0" r="42" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--brass)]" opacity="0.6" />
          <polygon points="0,-36 -3,0 0,2 3,0" fill="currentColor" className="text-[var(--brass)]" />
        </svg>
      </div>

      <div className="bg-paper-raised border border-rule rounded-md px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--brass)]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}
