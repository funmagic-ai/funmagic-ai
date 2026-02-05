import { Suspense } from 'react';
import { db, users, tasks, credits, creditTransactions } from '@/lib/db';
import { count, sum, desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, ListTodo, CreditCard, DollarSign, Receipt } from 'lucide-react';
import { StatsSkeleton } from '@/components/shared/stats-skeleton';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

export default function DashboardPage() {
  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform statistics
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
              <RecentTransactions />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Latest task activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
              <RecentTasks />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function StatsCards() {
  const [userCount] = await db.select({ count: count() }).from(users);
  const [taskCount] = await db.select({ count: count() }).from(tasks);
  const [creditSum] = await db.select({ total: sum(credits.lifetimeUsed) }).from(credits);
  const [purchaseSum] = await db
    .select({ total: sum(creditTransactions.amount) })
    .from(creditTransactions)
    .where(eq(creditTransactions.type, 'purchase'));

  const stats = [
    {
      title: 'Total Users',
      value: userCount.count.toLocaleString(),
      description: 'Registered users',
      icon: Users,
    },
    {
      title: 'Total Tasks',
      value: taskCount.count.toLocaleString(),
      description: 'All-time tasks',
      icon: ListTodo,
    },
    {
      title: 'Credits Used',
      value: (creditSum.total ?? 0).toLocaleString(),
      description: 'Lifetime usage',
      icon: CreditCard,
    },
    {
      title: 'Credits Purchased',
      value: (purchaseSum.total ?? 0).toLocaleString(),
      description: 'Total purchases',
      icon: DollarSign,
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

async function RecentTransactions() {
  const transactions = await db.query.creditTransactions.findMany({
    with: { user: true },
    orderBy: desc(creditTransactions.createdAt),
    limit: 5,
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
            Recent credit transactions will appear here.
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
                <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                  {tx.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function RecentTasks() {
  const recentTasks = await db.query.tasks.findMany({
    with: { user: true, tool: true },
    orderBy: desc(tasks.createdAt),
    limit: 5,
  });

  if (recentTasks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodo />
          </EmptyMedia>
          <EmptyTitle>No tasks yet</EmptyTitle>
          <EmptyDescription>
            Recent task activity will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    queued: 'secondary',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Tool</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                {task.user?.name ?? task.user?.email ?? 'Unknown'}
              </TableCell>
              <TableCell>{task.tool?.title ?? 'Unknown'}</TableCell>
              <TableCell>
                <Badge variant={statusColors[task.status] ?? 'secondary'}>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {new Date(task.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
