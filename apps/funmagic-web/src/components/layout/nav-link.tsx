'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()

  // Check if current path matches the link
  // Handle both /en/tools and /tools (as-needed locale prefix)
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  const normalizedHref = href.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'

  const isActive = normalizedPathname === normalizedHref

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
        isActive ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
