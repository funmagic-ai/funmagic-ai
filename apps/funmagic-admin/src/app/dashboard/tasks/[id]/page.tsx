import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, tasks, taskPayloads, taskSteps } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, CreditCard, User, Wrench } from 'lucide-react';
import { JsonViewer } from '@/components/shared/json-viewer';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Details</h1>
          <p className="text-muted-foreground">View task execution details</p>
        </div>
      </div>

      <Suspense fallback={<TaskDetailSkeleton />}>
        <TaskDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function TaskDetailContent({ id }: { id: string }) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: { user: true, tool: true, payload: true, steps: true },
  });

  if (!task) {
    notFound();
  }

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    queued: 'secondary',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
  };

  const formatDuration = (start?: Date | null, end?: Date | null) => {
    if (!start || !end) return 'N/A';
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds`;
    return `${Math.round(seconds / 60)} minutes`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {task.user?.name ?? task.user?.email ?? 'Unknown'}
            </p>
            {task.user && (
              <Link
                href={`/dashboard/users/${task.user.id}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                View profile
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4" />
              Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{task.tool?.title ?? 'Unknown'}</p>
            {task.tool && (
              <Link
                href={`/dashboard/tools/${task.tool.id}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                View tool
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusColors[task.status] ?? 'secondary'} className="text-sm">
              {task.status}
            </Badge>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDuration(task.startedAt, task.completedAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{task.creditsCost}</p>
            <p className="text-sm text-muted-foreground">credits used</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Task execution timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(task.createdAt, 'datetime')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Queued</p>
              <p className="font-medium">
                {task.queuedAt ? formatDate(task.queuedAt, 'datetime') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">
                {task.startedAt ? formatDate(task.startedAt, 'datetime') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="font-medium">
                {task.completedAt ? formatDate(task.completedAt, 'datetime') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {task.steps && task.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
            <CardDescription>Multi-step execution progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {step.stepIndex + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.stepId}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={statusColors[step.status] ?? 'secondary'}>
                        {step.status}
                      </Badge>
                      {step.startedAt && step.completedAt && (
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(step.startedAt, step.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="input">
        <TabsList>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="provider">Provider</TabsTrigger>
          {task.payload?.error && <TabsTrigger value="error">Error</TabsTrigger>}
        </TabsList>

        <TabsContent value="input" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
              <CardDescription>User input for this task</CardDescription>
            </CardHeader>
            <CardContent>
              <JsonViewer data={task.payload?.input} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Output Data</CardTitle>
              <CardDescription>Task execution results</CardDescription>
            </CardHeader>
            <CardContent>
              <JsonViewer data={task.payload?.output} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provider" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Provider Request</CardTitle>
                <CardDescription>Request sent to provider</CardDescription>
              </CardHeader>
              <CardContent>
                <JsonViewer data={task.payload?.providerRequest} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Response</CardTitle>
                <CardDescription>Response from provider</CardDescription>
              </CardHeader>
              <CardContent>
                <JsonViewer data={task.payload?.providerResponse} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {task.payload?.error && (
          <TabsContent value="error" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>Task execution error</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                  {task.payload.error}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function TaskDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-96" />
    </div>
  );
}
