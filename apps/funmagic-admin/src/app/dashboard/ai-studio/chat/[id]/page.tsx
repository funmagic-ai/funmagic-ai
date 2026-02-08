import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getChat, getChats } from '@/actions/ai-studio';
import { ChatLayout } from '@/components/ai-studio/chat-layout';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] w-full flex-col gap-3 md:gap-4">
      {/* Page Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">AI Studio</h1>
        <p className="text-sm md:text-base text-muted-foreground">Generate and edit images with AI</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={<ChatSkeleton />}>
          <ChatContent chatId={id} />
        </Suspense>
      </div>
    </div>
  );
}

async function ChatContent({ chatId }: { chatId: string }) {
  const [chats, chatData] = await Promise.all([
    getChats(),
    getChat(chatId),
  ]);

  if (!chatData) {
    notFound();
  }

  return (
    <ChatLayout
      initialChats={chats}
      initialChatId={chatId}
      initialMessages={chatData.messages}
    />
  );
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col-reverse md:flex-row h-full w-full gap-4">
      {/* Sidebar skeleton - bottom on mobile, left on desktop */}
      <div className="w-full md:w-80 shrink-0 rounded-lg border bg-card overflow-hidden">
        <div className="h-12 border-b bg-muted/50 flex items-center px-4">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-4 space-y-2 hidden md:block">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      {/* Chat panel skeleton */}
      <div className="flex-1 min-w-0 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
        <div className="h-12 border-b bg-muted/50 flex items-center px-4 shrink-0">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="border-t p-4 shrink-0">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
