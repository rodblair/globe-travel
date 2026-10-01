'use client'

import { motion } from 'motion/react'
import type { Message } from '@/hooks/useChat'

function renderInlineMarkdown(text: string) {
  const boldParts = text.split(/\*\*(.*?)\*\*/g)

  return boldParts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-semibold">
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
        <span
          aria-hidden
          className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <ellipse cx="12" cy="12" rx="3.5" ry="9" />
            <path d="M3 12h18" />
          </svg>
        </span>
      )}

      <div
        className={`max-w-[85%] text-[0.9375rem] leading-relaxed ${
          isUser ? 'rounded-md bg-foreground px-4 py-3 text-background' : 'py-1 text-foreground'
        }`}
      >
        {message.content ? renderContent(message.content) : (
          <span className="text-muted-foreground">{'…'}</span>
        )}
      </div>
    </motion.div>
  )
}
