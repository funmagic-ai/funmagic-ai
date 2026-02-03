'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from '@/i18n/navigation'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('error')

  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 bg-red-100 rounded-full mb-6">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-4">
          {t('title')}
        </h1>

        <p className="text-muted-foreground mb-8">
          {t('description')}
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6">
            {t('errorCode')}: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            {t('tryAgain')}
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-input text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('goHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
