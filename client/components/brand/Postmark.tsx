import { cn } from '@/lib/utils'

/** A rubber-stamp postmark: a quiet seal for finished and shared plans. */
export function Postmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={cn('text-[#fffbf3]', className)}>
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M14 26h36M12 32h40M14 38h36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
