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
  { href: '/#trips', label: 'Destinations' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
] as const

export const GUEST_HREF = '/api/guest/start?next=/chat'

/**
 * `dusk` floats transparently over the hero sky (bone text); `light` is a
 * sticky bar on paper for inner pages.
 */
export function SiteHeader({
  variant = 'light',
  className,
}: {
  variant?: 'light' | 'dusk'
  className?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const dusk = variant === 'dusk'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-40 w-full transition-shadow',
        dusk
          ? 'absolute inset-x-0 top-0 text-[#fff8ec]'
          : 'sticky top-0 border-b bg-background/90 backdrop-blur-md',
        !dusk && scrolled && 'shadow-sm',
        className,
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-10">
        <Link href="/" aria-label="Globe.travel home" className="flex items-center rounded-lg">
          <GlobeBrand
            className={dusk ? 'text-[#fff8ec]' : undefined}
            markClassName={dusk ? 'text-[#fff8ec] [--mark-bg:#7a3c62]' : undefined}
          />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
          {SITE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-base font-medium transition-colors',
                dusk ? 'text-[#fff8ec]/90 hover:text-white' : 'text-foreground/75 hover:text-primary',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!dusk ? <ThemeToggle className="hidden md:inline-flex" /> : null}
          <Link
            href="/login"
            className={cn('hidden px-3 text-base font-semibold md:inline-block', dusk ? 'hover:text-white' : 'hover:text-primary')}
          >
            Sign in
          </Link>
          <Button asChild size="default" variant={dusk ? 'bone' : 'default'} className="hidden sm:inline-flex">
            <Link href="/signup">Start planning</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('md:hidden', dusk && 'border border-[#fff8ec]/50 text-[#fff8ec] hover:bg-white/10 hover:text-white')}
                aria-label="Open menu"
              >
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
                    <Link href={item.href} className="flex min-h-12 items-center rounded-xl px-3 font-serif text-2xl hover:bg-accent">
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Button asChild size="lg">
                  <Link href="/signup">Start planning free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={GUEST_HREF}>Try as guest</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
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
