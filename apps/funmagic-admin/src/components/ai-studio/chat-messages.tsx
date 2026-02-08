'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, User } from 'lucide-react';
import { MessageImages } from './message-images';
import type { Message, MessageImage } from '@/actions/ai-studio';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: Message[];
  streamingMessageId: string | null;
  streamingContent: string;
  streamingImages: MessageImage[];
  onQuoteImage: (messageId: string, image: MessageImage) => void;
}

export function ChatMessages({
  messages,
  streamingMessageId,
  streamingContent,
  streamingImages,
  onQuoteImage,
}: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Bot className="mx-auto h-12 w-12 mb-4" />
          <p>Start a conversation by typing a message below.</p>
          <p className="text-sm mt-2">
            Generate images, edit them, or remove backgrounds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isStreaming={message.id === streamingMessageId}
          streamingContent={message.id === streamingMessageId ? streamingContent : undefined}
          streamingImages={message.id === streamingMessageId ? streamingImages : undefined}
          onQuoteImage={onQuoteImage}
        />
      ))}
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingImages?: MessageImage[];
  onQuoteImage: (messageId: string, image: MessageImage) => void;
}

function ChatMessage({
  message,
  isStreaming,
  streamingContent,
  streamingImages,
  onQuoteImage,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isProcessing = message.status === 'pending' || message.status === 'processing';
  const isFailed = message.status === 'failed';

  // Determine what content to show
  const displayContent = isStreaming && streamingContent
    ? streamingContent
    : message.content;

  const displayImages = isStreaming && streamingImages && streamingImages.length > 0
    ? streamingImages
    : message.images;

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn('flex-1 space-y-2', isUser && 'flex flex-col items-end')}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'Assistant'}
          </span>
          {!isUser && message.provider && (
            <span className="text-xs text-muted-foreground">
              via {message.provider}{message.model ? ` (${message.model})` : ''}
            </span>
          )}
        </div>

        <Card className={cn(
          isUser ? 'w-fit max-w-[80%]' : 'max-w-[80%]',
          displayImages?.length && 'max-w-[90%] lg:max-w-[85%]',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          isFailed && 'border-destructive'
        )}>
          <CardContent className="p-3">
            {/* Loading state */}
            {isProcessing && !streamingContent && !displayImages?.length && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}

            {/* Text content */}
            {displayContent && (
              <p className="whitespace-pre-wrap text-sm">
                {displayContent}
                {isStreaming && <span className="animate-pulse">|</span>}
              </p>
            )}

            {/* Error message */}
            {isFailed && message.error && (
              <p className="text-sm text-destructive">{message.error}</p>
            )}

            {/* Images */}
            {displayImages && displayImages.length > 0 && (
              <div className="mt-3">
                <MessageImages
                  messageId={message.id}
                  images={displayImages}
                  onQuote={(image) => onQuoteImage(message.id, image)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
