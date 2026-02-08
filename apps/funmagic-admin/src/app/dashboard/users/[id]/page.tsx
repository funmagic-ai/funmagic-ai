import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/date-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CreditCard, ListTodo, User, Receipt } from 'lucide-react';
import { UserRoleSelect } from '@/components/users/user-role-select';
import { UserCreditAdjust } from '@/components/users/user-credit-adjust';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface UserWithCredits {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  credits: {
    balance: number;
    lifetimePurchased: number;
    lifetimeUsed: number;
  } | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface Task {
  id: string;
  status: string;
  creditsCost: number;
  createdAt: string;
  tool: { id: string; title: string } | null;
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">View and manage user account</p>
        </div>
      </div>

      <Suspense fallback={<UserDetailSkeleton />}>
        <UserDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function UserDetailContent({ id }: { id: string }) {
  // TODO: After regenerating API types with `bun run api:generate`, use:
  // const { data } = await api.GET('/api/admin/users/{id}', { params: { path: { id } } });
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/users/${id}`, {
    headers: { cookie: cookieHeader },
  });

  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as {
    user: UserWithCredits;
    recentTransactions: Transaction[];
    recentTasks: Task[];
  };

  const { user, recentTransactions, recentTasks } = data;

  const roleColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    user: 'secondary',
    admin: 'default',
    super_admin: 'destructive',
  };

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    queued: 'secondary',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-lg font-medium">{user.name ?? 'No name'}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <UserRoleSelect userId={user.id} currentRole={user.role} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Verified</p>
                    <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                      {user.emailVerified ? 'Verified' : 'Not verified'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold">{(user.credits?.balance ?? 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Current balance</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Purchased</p>
                <p className="font-medium">
                  {(user.credits?.lifetimePurchased ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Used</p>
                <p className="font-medium">{(user.credits?.lifetimeUsed ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <UserCreditAdjust userId={user.id} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Credit transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Receipt />
                    </EmptyMedia>
                    <EmptyTitle>No transactions yet</EmptyTitle>
                    <EmptyDescription>
                      This user has no credit transactions.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.type === 'purchase' ? 'default' : 'secondary'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.description ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {tx.amount > 0 ? '+' : ''}
                            {tx.amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{tx.balanceAfter}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Task history for this user</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ListTodo />
                    </EmptyMedia>
                    <EmptyTitle>No tasks yet</EmptyTitle>
                    <EmptyDescription>
                      This user hasn't created any tasks.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.tool?.title ?? 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[task.status] ?? 'secondary'}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{task.creditsCost}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(task.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
