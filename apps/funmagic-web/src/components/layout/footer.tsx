import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { connection } from 'next/server'
import { Logo } from './logo'
import { CopyrightYear } from './copyright-year'

interface FooterProps {
  locale: string
}

export async function Footer({ locale }: FooterProps) {
  await connection()

  const t = await getTranslations({ locale, namespace: 'common' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })

  return (
    <footer className="mt-auto border-t border-border bg-card py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 md:flex-row sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-bold">FunMagic</span>
        </div>

        {/* Links */}
        <nav className="flex gap-8 text-sm text-muted-foreground">
          <Link
            href={`/${locale}/privacy`}
            className="transition-colors hover:text-foreground"
          >
            {tFooter('privacy')}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="transition-colors hover:text-foreground"
          >
            {tFooter('terms')}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="transition-colors hover:text-foreground"
          >
            {tFooter('about')}
          </Link>
          <Link
            href={`/${locale}/help`}
            className="transition-colors hover:text-foreground"
          >
            {tFooter('contact')}
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground">
          &copy; <CopyrightYear /> FunMagic. {t('copyright')}
        </p>
      </div>
    </footer>
  )
}
