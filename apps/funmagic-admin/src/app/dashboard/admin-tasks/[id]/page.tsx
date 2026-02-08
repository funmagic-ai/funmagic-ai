import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db, adminChats, adminMessages } from '@/lib/db';
import type { AdminMessageImage, AdminTaskInput } from '@funmagic/database';
import { eq, desc, isNotNull } from 'drizzle-orm';
import { formatDate } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Clock, MessageSquare, Image as ImageIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { JsonViewer } from '@/components/shared/json-viewer';

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({ params }: ConversationDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin-tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversation Details</h1>
          <p className="text-muted-foreground">View all tasks in this conversation</p>
        </div>
      </div>

      <Suspense fallback={<ConversationDetailSkeleton />}>
        <ConversationDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function ConversationDetailContent({ id }: { id: string }) {
  const chat = await db.query.adminChats.findFirst({
    where: eq(adminChats.id, id),
    with: {
      messages: {
        orderBy: desc(adminMessages.createdAt),
      },
    },
  });

  if (!chat) {
    notFound();
  }

  // Filter to only show assistant messages with jobs (task messages)
  const taskMessages = chat.messages.filter(m => m.bullmqJobId !== null);
  const completedCount = taskMessages.filter(m => m.status === 'completed').length;
  const failedCount = taskMessages.filter(m => m.status === 'failed').length;
  const pendingCount = taskMessages.filter(m => m.status === 'pending').length;
  const processingCount = taskMessages.filter(m => m.status === 'processing').length;

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    processing: <Loader2 className="h-4 w-4 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4" />,
    failed: <XCircle className="h-4 w-4" />,
  };

  const formatDuration = (start?: Date | null, end?: Date | null) => {
    if (!start || !end) return 'N/A';
    const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold line-clamp-1">
              {chat.title || 'Untitled conversation'}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(chat.createdAt, 'datetime')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-muted-foreground">tasks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount + processingCount}</p>
            <p className="text-sm text-muted-foreground">tasks pending/processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-sm text-muted-foreground">tasks failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({taskMessages.length})</CardTitle>
          <CardDescription>All AI generation tasks in this conversation</CardDescription>
        </CardHeader>
        <CardContent>
          {taskMessages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tasks in this conversation</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {taskMessages.map((msg, index) => {
                const input = msg.input as AdminTaskInput | null;
                const msgImages = (msg.images as AdminMessageImage[] | null) ?? [];
                return (
                  <AccordionItem key={msg.id} value={msg.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="flex items-center gap-1.5">
                          {statusIcons[msg.status]}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium capitalize">
                            {msg.provider}
                            {msg.model && <span className="text-muted-foreground font-normal ml-1">/ {msg.model}</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.createdAt, 'datetime')} • {formatDuration(msg.createdAt, msg.completedAt)}
                          </span>
                        </div>
                        <Badge variant={statusColors[msg.status]} className="ml-auto mr-4">
                          {msg.status}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {/* Generated Images */}
                        {msgImages.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Generated Images ({msgImages.length})
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                              {msgImages.map((img: AdminMessageImage, imgIndex: number) => (
                                <div key={imgIndex} className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
                                  {/* Images only have storageKey - would need to fetch presigned URL */}
                                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs p-2 text-center">
                                    <span>storageKey: {img.storageKey.slice(0, 20)}...</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Input */}
                        {input && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Input</h4>
                            <div className="rounded-lg border bg-muted/50 p-3">
                              <JsonViewer data={input} />
                            </div>
                          </div>
                        )}

                        {/* Content (text response) */}
                        {msg.content && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Response</h4>
                            <div className="rounded-lg border bg-muted/50 p-3 whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        )}

                        {/* Error */}
                        {msg.error && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-destructive">Error</h4>
                            <pre className="whitespace-pre-wrap rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                              {msg.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConversationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
