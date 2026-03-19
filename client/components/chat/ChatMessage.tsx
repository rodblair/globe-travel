'use client'

import { motion } from 'motion/react'
import type { Message } from '@/hooks/useChat'

function renderContent(content: string) {
  // Simple markdown-like rendering
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    let processed: React.ReactNode = line

    // Bold
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      processed = parts.map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} className="font-semibold text-white">
            {part}
          </strong>
        ) : (
          part
        )
      )
    }

    // Italic
    if (typeof processed === 'string' && processed.includes('*')) {
      const parts = processed.split(/\*(.*?)\*/g)
      processed = parts.map((part, j) =>
        j % 2 === 1 ? (
          <em key={j} className="italic">
            {part}
          </em>
        ) : (
          part
        )
      )
    }

    // Bullet lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc">
          {typeof processed === 'string' ? processed.slice(2) : processed}
        </li>
      )
      return
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s(.*)/)
    if (numberedMatch) {
      elements.push(
        <li key={i} className="ml-4 list-decimal">
          {numberedMatch[2]}
        </li>
      )
      return
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<br key={i} />)
      return
    }

    elements.push(
      <span key={i}>
        {processed}
        {i < lines.length - 1 && lines[i + 1]?.trim() !== '' && <br />}
      </span>
    )
  })

  return elements
}

export default function ChatMessage({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-sm">
          <span role="img" aria-label="globe">
            {'\uD83C\uDF0D'}
          </span>
        </div>
      )}

      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-amber-500/20 backdrop-blur-sm border border-amber-500/20 text-amber-50'
            : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white/90'
        }`}
      >
        {message.content ? renderContent(message.content) : (
          <span className="text-white/40">...</span>
        )}
      </div>
    </motion.div>
  )
}
