'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { RelativeTime } from '@/components/shared/relative-time';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { deleteChat, type Chat } from '@/actions/ai-studio';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId?: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  hideHeader?: boolean; // Hide header when used inside mobile collapsible
}

export function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  hideHeader = false,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar Header - hidden when inside mobile collapsible */}
      {!hideHeader && (
        <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b bg-muted/50">
          <span className="font-medium text-sm">Chat History</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Chat List */}
      <ScrollArea className={cn("flex-1 min-h-0", hideHeader && "max-h-full")}>
        <div className="p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chats yet. Click + to start a new chat.
            </div>
          ) : (
            chats.map((chat) => (
              <ChatCard
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={() => {
                  deleteChat(chat.id).then((success) => {
                    if (success) {
                      onDeleteChat(chat.id);
                      toast.success('Chat deleted');
                    } else {
                      toast.error('Failed to delete chat');
                    }
                  });
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>
      {/* New Chat button for mobile when header is hidden */}
      {hideHeader && (
        <div className="p-2 border-t">
          <Button onClick={onNewChat} className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      )}
    </div>
  );
}

interface ChatCardProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ChatCard({ chat, isActive, onSelect, onDelete }: ChatCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      onDelete();
    });
  };

  const chatTitle = chat.title || 'New Chat';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent',
        isActive && 'bg-accent border-primary'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">
                {chatTitle}
              </span>
            </div>
            <RelativeTime
              date={chat.updatedAt}
              className="text-xs text-muted-foreground mt-1 block"
            />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DeleteConfirmDialog
              title="Delete chat?"
              description={`Are you sure you want to delete "${chatTitle}"? This will permanently delete all messages in this chat.`}
              onConfirm={handleDelete}
              isPending={isPending}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
