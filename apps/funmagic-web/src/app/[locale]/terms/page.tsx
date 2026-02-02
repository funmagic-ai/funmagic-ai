import { getTranslations, setRequestLocale } from 'next-intl/server'

const LAST_UPDATED = '2025-01-01'

interface TermsPageProps {
  params: Promise<{ locale: string }>
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('terms')

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('title')}</h1>
      <p className="text-gray-500 mb-8">{t('lastUpdated')}: {LAST_UPDATED}</p>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.acceptance.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.acceptance.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.services.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.services.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.accounts.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.accounts.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.credits.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.credits.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.content.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.content.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.prohibited.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.prohibited.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.liability.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.liability.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.changes.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.changes.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('sections.contact.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('sections.contact.content')}</p>
        </section>
      </div>
    </div>
  )
}
