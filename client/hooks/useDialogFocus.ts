'use client'

import { type RefObject, useEffect } from 'react'

type UseDialogFocusOptions<T extends HTMLElement> = {
  isOpen: boolean
  onClose: () => void
  dialogRef: RefObject<T | null>
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useDialogFocus<T extends HTMLElement>({
  isOpen,
  onClose,
  dialogRef,
}: UseDialogFocusOptions<T>) {
  useEffect(() => {
    if (!isOpen) return

    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || []
      ).filter((element) => !element.hasAttribute('aria-hidden'))

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      } else if (!dialogRef.current?.contains(activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialogRef, isOpen, onClose])
}
