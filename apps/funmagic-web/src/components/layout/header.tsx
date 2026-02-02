'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Bell, Menu, Home, Wrench, CreditCard, User, LogOut, FolderOpen } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from './theme-toggle'
import { LocaleSwitcher } from './locale-switcher'
import { NavLink } from './nav-link'
import { Logo } from './logo'

export function Header() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const handleSignOut = async () => {
    await signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-border/40 bg-background/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4 lg:gap-8">
        {/* Mobile menu - only visible on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('menu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="bg-card">
            <DropdownMenuItem asChild>
              <Link href={`/${locale}`} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t('home')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/tools`} className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {t('tools')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/pricing`} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t('pricing')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Logo />
          <h2 className="text-xl font-bold tracking-tight">FunMagic</h2>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavLink href={`/${locale}`}>{t('home')}</NavLink>
          <NavLink href={`/${locale}/tools`}>{t('tools')}</NavLink>
          <NavLink href={`/${locale}/pricing`}>{t('pricing')}</NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Locale switcher */}
        <div className="hidden lg:block">
          <LocaleSwitcher />
        </div>

        {/* Notifications - only show when logged in */}
        {session && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center bg-red-500 px-1 text-xs text-white">
              3
            </Badge>
          </Button>
        )}

        {/* Auth buttons */}
        {isPending ? (
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        ) : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <span className="hidden sm:inline text-sm">
                  {session.user.name || session.user.email}
                </span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-48 bg-card">
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/profile`} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/assets`} className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {t('myAssets')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href={`/${locale}/login`}>{t('signIn')}</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
