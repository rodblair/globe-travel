import Link from 'next/link'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { Separator } from '@/components/ui/separator'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#how', label: 'How it works' },
      { href: '/#features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { href: '/signup', label: 'Create account' },
      { href: '/login', label: 'Sign in' },
      { href: '/api/guest/start?next=/chat', label: 'Try as guest' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs space-y-3">
            <Link href="/" aria-label="Globe.travel home" className="inline-flex">
              <GlobeBrand />
            </Link>
            <p className="text-sm text-muted-foreground">
              Plan the trip everyone says yes to. AI itineraries on a map, ready to share with your group.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <h2 className="text-sm font-semibold tracking-normal">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator className="my-8" />
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Globe.travel. Built for friends who travel together.</p>
      </div>
    </footer>
  )
}
