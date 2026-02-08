'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Quote, Download, Maximize2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageImage } from '@/actions/ai-studio';

interface MessageImagesProps {
  messageId: string;
  images: MessageImage[];
  onQuote: (image: MessageImage) => void;
}

// Dynamic grid classes based on image count
function getGridClasses(count: number) {
  if (count === 1) return 'grid-cols-1 max-w-sm';
  if (count === 2) return 'grid-cols-2';
  return 'grid-cols-2 sm:grid-cols-3';
}

export function MessageImages({ messageId, images, onQuote }: MessageImagesProps) {
  return (
    <div className={cn('grid gap-2', getGridClasses(images.length))}>
      {images.map((image, index) => (
        <ImageCard
          key={`${messageId}-${index}`}
          image={image}
          onQuote={() => onQuote(image)}
        />
      ))}
    </div>
  );
}

interface ImageCardProps {
  image: MessageImage;
  onQuote: () => void;
}

/**
 * Fetch presigned URL for a storage key
 */
async function fetchPresignedUrl(storageKey: string): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(
    `${apiUrl}/api/admin/ai-studio/assets/url?storageKey=${encodeURIComponent(storageKey)}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch presigned URL');
  }

  const data = await response.json();
  return data.url;
}

function ImageCard({ image, onQuote }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If URL already starts with http (presigned URL from streaming), use it directly
    if (image.url?.startsWith('http')) {
      setImageUrl(image.url);
      setIsLoading(false);
      return;
    }

    // Fetch presigned URL from storage key
    const storageKey = image.storageKey || image.url;

    if (!storageKey) {
      setError('No storage key available');
      setIsLoading(false);
      return;
    }

    fetchPresignedUrl(storageKey)
      .then((url) => {
        setImageUrl(url);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch presigned URL:', err);
        setError('Failed to load image');
        setIsLoading(false);
      });
  }, [image.url, image.storageKey]);

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-muted min-h-[150px] max-h-[300px] aspect-[4/3]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {imageUrl && !error && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt="Generated image"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* Hover overlay with actions */}
      {isHovered && imageUrl && !error && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={onQuote}
            title="Quote this image"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                title="View full size"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <div className="relative aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={onQuote}>
                  <Quote className="mr-2 h-4 w-4" />
                  Quote
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
