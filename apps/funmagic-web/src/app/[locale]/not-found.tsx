import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default async function NotFoundPage() {
  const t = await getTranslations('notFound')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 bg-gray-100 rounded-full mb-6">
          <FileQuestion className="w-12 h-12 text-gray-600" />
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {t('title')}
        </h2>

        <p className="text-gray-600 mb-8">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('goHome')}
          </Link>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('browseTools')}
          </Link>
        </div>
      </div>
    </div>
  )
}
