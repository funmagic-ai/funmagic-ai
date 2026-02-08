'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { useUploadFiles } from '@better-upload/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, X, Loader2, ImagePlus } from 'lucide-react';
import type { MessageImage } from '@/actions/ai-studio';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/lib/upload-config';

interface QuotedImage {
  messageId: string;
  image: MessageImage;
}

interface UploadedImage {
  file: File;
  preview: string;
  uploadedUrl?: string;
}

interface ChatInputProps {
  quotedImages: QuotedImage[];
  onRemoveQuotedImage: (index: number) => void;
  onSend: (content: string, uploadedImageUrls?: string[]) => void;
  isLoading: boolean;
  disabled?: boolean;
  optionsButton?: ReactNode;
}

export function ChatInput({
  quotedImages,
  onRemoveQuotedImage,
  onSend,
  isLoading,
  disabled = false,
  optionsButton,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload: uploadToS3 } = useUploadFiles({
    route: 'ai-studio',
    api: '/api/admin/ai-studio/upload',
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = Array.from(files).slice(0, 5).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setUploadedImages(prev => [...prev, ...newImages].slice(0, 5));

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveUploadedImage = useCallback((index: number) => {
    setUploadedImages(prev => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isLoading || isUploading || disabled) return;

    let imageUrls: string[] = [];

    // Upload images if any
    if (uploadedImages.length > 0) {
      setIsUploading(true);
      try {
        const filesToUpload = uploadedImages.map(img => img.file);
        const uploadResult = await uploadToS3(filesToUpload);
        if (uploadResult.files.length > 0) {
          imageUrls = uploadResult.files.map(f => f.objectInfo.key);
        }
      } catch (error) {
        console.error('Failed to upload images:', error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSend(content, imageUrls.length > 0 ? imageUrls : undefined);
    setContent('');

    // Clear uploaded images
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
  }, [content, uploadedImages, onSend, isLoading, isUploading, disabled, uploadToS3]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isDisabled = disabled || isLoading || isUploading;

  return (
    <div className="space-y-3">
      {/* Quoted images preview */}
      {quotedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quotedImages.map((quoted, index) => (
            <QuotedImagePreview
              key={`${quoted.messageId}-${index}`}
              image={quoted.image}
              onRemove={() => onRemoveQuotedImage(index)}
            />
          ))}
        </div>
      )}

      {/* Uploaded images preview */}
      {uploadedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedImages.map((uploaded, index) => (
            <Card key={index} className="relative w-20 h-20 overflow-hidden group">
              <CardContent className="p-0 h-full">
                <Image
                  src={uploaded.preview}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover rounded"
                  sizes="80px"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveUploadedImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIME_TYPES}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Unified input box */}
      <div className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'No provider available' : 'Describe the image you want to generate...'}
          className="min-h-[80px] max-h-40 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-4 pb-12"
          disabled={isDisabled}
        />

        {/* Bottom toolbar inside the input box */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {/* Left side - Upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || uploadedImages.length >= 5}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          {/* Right side - Options + Send */}
          <div className="flex items-center gap-1">
            {optionsButton}

            <Button
              type="button"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSubmit}
              disabled={!content.trim() || isDisabled}
            >
              {isLoading || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuotedImagePreviewProps {
  image: MessageImage;
  onRemove: () => void;
}

function QuotedImagePreview({ image, onRemove }: QuotedImagePreviewProps) {
  // Use presigned URL if available, otherwise construct from storage key
  const imageUrl = image.url?.startsWith('http')
    ? image.url
    : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai-studio/assets/url?storageKey=${encodeURIComponent(image.storageKey)}`;

  // For quoted images we need to fetch the presigned URL dynamically
  // For now, if we have a full URL use it, otherwise show a placeholder
  const [loadedUrl, setLoadedUrl] = useState<string | null>(
    image.url?.startsWith('http') ? image.url : null
  );

  useEffect(() => {
    if (!image.url?.startsWith('http') && image.storageKey) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/ai-studio/assets/url?storageKey=${encodeURIComponent(image.storageKey)}`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => setLoadedUrl(data.url))
        .catch(() => setLoadedUrl(null));
    }
  }, [image.url, image.storageKey]);

  return (
    <Card className="relative w-20 h-20 overflow-hidden group">
      <CardContent className="p-0 h-full">
        {loadedUrl ? (
          <Image
            src={loadedUrl}
            alt="Quoted image"
            fill
            className="object-cover rounded"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        )}
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
