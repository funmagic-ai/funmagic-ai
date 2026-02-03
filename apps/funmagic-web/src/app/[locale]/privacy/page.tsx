import { getTranslations, setRequestLocale } from 'next-intl/server'

const LAST_UPDATED = '2025-01-01'

interface PrivacyPageProps {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('privacy')

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-foreground mb-8">{t('title')}</h1>
      <p className="text-muted-foreground mb-8">{t('lastUpdated')}: {LAST_UPDATED}</p>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.intro.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.intro.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.collection.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.collection.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.usage.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.usage.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.storage.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.storage.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.sharing.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.sharing.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.cookies.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.cookies.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.rights.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.rights.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.security.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.security.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.changes.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.changes.content')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('sections.contact.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.contact.content')}</p>
        </section>
      </div>
    </div>
  )
}
