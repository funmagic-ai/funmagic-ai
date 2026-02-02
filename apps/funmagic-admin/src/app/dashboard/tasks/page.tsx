import { Suspense } from 'react';
import Link from 'next/link';
import { db, tasks } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Eye } from 'lucide-react';

interface TasksPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { status: statusFilter } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">Monitor and manage user tasks</p>
      </div>

      <Suspense fallback={<TaskTabsSkeleton />}>
        <TaskTabs currentStatus={statusFilter} />
      </Suspense>
    </div>
  );
}

async function TaskTabs({ currentStatus }: { currentStatus?: string }) {
  const statusCounts = await db
    .select({
      status: tasks.status,
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .groupBy(tasks.status);

  const countsMap = new Map(statusCounts.map((s) => [s.status, s.count]));

  const statuses = [
    { value: 'all', label: 'All', count: statusCounts.reduce((a, b) => a + b.count, 0) },
    { value: 'pending', label: 'Pending', count: countsMap.get('pending') ?? 0 },
    { value: 'queued', label: 'Queued', count: countsMap.get('queued') ?? 0 },
    { value: 'processing', label: 'Processing', count: countsMap.get('processing') ?? 0 },
    { value: 'completed', label: 'Completed', count: countsMap.get('completed') ?? 0 },
    { value: 'failed', label: 'Failed', count: countsMap.get('failed') ?? 0 },
  ];

  const activeStatus = currentStatus || 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Link key={status.value} href={`/dashboard/tasks?status=${status.value}`}>
            <Badge
              variant={activeStatus === status.value ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
            >
              {status.label} ({status.count})
            </Badge>
          </Link>
        ))}
      </div>

      <Suspense fallback={<TableSkeleton columns={7} rows={10} />}>
        <TaskTableData statusFilter={activeStatus === 'all' ? undefined : activeStatus} />
      </Suspense>
    </div>
  );
}

async function TaskTableData({ statusFilter }: { statusFilter?: string }) {
  const allTasks = await db.query.tasks.findMany({
    with: { user: true, tool: true },
    where: statusFilter ? eq(tasks.status, statusFilter) : undefined,
    orderBy: desc(tasks.createdAt),
    limit: 100,
  });

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No tasks found</p>
      </div>
    );
  }

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    queued: 'secondary',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
  };

  const formatDuration = (start?: Date | null, end?: Date | null) => {
    if (!start || !end) return '-';
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Tool</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                {task.user?.name ?? task.user?.email ?? 'Unknown'}
              </TableCell>
              <TableCell>{task.tool?.title ?? 'Unknown'}</TableCell>
              <TableCell>
                <Badge variant={statusColors[task.status] ?? 'secondary'}>{task.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{task.creditsCost}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDuration(task.startedAt, task.completedAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(task.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskTabsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <TableSkeleton columns={7} rows={10} />
    </div>
  );
}
