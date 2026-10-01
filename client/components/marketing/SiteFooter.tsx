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
    <footer className="bg-plate text-plate-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs space-y-3">
            <Link href="/" aria-label="Globe.travel home" className="inline-flex">
              <GlobeBrand className="text-plate-foreground" markClassName="text-plate-foreground [--mark-bg:var(--plate)]" />
            </Link>
            <p className="text-base text-plate-foreground/70">
              Plan the trip everyone says yes to. Mapped itineraries your group can react to.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <h2 className="text-sm font-medium tracking-normal">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[0.9375rem] text-plate-foreground transition-colors hover:text-[oklch(0.78_0.14_40)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator className="my-8 bg-plate-foreground/20" />
        <p className="text-sm text-plate-foreground/60">© {new Date().getFullYear()} Globe.travel. Built for friends who travel together.</p>
      </div>
    </footer>
  )
}
