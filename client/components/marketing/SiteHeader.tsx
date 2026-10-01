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
        'sticky top-0 z-40 w-full border-b border-foreground bg-background/95 backdrop-blur-sm transition-shadow',
        scrolled && 'shadow-[0_1px_0_0_var(--foreground)]',
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" aria-label="Globe.travel home" className="flex items-center rounded-lg">
          <GlobeBrand />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {SITE_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-[0.9375rem] font-medium text-foreground/75 transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden md:inline-flex" />
          <Link href="/login" className="hidden px-3 text-[0.9375rem] font-medium hover:text-primary md:inline-block">
            Sign in
          </Link>
          <Button asChild size="sm" className="hidden sm:inline-flex">
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
                <Button asChild size="lg" >
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" >
                  <Link href={GUEST_HREF}>Try as guest</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" >
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
