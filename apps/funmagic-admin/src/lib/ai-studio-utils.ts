// Client-side utility functions for AI Studio

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get the SSE stream URL for a message
 */
export function getMessageStreamUrl(messageId: string): string {
  return `${baseUrl}/api/admin/ai-studio/messages/${messageId}/stream`;
}
