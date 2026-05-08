'use client'

import { motion } from 'motion/react'
import type { Message } from '@/hooks/useChat'

function renderInlineMarkdown(text: string) {
  const boldParts = text.split(/\*\*(.*?)\*\*/g)

  return boldParts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part}
        </strong>
      )
    }

    if (!part.includes('*')) return part

    return part.split(/\*(.*?)\*/g).map((italicPart, italicIndex) =>
      italicIndex % 2 === 1 ? (
        <em key={`${index}-${italicIndex}`} className="italic">
          {italicPart}
        </em>
      ) : (
        italicPart
      )
    )
  })
}

function renderContent(content: string) {
  // Simple markdown-like rendering
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    const processed = renderInlineMarkdown(line)

    // Bullet lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc">
          {renderInlineMarkdown(line.slice(2))}
        </li>
      )
      return
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)[.)]\s(.*)/)
    if (numberedMatch) {
      elements.push(
        <li key={i} className="ml-4 list-decimal">
          {renderInlineMarkdown(numberedMatch[2])}
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
        <div className="flex-shrink-0 w-8 h-8 rounded-full border border-rule bg-[var(--brass-subtle)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="-50 -50 100 100" aria-hidden>
            <circle cx="0" cy="0" r="42" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--brass)]" opacity="0.6" />
            <polygon points="0,-36 -3,0 0,2 3,0" fill="currentColor" className="text-[var(--brass)]" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[80%] px-4 py-3 rounded-md text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--brass-subtle)] border border-rule text-foreground'
            : 'bg-paper-raised border border-rule text-foreground'
        }`}
      >
        {message.content ? renderContent(message.content) : (
          <span className="text-ink-3">\u2026</span>
        )}
      </div>
    </motion.div>
  )
}
