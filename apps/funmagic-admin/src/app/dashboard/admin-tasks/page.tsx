import { Suspense } from 'react';
import Link from 'next/link';
import { db, adminChats, adminMessages } from '@/lib/db';
import { desc, eq, sql, isNotNull } from 'drizzle-orm';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/table-skeleton';
import { MessageSquare, ChevronRight } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';

interface AdminTasksPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminTasksPage({ searchParams }: AdminTasksPageProps) {
  const { status: statusFilter } = await searchParams;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">AI Studio Conversations</h1>
        <p className="text-muted-foreground">Monitor AI Studio tasks grouped by conversation</p>
      </div>

      <Suspense fallback={<TaskTabsSkeleton />}>
        <TaskTabs currentStatus={statusFilter} />
      </Suspense>
    </div>
  );
}

async function TaskTabs({ currentStatus }: { currentStatus?: string }) {
  // Query messages that have jobs (assistant messages with bullmqJobId)
  const statusCounts = await db
    .select({
      status: adminMessages.status,
      count: sql<number>`count(*)::int`,
    })
    .from(adminMessages)
    .where(isNotNull(adminMessages.bullmqJobId))
    .groupBy(adminMessages.status);

  const countsMap = new Map(statusCounts.map((s) => [s.status, s.count]));

  const statuses = [
    { value: 'all', label: 'All', count: statusCounts.reduce((a, b) => a + b.count, 0) },
    { value: 'pending', label: 'Pending', count: countsMap.get('pending') ?? 0 },
    { value: 'processing', label: 'Processing', count: countsMap.get('processing') ?? 0 },
    { value: 'completed', label: 'Completed', count: countsMap.get('completed') ?? 0 },
    { value: 'failed', label: 'Failed', count: countsMap.get('failed') ?? 0 },
  ];

  const activeStatus = currentStatus || 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Link key={status.value} href={`/dashboard/admin-tasks?status=${status.value}`}>
            <Badge
              variant={activeStatus === status.value ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
            >
              {status.label} ({status.count})
            </Badge>
          </Link>
        ))}
      </div>

      <Suspense fallback={<TableSkeleton columns={5} rows={10} />}>
        <ConversationTableData statusFilter={activeStatus === 'all' ? undefined : activeStatus} />
      </Suspense>
    </div>
  );
}

async function ConversationTableData({ statusFilter }: { statusFilter?: string }) {
  // Query chats with aggregated message info (only messages with jobs)
  const chatsWithMessages = await db
    .select({
      chatId: adminChats.id,
      chatTitle: adminChats.title,
      chatCreatedAt: adminChats.createdAt,
      chatUpdatedAt: adminChats.updatedAt,
      messageCount: sql<number>`count(case when ${adminMessages.bullmqJobId} is not null then 1 end)::int`,
      completedCount: sql<number>`count(case when ${adminMessages.status} = 'completed' and ${adminMessages.bullmqJobId} is not null then 1 end)::int`,
      failedCount: sql<number>`count(case when ${adminMessages.status} = 'failed' and ${adminMessages.bullmqJobId} is not null then 1 end)::int`,
      pendingCount: sql<number>`count(case when ${adminMessages.status} = 'pending' and ${adminMessages.bullmqJobId} is not null then 1 end)::int`,
      processingCount: sql<number>`count(case when ${adminMessages.status} = 'processing' and ${adminMessages.bullmqJobId} is not null then 1 end)::int`,
      latestProvider: sql<string>`max(${adminMessages.provider})`,
      latestModel: sql<string>`max(${adminMessages.model})`,
    })
    .from(adminChats)
    .leftJoin(adminMessages, eq(adminMessages.chatId, adminChats.id))
    .where(
      statusFilter
        ? sql`${adminMessages.status} = ${statusFilter} and ${adminMessages.bullmqJobId} is not null`
        : undefined
    )
    .groupBy(adminChats.id)
    .having(sql`count(case when ${adminMessages.bullmqJobId} is not null then 1 end) > 0`)
    .orderBy(desc(adminChats.updatedAt))
    .limit(100);

  if (chatsWithMessages.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquare />
          </EmptyMedia>
          <EmptyTitle>No conversations found</EmptyTitle>
          <EmptyDescription>
            No conversations match the selected filter.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const getStatusBadge = (chat: typeof chatsWithMessages[0]) => {
    if (chat.processingCount > 0) {
      return <Badge variant="default">Processing ({chat.processingCount})</Badge>;
    }
    if (chat.pendingCount > 0) {
      return <Badge variant="outline">Pending ({chat.pendingCount})</Badge>;
    }
    if (chat.failedCount > 0 && chat.completedCount === 0) {
      return <Badge variant="destructive">Failed ({chat.failedCount})</Badge>;
    }
    if (chat.failedCount > 0) {
      return (
        <div className="flex gap-1">
          <Badge variant="default">{chat.completedCount} done</Badge>
          <Badge variant="destructive">{chat.failedCount} failed</Badge>
        </div>
      );
    }
    return <Badge variant="default">Completed ({chat.completedCount})</Badge>;
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conversation</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Last Activity</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chatsWithMessages.map((chat) => (
            <TableRow key={chat.chatId}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium line-clamp-1">
                    {chat.chatTitle || 'Untitled conversation'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {chat.latestProvider && (
                      <Badge variant="outline" className="mr-1 text-xs">
                        {chat.latestProvider}
                      </Badge>
                    )}
                    {chat.latestModel && (
                      <span className="text-muted-foreground">{chat.latestModel}</span>
                    )}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{chat.messageCount}</span>
              </TableCell>
              <TableCell>{getStatusBadge(chat)}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(chat.chatUpdatedAt, 'datetime')}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/admin-tasks/${chat.chatId}`}>
                    <ChevronRight className="h-4 w-4" />
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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <TableSkeleton columns={5} rows={10} />
    </div>
  );
}
