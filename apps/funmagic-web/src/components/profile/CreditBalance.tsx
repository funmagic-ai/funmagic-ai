import Link from 'next/link'

interface CreditBalanceProps {
  balance: number
  availableBalance: number
  reservedBalance: number
  lifetimePurchased: number
  lifetimeUsed: number
}

export function CreditBalance({
  balance,
  availableBalance,
  reservedBalance,
  lifetimePurchased,
  lifetimeUsed,
}: CreditBalanceProps) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Credit Balance</h2>
        <Link
          href="/pricing"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Buy Credits
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <p className="text-3xl font-bold text-primary">{availableBalance}</p>
          <p className="text-sm text-muted-foreground mt-1">Available</p>
        </div>

        {reservedBalance > 0 && (
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{reservedBalance}</p>
            <p className="text-sm text-muted-foreground mt-1">Reserved</p>
          </div>
        )}

        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-3xl font-bold text-muted-foreground">{balance}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Balance</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Lifetime Purchased</p>
          <p className="font-medium text-foreground">{lifetimePurchased} credits</p>
        </div>
        <div>
          <p className="text-muted-foreground">Lifetime Used</p>
          <p className="font-medium text-foreground">{lifetimeUsed} credits</p>
        </div>
      </div>
    </div>
  )
}
