import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getCreditBalance, getCreditTransactions } from '@/lib/queries/credits'
import { Coins, Receipt, Shield, Lock, Key } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserSettings } from '@/components/profile/UserSettings'
import { CreditHistory } from '@/components/profile/CreditHistory'

interface ProfilePageProps {
  params: Promise<{ locale: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('profile')

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-panel h-auto p-1.5 gap-1">
          <TabsTrigger value="overview" className="px-6 py-2.5">
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="account" className="px-6 py-2.5">
            {t('tabs.account')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="px-6 py-2.5">
            {t('tabs.transactions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Suspense fallback={<CreditCardSkeleton />}>
              <CreditOverviewCard />
            </Suspense>

            <Suspense fallback={<RecentActivitySkeleton />}>
              <RecentActivityCard />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            <UserSettings />
            <SecuritySection />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Suspense fallback={<TransactionsSkeleton />}>
            <TransactionsSection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  )
}

async function CreditOverviewCard() {
  await connection()
  const balance = await getCreditBalance()
  const t = await getTranslations('profile')

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{t('credits.title')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <p className="text-3xl font-bold text-primary">{balance.availableBalance}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('credits.available')}</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-3xl font-bold text-muted-foreground">{balance.balance}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('credits.total')}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-sm">
        <span className="text-muted-foreground">{t('credits.lifetimeUsed')}</span>
        <span className="font-medium">{balance.lifetimeUsed}</span>
      </div>

      <Link
        href="/pricing"
        className="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-medium"
      >
        <Coins className="h-4 w-4" />
        {t('buyCredits')}
      </Link>
    </div>
  )
}

async function RecentActivityCard() {
  await connection()
  const { transactions } = await getCreditTransactions({ limit: 5 })
  const t = await getTranslations('profile')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
      case 'refund':
        return 'text-green-600'
      case 'usage':
      case 'reservation':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Receipt className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{t('transactions.recent')}</h2>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {t('transactions.noTransactions')}
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{tx.description || tx.type}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
              </div>
              <span className={`text-sm font-medium ${getTypeColor(tx.type)}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

async function SecuritySection() {
  const t = await getTranslations('profile')

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{t('security.title')}</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">{t('security.password')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('security.passwordDescription')}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors">
            {t('security.changePassword')}
          </button>
        </div>

        <div className="border-t border-border/50 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">{t('security.twoFactor')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('security.twoFactorDescription')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-muted rounded-full">
                {t('security.notEnabled')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function TransactionsSection() {
  await connection()
  const { transactions, pagination } = await getCreditTransactions({ limit: 20 })

  return <CreditHistory transactions={transactions} pagination={pagination} />
}

function CreditCardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 bg-muted rounded-lg" />
        <div className="h-5 bg-muted rounded w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-muted/50 rounded-lg" />
        <div className="h-24 bg-muted/50 rounded-lg" />
      </div>
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <div className="glass-panel rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 bg-muted rounded-lg" />
        <div className="h-5 bg-muted rounded w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-2">
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="h-4 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 bg-muted rounded-lg" />
        <div className="h-5 bg-muted rounded w-40" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between py-3 border-b border-border/50 last:border-0">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-4 bg-muted rounded w-12" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
