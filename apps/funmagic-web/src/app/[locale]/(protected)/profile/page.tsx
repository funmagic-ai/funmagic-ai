import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCreditBalance, getCreditTransactions } from '@/lib/queries/credits'
import { CreditBalance, CreditHistory, UserSettings } from '@/components/profile'

interface ProfilePageProps {
  params: Promise<{ locale: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('profile')

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('title')}</h1>

      <div className="space-y-8">
        <Suspense fallback={<CreditBalanceSkeleton />}>
          <CreditBalanceSection />
        </Suspense>

        <UserSettings />

        <Suspense fallback={<CreditHistorySkeleton />}>
          <CreditHistorySection />
        </Suspense>
      </div>
    </div>
  )
}

async function CreditBalanceSection() {
  await connection()
  const balance = await getCreditBalance()

  return (
    <CreditBalance
      balance={balance.balance}
      availableBalance={balance.availableBalance}
      reservedBalance={balance.reservedBalance}
      lifetimePurchased={balance.lifetimePurchased}
      lifetimeUsed={balance.lifetimeUsed}
    />
  )
}

async function CreditHistorySection() {
  await connection()
  const { transactions, pagination } = await getCreditTransactions({ limit: 10 })

  return <CreditHistory transactions={transactions} pagination={pagination} />
}

function CreditBalanceSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-muted rounded w-32" />
        <div className="h-10 bg-muted rounded w-24" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center p-4 bg-muted rounded-lg">
            <div className="h-8 bg-muted-foreground/20 rounded w-16 mx-auto mb-2" />
            <div className="h-4 bg-muted-foreground/20 rounded w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CreditHistorySkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-pulse">
      <div className="p-6 border-b border-border">
        <div className="h-6 bg-muted rounded w-40" />
      </div>
      <div className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-5 bg-muted rounded w-12 ml-auto" />
                <div className="h-3 bg-muted rounded w-24 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
