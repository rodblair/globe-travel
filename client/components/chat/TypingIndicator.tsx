'use client'

import { motion } from 'motion/react'

export default function TypingIndicator() {
  return (
    <div className="flex justify-start gap-3" role="status" aria-label="Planner is writing">
      <span aria-hidden className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="3.5" ry="9" />
          <path d="M3 12h18" />
        </svg>
      </span>
      <div className="flex items-center gap-1.5 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-foreground"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}
