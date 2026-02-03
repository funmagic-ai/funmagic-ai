import { Suspense } from 'react';
import { db, tasks } from '@/lib/db';
import { sql, desc, eq, and, gt } from 'drizzle-orm';
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
import { StatsSkeleton } from '@/components/shared/stats-skeleton';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Clock, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function QueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue</h1>
        <p className="text-muted-foreground">Monitor job queue status</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <QueueStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>Currently processing tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
              <ActiveJobsTable />
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
              <QueuedJobsTable />
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
            <FailedJobsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function QueueStats() {
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
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
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

async function ActiveJobsTable() {
  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, 'processing'),
    with: { user: true, tool: true },
    orderBy: desc(tasks.startedAt),
    limit: 10,
  });

  if (activeTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No active jobs</p>;
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
              {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function QueuedJobsTable() {
  const queuedTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, 'queued'),
    with: { user: true, tool: true },
    orderBy: tasks.queuedAt,
    limit: 10,
  });

  if (queuedTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No queued jobs</p>;
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
              {task.queuedAt ? new Date(task.queuedAt).toLocaleTimeString() : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function FailedJobsTable() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const failedTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.status, 'failed'), gt(tasks.completedAt, oneDayAgo)),
    with: { user: true, tool: true, payload: true },
    orderBy: desc(tasks.completedAt),
    limit: 10,
  });

  if (failedTasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No failures in the last 24 hours</p>;
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
              {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
