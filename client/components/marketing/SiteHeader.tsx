'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export const SITE_NAV = [
  { href: '/#how', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
] as const

export const GUEST_HREF = '/api/guest/start?next=/chat'

export function SiteHeader({ className }: { className?: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-transparent transition-colors',
        scrolled && 'border-border bg-background/80 backdrop-blur-lg',
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" aria-label="Globe.travel home" className="flex items-center rounded-lg">
          <GlobeBrand />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {SITE_NAV.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden md:inline-flex" />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden rounded-full px-4 sm:inline-flex">
            <Link href="/signup">Start free</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,22rem)]">
              <SheetHeader className="text-left">
                <SheetTitle>
                  <GlobeBrand />
                </SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {SITE_NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center rounded-lg px-3 text-base font-medium hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href={GUEST_HREF}>Try as guest</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full">
                  <Link href="/login">Sign in</Link>
                </Button>
                <div className="flex justify-center pt-1">
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
