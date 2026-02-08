'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatSidebar } from './chat-sidebar';
import { ChatPanel } from './chat-panel';
import { createChat, getAvailableProviders, type Chat, type Message, type AvailableProviders } from '@/actions/ai-studio';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ChatLayoutProps {
  initialChats: Chat[];
  initialChatId?: string;
  initialMessages?: Message[];
}

export function ChatLayout({
  initialChats,
  initialChatId,
  initialMessages = [],
}: ChatLayoutProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(initialChatId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Collapsed by default on mobile
  const [availableProviders, setAvailableProviders] = useState<AvailableProviders>({
    openai: true,
    google: true,
    fal: true,
  });

  // Fetch available providers on mount
  useEffect(() => {
    getAvailableProviders().then(setAvailableProviders);
  }, []);

  const handleNewChat = useCallback(async () => {
    const result = await createChat();
    if (result?.chatId) {
      setChats((prev) => [
        {
          id: result.chatId,
          title: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setActiveChatId(result.chatId);
      setMessages([]);
      router.push(`/dashboard/ai-studio/chat/${result.chatId}`);
    }
  }, [router]);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    router.push(`/dashboard/ai-studio/chat/${chatId}`);
  }, [router]);

  const handleDeleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(undefined);
      setMessages([]);
      // Use replace to avoid keeping deleted chat URL in history
      router.replace('/dashboard/ai-studio');
    }
  }, [activeChatId, router]);

  const handleMessagesUpdate = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const handleChatTitleUpdate = useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title } : c))
    );
  }, []);

  // Maximized mode - show only chat panel
  if (isMaximized && activeChatId) {
    return (
      <div className="h-full w-full rounded-lg border bg-card overflow-hidden flex flex-col">
        <ChatPanel
          chatId={activeChatId}
          messages={messages}
          onMessagesUpdate={handleMessagesUpdate}
          onChatTitleUpdate={handleChatTitleUpdate}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(false)}
          chatTitle={chats.find((c) => c.id === activeChatId)?.title}
          availableProviders={availableProviders}
        />
      </div>
    );
  }

  // Normal mode - two-card split layout
  // Mobile: flex-col-reverse (chat on top, history below)
  // Desktop: flex-row (history on left, chat on right)
  return (
    <div className="flex flex-col-reverse md:flex-row h-full w-full gap-4">
      {/* History Card - Collapsible on mobile, always visible on desktop */}
      <div className="w-full md:w-80 shrink-0 rounded-lg border bg-card overflow-hidden flex flex-col">
        {/* Mobile: Collapsible */}
        <div className="md:hidden">
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <button className="h-12 w-full flex items-center justify-between px-4 border-b bg-muted/50 hover:bg-muted/70 transition-colors">
                <span className="font-medium text-sm">
                  Chat History ({chats.length})
                </span>
                {isHistoryOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-64 overflow-y-auto">
                <ChatSidebar
                  chats={chats}
                  activeChatId={activeChatId}
                  onNewChat={handleNewChat}
                  onSelectChat={(chatId) => {
                    handleSelectChat(chatId);
                    setIsHistoryOpen(false); // Close after selection on mobile
                  }}
                  onDeleteChat={handleDeleteChat}
                  hideHeader
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        {/* Desktop: Always visible */}
        <div className="hidden md:flex md:flex-col md:h-full">
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      </div>

      {/* Chat Card */}
      <div className="flex-1 min-w-0 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
        {activeChatId ? (
          <ChatPanel
            chatId={activeChatId}
            messages={messages}
            onMessagesUpdate={handleMessagesUpdate}
            onChatTitleUpdate={handleChatTitleUpdate}
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized(true)}
            chatTitle={chats.find((c) => c.id === activeChatId)?.title}
            availableProviders={availableProviders}
          />
        ) : (
          <EmptyState onNewChat={handleNewChat} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <>
      {/* Toolbar Header */}
      <div className="h-12 shrink-0 flex items-center px-4 border-b bg-muted/50">
        <span className="font-medium text-sm">New Chat</span>
      </div>
      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Bot className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-lg font-medium text-foreground">AI Studio</h2>
          <p className="mt-1 mb-4">Select a chat or create a new one to get started</p>
          <Button onClick={onNewChat} className="md:hidden">
            Start New Chat
          </Button>
        </div>
      </div>
    </>
  );
}
