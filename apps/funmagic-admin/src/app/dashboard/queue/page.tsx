import { Suspense } from 'react';
import { db, tasks, adminMessages } from '@/lib/db';
import { sql, desc, eq, and, gt, isNotNull } from 'drizzle-orm';
import { formatDate } from '@/lib/date-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Clock, Play, CheckCircle, XCircle, Loader2, Globe, Bot } from 'lucide-react';

export default function QueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue</h1>
        <p className="text-muted-foreground">Monitor job queue status</p>
      </div>

      <Tabs defaultValue="web" className="w-full">
        <TabsList>
          <TabsTrigger value="web" className="gap-2">
            <Globe className="h-4 w-4" />
            Web Tasks
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Bot className="h-4 w-4" />
            Admin AI Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="web" className="space-y-6 mt-6">
          <Suspense fallback={<StatsSkeleton />}>
            <WebQueueStats />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Jobs</CardTitle>
                <CardDescription>Currently processing tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
                  <WebActiveJobsTable />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queued Jobs</CardTitle>
                <CardDescription>Waiting to be processed</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
                  <WebQueuedJobsTable />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Failures</CardTitle>
              <CardDescription>Failed tasks in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton columns={5} rows={5} />}>
                <WebFailedJobsTable />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6 mt-6">
          <Suspense fallback={<StatsSkeleton />}>
            <AdminQueueStats />
          </Suspense>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Jobs</CardTitle>
                <CardDescription>Currently processing AI tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
                  <AdminActiveJobsTable />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queued Jobs</CardTitle>
                <CardDescription>Waiting to be processed</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
                  <AdminQueuedJobsTable />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Failures</CardTitle>
              <CardDescription>Failed tasks in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton columns={5} rows={5} />}>
                <AdminFailedJobsTable />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Web Tasks Components ============

