import { Suspense } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header, Footer, HeaderSkeleton, FooterSkeleton } from '@/components/layout'
import { SessionFetcher } from '@/components/providers/session-fetcher'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Suspense fallback={
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <HeaderSkeleton />
          <main className="flex-1" />
          <FooterSkeleton />
        </div>
      }>
        <SessionFetcher>
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Suspense fallback={<HeaderSkeleton />}>
              <Header />
            </Suspense>

            <main id="main-content" className="flex-1">{children}</main>

            <Suspense fallback={<FooterSkeleton />}>
              <Footer locale={locale} />
            </Suspense>
          </div>
        </SessionFetcher>
      </Suspense>
    </NextIntlClientProvider>
  )
}
