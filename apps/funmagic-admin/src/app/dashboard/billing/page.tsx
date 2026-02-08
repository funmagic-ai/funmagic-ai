import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { db, creditTransactions, credits } from '@/lib/db';
import { desc, eq, sum, count } from 'drizzle-orm';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsSkeleton } from '@/components/shared/stats-skeleton';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { DollarSign, CreditCard, TrendingUp, Users, Plus, Package, Receipt } from 'lucide-react';
import { PackageActions } from '@/components/billing/package-actions';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

export default function BillingPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Billing</h1>
          <p className="text-muted-foreground">Manage credit packages and view revenue</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/billing/packages/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Package
          </Link>
        </Button>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <BillingStats />
      </Suspense>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Credit Packages</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="mt-4">
          <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
            <PackagesTable />
          </Suspense>
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <Suspense fallback={<TableSkeleton columns={4} rows={10} />}>
            <TransactionsTable />
          </Suspense>
        </TabsContent>
      </Tabs>
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

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  price: string;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
}

async function PackagesTable() {
  // TODO: After regenerating API types with `bun run api:generate`, remove this fetch call
  // and use: const { data } = await api.GET('/api/admin/packages');
  const cookieHeader = (await cookies()).toString();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${baseUrl}/api/admin/packages`, {
    headers: { cookie: cookieHeader },
  });
  const data = (await res.json()) as { packages: CreditPackage[] };
  const packages = data?.packages ?? [];

  if (packages.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>No packages configured</EmptyTitle>
          <EmptyDescription>
            Create your first credit package to start selling credits.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Bonus</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
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
              <TableCell className="hidden text-right text-green-600 sm:table-cell">
                {pkg.bonusCredits ? `+${pkg.bonusCredits}` : '-'}
              </TableCell>
              <TableCell className="text-right">
                ${Number(pkg.price).toFixed(2)} {pkg.currency}
              </TableCell>
              <TableCell>
                <PackageActions pkg={pkg} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function TransactionsTable() {
  const transactions = await db.query.creditTransactions.findMany({
    with: { user: true },
    orderBy: desc(creditTransactions.createdAt),
    limit: 15,
  });

  if (transactions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyTitle>No transactions yet</EmptyTitle>
          <EmptyDescription>
            Transactions will appear here when users purchase credits.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto">
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
                {formatDate(tx.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
