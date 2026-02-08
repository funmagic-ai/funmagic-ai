'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Maximize2, Minimize2, Settings2 } from 'lucide-react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import {
  sendMessage,
  type Message,
  type MessageImage,
  type AvailableProviders,
  type ImageGenerationOptions,
  type OpenAIImageOptions,
  type GoogleImageOptions,
} from '@/actions/ai-studio';
import { getMessageStreamUrl } from '@/lib/ai-studio-utils';

type Provider = 'openai' | 'google' | 'fal';
type ModelCapability = 'chat-image' | 'image-only' | 'utility';

interface ModelOption {
  value: string;
  label: string;
  capability: ModelCapability;
}

interface ModelGroup {
  label: string;
  models: ModelOption[];
}

const PROVIDER_MODELS: Record<Provider, ModelGroup[]> = {
  openai: [
    {
      label: 'Models',
      models: [
        { value: 'gpt-5', label: 'GPT-5', capability: 'chat-image' },
        { value: 'gpt-5-nano', label: 'GPT-5 Nano', capability: 'chat-image' },
      ],
    },
  ],
  google: [
    {
      label: 'Models',
      models: [
        { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash', capability: 'chat-image' },
        { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Preview', capability: 'chat-image' },
      ],
    },
  ],
  fal: [
    {
      label: 'Utilities',
      models: [
        { value: 'fal-ai/bria-rmbg', label: 'BRIA RMBG', capability: 'utility' },
      ],
    },
  ],
};

// Helper to get all models for a provider as flat list
function getAllModels(provider: Provider): ModelOption[] {
  return PROVIDER_MODELS[provider].flatMap(group => group.models);
}

// Helper to get first model for a provider
function getFirstModel(provider: Provider): ModelOption {
  return PROVIDER_MODELS[provider][0].models[0];
}

// Helper to find model capability
function getModelCapability(provider: Provider, modelValue: string): ModelCapability {
  const model = getAllModels(provider).find(m => m.value === modelValue);
  return model?.capability || 'image-only';
}

interface ChatPanelProps {
  chatId: string;
  messages: Message[];
  onMessagesUpdate: (messages: Message[]) => void;
  onChatTitleUpdate: (chatId: string, title: string) => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  chatTitle?: string | null;
  availableProviders?: AvailableProviders;
}

export function ChatPanel({
  chatId,
  messages,
  onMessagesUpdate,
  onChatTitleUpdate,
  isMaximized,
  onToggleMaximize,
  chatTitle,
  availableProviders = { openai: true, google: true, fal: true },
}: ChatPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quotedImages, setQuotedImages] = useState<Array<{ messageId: string; image: MessageImage }>>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingImages, setStreamingImages] = useState<MessageImage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if any provider is available
  const hasAnyProvider = availableProviders.openai || availableProviders.google || availableProviders.fal;

  // Provider and model state - find first available provider
  const getFirstAvailableProvider = (): Provider => {
    if (availableProviders.openai) return 'openai';
    if (availableProviders.google) return 'google';
    if (availableProviders.fal) return 'fal';
    return 'openai'; // fallback
  };

  const [provider, setProvider] = useState<Provider>(getFirstAvailableProvider);
  const [model, setModel] = useState<string>(getFirstModel(getFirstAvailableProvider()).value);

  // Check if current provider is available
  const isCurrentProviderAvailable = availableProviders[provider];

  const handleProviderChange = useCallback((newProvider: Provider) => {
    setProvider(newProvider);
    // Reset model to first option for new provider
    setModel(getFirstModel(newProvider).value);
  }, []);

  // Image generation options state
  const [openaiOptions, setOpenaiOptions] = useState<OpenAIImageOptions>({
    size: 'auto',
    quality: 'medium',
    format: 'png',
    background: 'opaque',
  });

  const [googleOptions, setGoogleOptions] = useState<GoogleImageOptions>({
    aspectRatio: '1:1',
    imageSize: '1K',
  });

  const [showOptions, setShowOptions] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingContent]);

  const handleQuoteImage = useCallback((messageId: string, image: MessageImage) => {
    setQuotedImages((prev) => {
      // Check if already quoted
      const exists = prev.some((q) => q.messageId === messageId && q.image.url === image.url);
      if (exists) return prev;
      return [...prev, { messageId, image }];
    });
  }, []);

  const handleRemoveQuotedImage = useCallback((index: number) => {
    setQuotedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSendMessage = async (content: string, uploadedImageUrls?: string[]) => {
    if (!content.trim() || !isCurrentProviderAvailable) return;

    setIsLoading(true);

    try {
      const quotedImageIds = quotedImages.map((q) => q.messageId);

      // Build options based on provider
      const options: ImageGenerationOptions = {};
      if (provider === 'openai') {
        options.openai = openaiOptions;
      } else if (provider === 'google') {
        options.google = googleOptions;
      }

      const result = await sendMessage({
        chatId,
        content,
        quotedImageIds: quotedImageIds.length > 0 ? quotedImageIds : undefined,
        uploadedImageUrls,
        provider,
        model,
        options,
      });

      if (result.success && result.userMessage && result.assistantMessage) {
        // Add messages to the list
        const newMessages = [...messages, result.userMessage, result.assistantMessage];
        onMessagesUpdate(newMessages);

        // Clear quoted images
        setQuotedImages([]);

        // Update chat title if this is the first message
        if (messages.length === 0 && content.length > 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          onChatTitleUpdate(chatId, title);
        }

        // Start streaming for the assistant message
        if (result.messageId) {
          startStreaming(result.assistantMessage.id, newMessages);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startStreaming = (messageId: string, currentMessages: Message[]) => {
    setStreamingMessageId(messageId);
    setStreamingContent('');
    setStreamingImages([]);

    const streamUrl = getMessageStreamUrl(messageId);
    console.log('[SSE] Starting stream:', streamUrl);

    // Use fetch-based SSE for better cross-origin cookie handling
    const abortController = new AbortController();

    fetch(streamUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: abortController.signal,
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        console.error('[SSE] Failed to connect:', response.status, text);
        onMessagesUpdate(
          currentMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: 'failed', error: `Connection failed: ${response.status}` }
              : msg
          )
        );
        setStreamingMessageId(null);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error('[SSE] No reader available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = 'message';

      const handleEvent = (eventType: string, data: any) => {
        console.log('[SSE] Processing event:', eventType, data?.type || '');

        // Use the type from data if available (backend includes it), otherwise use SSE event type
        const type = data?.type || eventType;

        switch (type) {
          case 'connected':
            console.log('[SSE] Connected, status:', data?.status);
            break;

          case 'text_delta':
            setStreamingContent((prev) => prev + (data.chunk || ''));
            break;

          case 'image_done':
            setStreamingImages((prev) => [
              ...prev,
              { url: data.url, storageKey: data.storageKey, type: 'generated' as const },
            ]);
            break;

          case 'complete':
            const finalImages = data.images || [];
            const finalContent = data.content || '';
            console.log('[SSE] Complete - content:', finalContent?.slice(0, 50), 'images:', finalImages?.length);

            onMessagesUpdate(
              currentMessages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      status: 'completed',
                      content: finalContent || msg.content,
                      images: finalImages.length > 0 ? finalImages : msg.images,
                    }
                  : msg
              )
            );

            setStreamingMessageId(null);
            setStreamingContent('');
            setStreamingImages([]);
            abortController.abort();
            break;

          case 'error':
            console.log('[SSE] Error:', data.error);
            onMessagesUpdate(
              currentMessages.map((msg) =>
                msg.id === messageId
                  ? { ...msg, status: 'failed', error: data.error }
                  : msg
              )
            );

            setStreamingMessageId(null);
            setStreamingContent('');
            setStreamingImages([]);
            abortController.abort();
            break;
        }
      };

      const processLine = (line: string) => {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            handleEvent(currentEventType, data);
          } catch (e) {
            console.warn('[SSE] Failed to parse data:', line.slice(6));
          }
          // Reset event type after processing data
          currentEventType = 'message';
        }
      };

      console.log('[SSE] Starting read loop');
      while (true) {
        const { done, value } = await reader.read();
        console.log('[SSE] Read chunk:', done, value?.length);
        if (done) {
          console.log('[SSE] Stream done');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('[SSE] Decoded chunk:', chunk.slice(0, 100));
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            console.log('[SSE] Processing line:', line.slice(0, 80));
          }
          processLine(line);
        }
      }
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        console.error('[SSE] Fetch error:', error);
        onMessagesUpdate(
          currentMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: 'failed', error: 'Network error' }
              : msg
          )
        );
      }
      setStreamingMessageId(null);
    });
  };

  // Determine display title
  const displayTitle = chatTitle || (messages.length > 0 ? messages[0].content?.slice(0, 30) || 'Chat' : 'New Chat');

  // Get current options summary for display
  const getOptionsSummary = () => {
    if (provider === 'openai') {
      const parts = [];
      if (openaiOptions.size !== 'auto') parts.push(openaiOptions.size);
      if (openaiOptions.quality !== 'medium') parts.push(openaiOptions.quality);
      if (openaiOptions.format !== 'png') parts.push(openaiOptions.format);
      if (openaiOptions.background !== 'opaque') parts.push('transparent');
      return parts.length > 0 ? parts.join(', ') : null;
    }
    if (provider === 'google') {
      const parts = [];
      if (googleOptions.aspectRatio !== '1:1') parts.push(googleOptions.aspectRatio);
      if (googleOptions.imageSize !== '1K') parts.push(googleOptions.imageSize);
      return parts.length > 0 ? parts.join(', ') : null;
    }
    return null;
  };

  const optionsSummary = getOptionsSummary();

  // Image options popover content
  const renderOptionsContent = () => {
    if (provider === 'openai') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Size</span>
            <Select value={openaiOptions.size} onValueChange={(v) => setOpenaiOptions({ ...openaiOptions, size: v as OpenAIImageOptions['size'] })}>
              <SelectTrigger className="h-8 w-auto min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="1024x1024">1024×1024</SelectItem>
                <SelectItem value="1536x1024">1536×1024</SelectItem>
                <SelectItem value="1024x1536">1024×1536</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Quality</span>
            <Select value={openaiOptions.quality} onValueChange={(v) => setOpenaiOptions({ ...openaiOptions, quality: v as OpenAIImageOptions['quality'] })}>
              <SelectTrigger className="h-8 w-auto min-w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Format</span>
            <Select value={openaiOptions.format} onValueChange={(v) => setOpenaiOptions({ ...openaiOptions, format: v as OpenAIImageOptions['format'] })}>
              <SelectTrigger className="h-8 w-auto min-w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Background</span>
            <Select value={openaiOptions.background} onValueChange={(v) => setOpenaiOptions({ ...openaiOptions, background: v as OpenAIImageOptions['background'] })}>
              <SelectTrigger className="h-8 w-auto min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opaque">Opaque</SelectItem>
                <SelectItem value="transparent">Transparent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (provider === 'google') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Aspect Ratio</span>
            <Select value={googleOptions.aspectRatio} onValueChange={(v) => setGoogleOptions({ ...googleOptions, aspectRatio: v as GoogleImageOptions['aspectRatio'] })}>
              <SelectTrigger className="h-8 w-auto min-w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="2:3">2:3</SelectItem>
                <SelectItem value="3:2">3:2</SelectItem>
                <SelectItem value="3:4">3:4</SelectItem>
                <SelectItem value="4:3">4:3</SelectItem>
                <SelectItem value="4:5">4:5</SelectItem>
                <SelectItem value="5:4">5:4</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="21:9">21:9</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Size</span>
            <Select value={googleOptions.imageSize} onValueChange={(v) => setGoogleOptions({ ...googleOptions, imageSize: v as GoogleImageOptions['imageSize'] })}>
              <SelectTrigger className="h-8 w-auto min-w-[60px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1K">1K</SelectItem>
                <SelectItem value="2K">2K</SelectItem>
                <SelectItem value="4K">4K</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar Header */}
      <div className="h-12 shrink-0 flex items-center justify-between gap-2 px-4 border-b bg-muted/50">
        <span className="font-medium text-sm truncate flex-shrink min-w-0">{displayTitle}</span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Provider selector */}
          <Select value={provider} onValueChange={(v) => handleProviderChange(v as Provider)} disabled={!hasAnyProvider}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai" disabled={!availableProviders.openai}>
                OpenAI{!availableProviders.openai && ' (N/A)'}
              </SelectItem>
              <SelectItem value="google" disabled={!availableProviders.google}>
                Google{!availableProviders.google && ' (N/A)'}
              </SelectItem>
              <SelectItem value="fal" disabled={!availableProviders.fal}>
                Fal.ai{!availableProviders.fal && ' (N/A)'}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Model selector */}
          <Select value={model} onValueChange={setModel} disabled={!isCurrentProviderAvailable}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_MODELS[provider].map((group, groupIndex) => (
                <div key={group.label}>
                  {groupIndex > 0 && <div className="h-px bg-border my-1" />}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                    {group.label}
                  </div>
                  {group.models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleMaximize}>
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 p-4">
        <ChatMessages
          messages={messages}
          streamingMessageId={streamingMessageId}
          streamingContent={streamingContent}
          streamingImages={streamingImages}
          onQuoteImage={handleQuoteImage}
        />
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t p-4">
        <ChatInput
          quotedImages={quotedImages}
          onRemoveQuotedImage={handleRemoveQuotedImage}
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={!isCurrentProviderAvailable}
          optionsButton={
            provider !== 'fal' && isCurrentProviderAvailable ? (
              <Popover open={showOptions} onOpenChange={setShowOptions}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={!isCurrentProviderAvailable}
                  >
                    <Settings2 className="h-4 w-4" />
                    {optionsSummary && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Image Options</h4>
                    {renderOptionsContent()}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null
          }
        />
      </div>
    </div>
  );
}
