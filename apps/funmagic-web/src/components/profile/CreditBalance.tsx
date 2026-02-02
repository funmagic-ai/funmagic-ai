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
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Credit Balance</h2>
        <Link
          href="/pricing"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Buy Credits
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">{availableBalance}</p>
          <p className="text-sm text-gray-600 mt-1">Available</p>
        </div>

        {reservedBalance > 0 && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{reservedBalance}</p>
            <p className="text-sm text-gray-600 mt-1">Reserved</p>
          </div>
        )}

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-600">{balance}</p>
          <p className="text-sm text-gray-600 mt-1">Total Balance</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Lifetime Purchased</p>
          <p className="font-medium text-gray-900">{lifetimePurchased} credits</p>
        </div>
        <div>
          <p className="text-gray-500">Lifetime Used</p>
          <p className="font-medium text-gray-900">{lifetimeUsed} credits</p>
        </div>
      </div>
    </div>
  )
}
