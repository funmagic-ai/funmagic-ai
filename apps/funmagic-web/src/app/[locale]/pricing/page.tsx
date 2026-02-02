import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getCreditPackages } from '@/lib/queries/credits'
import { Check, Sparkles, Zap, Crown } from 'lucide-react'

interface PricingPageProps {
  params: Promise<{ locale: string }>
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('pricing')

  return (
    <div className="max-w-7xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <Suspense fallback={<PricingGridSkeleton />}>
        <PricingGrid />
      </Suspense>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('faq.title')}</h2>
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-2">{t('faq.q1')}</h3>
            <p className="text-muted-foreground">{t('faq.a1')}</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-2">{t('faq.q2')}</h3>
            <p className="text-muted-foreground">{t('faq.a2')}</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-semibold text-foreground mb-2">{t('faq.q3')}</h3>
            <p className="text-muted-foreground">{t('faq.a3')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

async function PricingGrid() {
  await connection()
  const t = await getTranslations('pricing')
  const packages = await getCreditPackages()

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noPackages')}</p>
      </div>
    )
  }

  const icons = [Zap, Sparkles, Crown]

  type CreditPackage = Awaited<ReturnType<typeof getCreditPackages>>[number]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {packages.map((pkg: CreditPackage, index: number) => {
        const Icon = icons[index % icons.length]
        const totalCredits = pkg.credits + pkg.bonusCredits

        return (
          <div
            key={pkg.id}
            className={`relative bg-card rounded-2xl shadow-sm border-2 p-8 ${
              pkg.isPopular
                ? 'border-primary ring-2 ring-primary ring-opacity-50'
                : 'border-border'
            }`}
          >
            {pkg.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                  {t('popular')}
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`inline-flex p-3 rounded-full mb-4 ${
                pkg.isPopular ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <Icon className={`w-6 h-6 ${
                  pkg.isPopular ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
              {pkg.description && (
                <p className="text-muted-foreground text-sm mt-1">{pkg.description}</p>
              )}
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-foreground">
                  ${pkg.price}
                </span>
                <span className="text-muted-foreground">/{pkg.currency}</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold text-primary">
                  {totalCredits}
                </span>
                <span className="text-muted-foreground"> {t('credits')}</span>
              </div>
              {pkg.bonusCredits > 0 && (
                <div className="mt-1">
                  <span className="text-sm text-green-600 font-medium">
                    +{pkg.bonusCredits} {t('bonusCredits')}
                  </span>
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{t('features.instant')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{t('features.allTools')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{t('features.noExpiry')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{t('features.priority')}</span>
              </li>
            </ul>

            <Link
              href="/register"
              className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                pkg.isPopular
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-foreground hover:bg-accent'
              }`}
            >
              {t('buyNow')}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function PricingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl border-2 border-border p-8 animate-pulse">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4" />
            <div className="h-6 bg-muted rounded w-24 mx-auto" />
          </div>
          <div className="text-center mb-6">
            <div className="h-10 bg-muted rounded w-20 mx-auto mb-2" />
            <div className="h-6 bg-muted rounded w-32 mx-auto" />
          </div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-5 bg-muted rounded w-full" />
            ))}
          </div>
          <div className="h-12 bg-muted rounded-lg w-full" />
        </div>
      ))}
    </div>
  )
}
