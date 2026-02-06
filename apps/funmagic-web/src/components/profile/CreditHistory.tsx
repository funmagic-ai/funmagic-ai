import { Receipt } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'

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
        return 'text-muted-foreground'
    }
  }

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
      case 'refund':
        return 'bg-green-500/10'
      case 'usage':
      case 'reservation':
        return 'bg-red-500/10'
      default:
        return 'bg-muted'
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
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">Transaction History</h2>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle>No transactions yet</EmptyTitle>
            <EmptyDescription>
              Your credit purchases will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold">Transaction History</h2>
      </div>

      <div className="divide-y divide-border/50">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                    transaction.type
                  )} ${getTypeBgColor(transaction.type)}`}
                >
                  {getTypeLabel(transaction.type)}
                </span>
                {transaction.description && (
                  <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className={`font-medium ${getTypeColor(transaction.type)}`}>
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination.total > pagination.limit && (
        <div className="p-4 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {transactions.length} of {pagination.total} transactions
          </p>
        </div>
      )}
    </div>
  )
}
