interface Transaction {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string | null
  referenceType: string | null
  referenceId: string | null
  createdAt: string
}

interface CreditHistoryProps {
  transactions: Transaction[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export function CreditHistory({ transactions, pagination }: CreditHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        return 'text-gray-600'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchased'
      case 'bonus':
        return 'Bonus'
      case 'refund':
        return 'Refunded'
      case 'usage':
        return 'Used'
      case 'reservation':
        return 'Reserved'
      default:
        return type
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
        <p className="text-gray-500 text-center py-8">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
      </div>

      <div className="divide-y">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                    transaction.type
                  )} bg-opacity-10`}
                  style={{
                    backgroundColor:
                      transaction.type === 'purchase' ||
                      transaction.type === 'bonus' ||
                      transaction.type === 'refund'
                        ? 'rgb(220 252 231)'
                        : 'rgb(254 226 226)',
                  }}
                >
                  {getTypeLabel(transaction.type)}
                </span>
                {transaction.description && (
                  <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className={`font-medium ${getTypeColor(transaction.type)}`}>
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.total > pagination.limit && (
        <div className="p-4 border-t text-center">
          <p className="text-sm text-gray-500">
            Showing {transactions.length} of {pagination.total} transactions
          </p>
        </div>
      )}
    </div>
  )
}
