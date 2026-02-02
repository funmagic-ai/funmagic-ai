import { Suspense } from 'react';
import { db, creditPackages, creditTransactions, credits } from '@/lib/db';
import { desc, eq, sum, count } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatsSkeleton } from '@/components/shared/stats-skeleton';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { DollarSign, CreditCard, TrendingUp, Users } from 'lucide-react';
import { PackageForm } from '@/components/billing/package-form';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage credit packages and view revenue</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <BillingStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Credit Packages</CardTitle>
                <CardDescription>Available credit packages for purchase</CardDescription>
              </div>
              <PackageForm mode="create" />
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton columns={5} rows={5} />}>
              <PackagesTable />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
              <TransactionsTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function BillingStats() {
  const [purchaseSum] = await db
    .select({ total: sum(creditTransactions.amount) })
    .from(creditTransactions)
    .where(eq(creditTransactions.type, 'purchase'));

  const [usageSum] = await db
    .select({ total: sum(credits.lifetimeUsed) })
    .from(credits);

  const [purchaseCount] = await db
    .select({ count: count() })
    .from(creditTransactions)
    .where(eq(creditTransactions.type, 'purchase'));

  const [userCount] = await db
    .select({ count: count() })
    .from(credits);

  const stats = [
    {
      title: 'Total Purchased',
      value: (purchaseSum.total ?? 0).toLocaleString(),
      description: 'Credits purchased',
      icon: DollarSign,
    },
    {
      title: 'Total Used',
      value: (usageSum.total ?? 0).toLocaleString(),
      description: 'Credits consumed',
      icon: CreditCard,
    },
    {
      title: 'Transactions',
      value: purchaseCount.count.toLocaleString(),
      description: 'Purchase transactions',
      icon: TrendingUp,
    },
    {
      title: 'Users with Credits',
      value: userCount.count.toLocaleString(),
      description: 'Unique credit holders',
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function PackagesTable() {
  const packages = await db.query.creditPackages.findMany({
    orderBy: creditPackages.sortOrder,
  });

  if (packages.length === 0) {
    return <p className="text-sm text-muted-foreground">No packages configured</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Credits</TableHead>
          <TableHead className="text-right">Bonus</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((pkg) => (
          <TableRow key={pkg.id}>
            <TableCell className="font-medium">
              {pkg.name}
              {pkg.isPopular && (
                <Badge variant="secondary" className="ml-2">
                  Popular
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">{pkg.credits.toLocaleString()}</TableCell>
            <TableCell className="text-right text-green-600">
              {pkg.bonusCredits ? `+${pkg.bonusCredits}` : '-'}
            </TableCell>
            <TableCell className="text-right">
              ${Number(pkg.price).toFixed(2)} {pkg.currency}
            </TableCell>
            <TableCell>
              <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                {pkg.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function TransactionsTable() {
  const transactions = await db.query.creditTransactions.findMany({
    with: { user: true },
    orderBy: desc(creditTransactions.createdAt),
    limit: 15,
  });

  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions yet</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="font-medium">
              {tx.user?.name ?? tx.user?.email ?? 'Unknown'}
            </TableCell>
            <TableCell>
              <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>{tx.type}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                {tx.amount > 0 ? '+' : ''}
                {tx.amount}
              </span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {new Date(tx.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
