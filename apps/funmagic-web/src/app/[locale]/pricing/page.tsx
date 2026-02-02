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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <Suspense fallback={<PricingGridSkeleton />}>
        <PricingGrid />
      </Suspense>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('faq.title')}</h2>
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">{t('faq.q1')}</h3>
            <p className="text-gray-600">{t('faq.a1')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">{t('faq.q2')}</h3>
            <p className="text-gray-600">{t('faq.a2')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">{t('faq.q3')}</h3>
            <p className="text-gray-600">{t('faq.a3')}</p>
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
        <p className="text-gray-500">{t('noPackages')}</p>
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
            className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
              pkg.isPopular
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                : 'border-gray-200'
            }`}
          >
            {pkg.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  {t('popular')}
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`inline-flex p-3 rounded-full mb-4 ${
                pkg.isPopular ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Icon className={`w-6 h-6 ${
                  pkg.isPopular ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              {pkg.description && (
                <p className="text-gray-500 text-sm mt-1">{pkg.description}</p>
              )}
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  ${pkg.price}
                </span>
                <span className="text-gray-500">/{pkg.currency}</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-semibold text-blue-600">
                  {totalCredits}
                </span>
                <span className="text-gray-600"> {t('credits')}</span>
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
                <span className="text-gray-600">{t('features.instant')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{t('features.allTools')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{t('features.noExpiry')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{t('features.priority')}</span>
              </li>
            </ul>

            <Link
              href="/register"
              className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                pkg.isPopular
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
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
        <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-8 animate-pulse">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-24 mx-auto" />
          </div>
          <div className="text-center mb-6">
            <div className="h-10 bg-gray-200 rounded w-20 mx-auto mb-2" />
            <div className="h-6 bg-gray-200 rounded w-32 mx-auto" />
          </div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-5 bg-gray-200 rounded w-full" />
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded-lg w-full" />
        </div>
      ))}
    </div>
  )
}