async function WebQueueStats() {
  const statusCounts = await db
    .select({
      status: tasks.status,
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .groupBy(tasks.status);

  const countsMap = new Map(statusCounts.map((s) => [s.status, s.count]));

  const stats = [
    {
      title: 'Pending',
      value: (countsMap.get('pending') ?? 0).toLocaleString(),
      description: 'Awaiting queue',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Queued',
      value: (countsMap.get('queued') ?? 0).toLocaleString(),
      description: 'In queue',
      icon: Play,
      color: 'text-blue-600',
    },
    {
      title: 'Processing',
      value: (countsMap.get('processing') ?? 0).toLocaleString(),
      description: 'Currently running',
      icon: Loader2,
      color: 'text-purple-600',
    },
    {
      title: 'Completed',
      value: (countsMap.get('completed') ?? 0).toLocaleString(),
      description: 'Successfully finished',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Failed',
      value: (countsMap.get('failed') ?? 0).toLocaleString(),
      description: 'Errored tasks',
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function WebActiveJobsTable() {
  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, 'processing'),
    with: { user: true, tool: true },
    orderBy: desc(tasks.startedAt),
    limit: 10,
  });

  if (activeTasks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 />
          </EmptyMedia>
          <EmptyTitle>No active jobs</EmptyTitle>
          <EmptyDescription>
            No tasks are currently being processed.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Tool</TableHead>
          <TableHead>Step</TableHead>
          <TableHead>Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeTasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">
              {task.user?.name ?? task.user?.email ?? 'Unknown'}
            </TableCell>
            <TableCell>{task.tool?.title ?? 'Unknown'}</TableCell>
            <TableCell>
              <Badge variant="outline">{task.currentStepId ?? 'N/A'}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {task.startedAt ? formatDate(task.startedAt, 'time') : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function WebQueuedJobsTable() {
  const queuedTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, 'queued'),
    with: { user: true, tool: true },
    orderBy: tasks.queuedAt,
    limit: 10,
  });

  if (queuedTasks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Clock />
          </EmptyMedia>
          <EmptyTitle>No queued jobs</EmptyTitle>
          <EmptyDescription>
            No tasks are waiting to be processed.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Tool</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Queued</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queuedTasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">
              {task.user?.name ?? task.user?.email ?? 'Unknown'}
            </TableCell>
            <TableCell>{task.tool?.title ?? 'Unknown'}</TableCell>
            <TableCell>{task.creditsCost}</TableCell>
            <TableCell className="text-muted-foreground">
              {task.queuedAt ? formatDate(task.queuedAt, 'time') : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function WebFailedJobsTable() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const failedTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.status, 'failed'), gt(tasks.completedAt, oneDayAgo)),
    with: { user: true, tool: true, payload: true },
    orderBy: desc(tasks.completedAt),
    limit: 10,
  });

  if (failedTasks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <XCircle />
          </EmptyMedia>
          <EmptyTitle>No failures</EmptyTitle>
          <EmptyDescription>
            No tasks have failed in the last 24 hours.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Tool</TableHead>
          <TableHead>Error</TableHead>
          <TableHead>Credits</TableHead>
          <TableHead>Failed At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {failedTasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">
              {task.user?.name ?? task.user?.email ?? 'Unknown'}
            </TableCell>
            <TableCell>{task.tool?.title ?? 'Unknown'}</TableCell>
            <TableCell className="max-w-xs truncate text-destructive">
              {task.payload?.error ?? 'Unknown error'}
            </TableCell>
            <TableCell>{task.creditsCost}</TableCell>
            <TableCell className="text-muted-foreground">
              {task.completedAt ? formatDate(task.completedAt, 'datetime') : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============ Admin AI Studio Components ============
// Query adminMessages where bullmqJobId is not null (i.e., assistant messages with jobs)

async function AdminQueueStats() {
  // Query admin messages that have jobs (assistant messages)
  const statusCounts = await db
    .select({
      status: adminMessages.status,
      count: sql<number>`count(*)::int`,
    })
    .from(adminMessages)
    .where(isNotNull(adminMessages.bullmqJobId))
    .groupBy(adminMessages.status);

  const countsMap = new Map(statusCounts.map((s) => [s.status, s.count]));

  const stats = [
    {
      title: 'Pending',
      value: (countsMap.get('pending') ?? 0).toLocaleString(),
      description: 'Awaiting processing',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Processing',
      value: (countsMap.get('processing') ?? 0).toLocaleString(),
      description: 'Currently running',
      icon: Loader2,
      color: 'text-purple-600',
    },
    {
      title: 'Completed',
      value: (countsMap.get('completed') ?? 0).toLocaleString(),
      description: 'Successfully finished',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Failed',
      value: (countsMap.get('failed') ?? 0).toLocaleString(),
      description: 'Errored tasks',
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function AdminActiveJobsTable() {
  const activeMessages = await db.query.adminMessages.findMany({
    where: and(
      eq(adminMessages.status, 'processing'),
      isNotNull(adminMessages.bullmqJobId)
    ),
    orderBy: desc(adminMessages.createdAt),
    limit: 10,
  });

  if (activeMessages.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 />
          </EmptyMedia>
          <EmptyTitle>No active jobs</EmptyTitle>
          <EmptyDescription>
            No AI tasks are currently being processed.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Started</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activeMessages.map((msg) => (
          <TableRow key={msg.id}>
            <TableCell className="font-medium capitalize">{msg.provider}</TableCell>
            <TableCell>{msg.model ?? 'Default'}</TableCell>
            <TableCell className="text-muted-foreground">
              {msg.progress ?? '0'}%
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(msg.createdAt, 'time')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function AdminQueuedJobsTable() {
  const queuedMessages = await db.query.adminMessages.findMany({
    where: and(
      eq(adminMessages.status, 'pending'),
      isNotNull(adminMessages.bullmqJobId)
    ),
    orderBy: adminMessages.createdAt,
    limit: 10,
  });

  if (queuedMessages.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Clock />
          </EmptyMedia>
          <EmptyTitle>No queued jobs</EmptyTitle>
          <EmptyDescription>
            No AI tasks are waiting to be processed.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queuedMessages.map((msg) => (
          <TableRow key={msg.id}>
            <TableCell className="font-medium capitalize">{msg.provider}</TableCell>
            <TableCell>{msg.model ?? 'Default'}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(msg.createdAt, 'time')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function AdminFailedJobsTable() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const failedMessages = await db.query.adminMessages.findMany({
    where: and(
      eq(adminMessages.status, 'failed'),
      isNotNull(adminMessages.bullmqJobId),
      gt(adminMessages.createdAt, oneDayAgo)
    ),
    orderBy: desc(adminMessages.createdAt),
    limit: 10,
  });

  if (failedMessages.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <XCircle />
          </EmptyMedia>
          <EmptyTitle>No failures</EmptyTitle>
          <EmptyDescription>
            No AI tasks have failed in the last 24 hours.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Error</TableHead>
          <TableHead>Failed At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {failedMessages.map((msg) => (
          <TableRow key={msg.id}>
            <TableCell className="font-medium capitalize">{msg.provider}</TableCell>
            <TableCell>{msg.model ?? 'Default'}</TableCell>
            <TableCell className="max-w-xs truncate text-destructive">
              {msg.error ?? 'Unknown error'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {msg.completedAt ? formatDate(msg.completedAt, 'datetime') : formatDate(msg.createdAt, 'datetime')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
