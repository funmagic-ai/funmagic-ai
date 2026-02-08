'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

// Types
export interface Chat {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageImage {
  storageKey: string;
  type?: 'generated' | 'uploaded' | 'quoted';
  // Legacy field for backwards compatibility during streaming
  url?: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string | null;
  quotedImageIds: string[] | null;
  provider: string | null;
  model: string | null;
  images: MessageImage[] | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface TaskStatus {
  id: string;
  status: string;
  progress: string | null;
  result: {
    images?: MessageImage[];
    text?: string;
  } | null;
  error: string | null;
}

// Image generation options
// Note: imageModel is NOT a valid parameter for the image_generation tool
// OpenAI automatically selects the appropriate image model (gpt-image-1.5)
export interface OpenAIImageOptions {
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  quality?: 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
  background?: 'transparent' | 'opaque';
}

export interface GoogleImageOptions {
  aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  imageSize?: '1K' | '2K' | '4K';
}

export interface ImageGenerationOptions {
  openai?: OpenAIImageOptions;
  google?: GoogleImageOptions;
}

export interface SendMessageInput {
  chatId: string;
  content: string;
  quotedImageIds?: string[];
  uploadedImageUrls?: string[];
  provider: 'openai' | 'google' | 'fal';
  model?: string;
  options?: ImageGenerationOptions;
}

export interface SendMessageResult {
  success: boolean;
  userMessage?: Message;
  assistantMessage?: Message;
  messageId?: string; // ID of the assistant message with the job
  error?: string;
}

// Chat CRUD

export async function getChats(): Promise<Chat[]> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/chats`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to get chats:', res.status);
      return [];
    }

    const data = (await res.json()) as { chats: Chat[] };
    return data.chats;
  } catch (error) {
    console.error('Failed to get chats:', error);
    return [];
  }
}

export async function createChat(title?: string): Promise<{ chatId: string } | null> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      console.error('Failed to create chat:', res.status);
      return null;
    }

    const data = (await res.json()) as { chat: Chat };
    revalidatePath('/dashboard/ai-studio');
    return { chatId: data.chat.id };
  } catch (error) {
    console.error('Failed to create chat:', error);
    return null;
  }
}

export async function getChat(chatId: string): Promise<{ chat: Chat; messages: Message[] } | null> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/chats/${chatId}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to get chat:', res.status);
      return null;
    }

    const data = (await res.json()) as { chat: Chat; messages: Message[] };
    return data;
  } catch (error) {
    console.error('Failed to get chat:', error);
    return null;
  }
}

export async function deleteChat(chatId: string): Promise<boolean> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/chats/${chatId}`, {
      method: 'DELETE',
      headers: { cookie: cookieHeader },
    });

    if (!res.ok) {
      console.error('Failed to delete chat:', res.status);
      return false;
    }

    // Note: We don't call revalidatePath here because:
    // 1. Client-side state is updated via handleDeleteChat
    // 2. The redirect happens client-side before any refetch
    // 3. Calling revalidatePath would trigger a refetch on chat/[id] pages,
    //    which would fail with 404 for the deleted chat
    return true;
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return false;
  }
}

// Messages

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/chats/${input.chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        content: input.content,
        quotedImageIds: input.quotedImageIds,
        uploadedImageUrls: input.uploadedImageUrls,
        provider: input.provider,
        model: input.model,
        options: input.options,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to send message' }));
      return { success: false, error: error.error ?? 'Failed to send message' };
    }

    const data = (await res.json()) as {
      userMessage: Message;
      assistantMessage: Message;
    };

    return {
      success: true,
      userMessage: data.userMessage,
      assistantMessage: data.assistantMessage,
      messageId: data.assistantMessage.id,
    };
  } catch (error) {
    console.error('Failed to send message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

// Providers

export interface AvailableProviders {
  openai: boolean;
  google: boolean;
  fal: boolean;
}

export async function getAvailableProviders(): Promise<AvailableProviders> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/providers`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to get available providers:', res.status);
      return { openai: false, google: false, fal: false };
    }

    const data = (await res.json()) as { providers: AvailableProviders };
    return data.providers;
  } catch (error) {
    console.error('Failed to get available providers:', error);
    return { openai: false, google: false, fal: false };
  }
}

// Message Status

export async function getMessageStatus(messageId: string): Promise<TaskStatus | null> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/ai-studio/messages/${messageId}/status`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to get message status:', res.status);
      return null;
    }

    const data = (await res.json()) as { message: TaskStatus };
    return data.message;
  } catch (error) {
    console.error('Failed to get message status:', error);
    return null;
  }
}

// Legacy alias for backwards compatibility
export const getTaskStatus = getMessageStatus;

