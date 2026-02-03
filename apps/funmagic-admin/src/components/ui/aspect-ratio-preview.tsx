'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type ImageRatioType,
  type RatioCheckResult,
  type ImageDimensions,
  IMAGE_RATIOS,
  RECOMMENDED_DIMENSIONS,
  checkAspectRatio,
  formatRatio,
  getImageDimensionsFromUrl,
  getStatusColor,
  getStatusIndicator,
  getRatioValue,
} from '@/lib/image-ratio';
import { Trash2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface AspectRatioPreviewProps {
  imageUrl: string;
  ratioType: ImageRatioType;
  onRemove?: () => void;
  className?: string;
  showSideBannerNote?: boolean;
}

export function AspectRatioPreview({
  imageUrl,
  ratioType,
  onRemove,
  className,
  showSideBannerNote,
}: AspectRatioPreviewProps) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [ratioCheck, setRatioCheck] = useState<RatioCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    getImageDimensionsFromUrl(imageUrl)
      .then((dims) => {
        setDimensions(dims);
        setRatioCheck(checkAspectRatio(dims.width, dims.height, ratioType));
        setError(null);
      })
      .catch(() => {
        setError('Failed to load image');
        setDimensions(null);
        setRatioCheck(null);
      });
  }, [imageUrl, ratioType]);

  const ratio = IMAGE_RATIOS[ratioType];
  const recommended = RECOMMENDED_DIMENSIONS[ratioType];
  const aspectRatioValue = getRatioValue(ratioType);

  const statusColors = ratioCheck ? getStatusColor(ratioCheck.status) : null;
  const StatusIcon =
    ratioCheck?.status === 'perfect'
      ? CheckCircle2
      : ratioCheck?.status === 'close'
        ? AlertTriangle
        : AlertCircle;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Preview container with target aspect ratio */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2',
          statusColors?.border ?? 'border-muted'
        )}
        style={{ aspectRatio: `${ratio.width}/${ratio.height}` }}
      >
        <img
          src={imageUrl}
          alt="Preview"
          className="h-full w-full object-cover"
        />

        {/* Remove button */}
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dimension info and status */}
      <div
        className={cn(
          'rounded-md p-3 text-sm',
          statusColors?.bg ?? 'bg-muted'
        )}
      >
        {error ? (
          <p className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        ) : dimensions && ratioCheck ? (
          <div className="space-y-1.5">
            {/* Status indicator */}
            <div className={cn('flex items-center gap-2 font-medium', statusColors?.text)}>
              <StatusIcon className="h-4 w-4" />
              <span>
                {getStatusIndicator(ratioCheck.status)}{' '}
                {ratioCheck.status === 'perfect'
                  ? 'Perfect match'
                  : ratioCheck.status === 'close'
                    ? 'Close match'
                    : 'Ratio mismatch'}
              </span>
            </div>

            {/* Dimensions */}
            <div className="text-muted-foreground space-y-0.5">
              <p>
                <span className="font-medium">Detected:</span> {dimensions.width}×
                {dimensions.height} ({formatRatio(dimensions.width, dimensions.height)})
              </p>
              <p>
                <span className="font-medium">Expected:</span> {ratio.label}
              </p>
              {ratioCheck.status !== 'perfect' && (
                <p className={statusColors?.text}>{ratioCheck.message}</p>
              )}
            </div>

            {/* Side banner note */}
            {showSideBannerNote && (
              <p className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                Side banners may be cropped on desktop. Center important content.
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Loading image info...</p>
        )}
      </div>

      {/* Recommended dimensions helper */}
      <p className="text-muted-foreground text-xs">
        Recommended: {recommended.width}×{recommended.height}px or larger ({ratio.label})
      </p>
    </div>
  );
}
