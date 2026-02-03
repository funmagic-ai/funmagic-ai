import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default async function NotFoundPage() {
  const t = await getTranslations('notFound')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 bg-muted rounded-full mb-6">
          <FileQuestion className="w-12 h-12 text-muted-foreground" />
        </div>

        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-foreground mb-4">
          {t('title')}
        </h2>

        <p className="text-muted-foreground mb-8">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('goHome')}
          </Link>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 border border-input text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('browseTools')}
          </Link>
        </div>
      </div>
    </div>
  )
}
