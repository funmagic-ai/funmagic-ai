// Aspect ratio constants matching funmagic-web homepage
export const IMAGE_RATIOS = {
  BANNER: { width: 21, height: 9, label: '21:9 (Banner)' },
  THUMBNAIL: { width: 16, height: 9, label: '16:9 (Thumbnail)' },
} as const;

export type ImageRatioType = keyof typeof IMAGE_RATIOS;

// Recommended minimum dimensions
export const RECOMMENDED_DIMENSIONS = {
  BANNER: { width: 1260, height: 540 },
  THUMBNAIL: { width: 640, height: 360 },
} as const;

// Tolerance for ratio matching
export const RATIO_TOLERANCE = {
  PERFECT: 0.05, // 5% variance - perfect match
  CLOSE: 0.1, // 10% variance - close match
} as const;

export type RatioStatus = 'perfect' | 'close' | 'mismatch';

export interface RatioCheckResult {
  status: RatioStatus;
  actualRatio: number;
  expectedRatio: number;
  deviation: number;
  message: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get image dimensions from a URL
 * Note: For blob URLs (local file previews), crossOrigin is not needed.
 * For S3 URLs, we skip crossOrigin to avoid CORS issues since we only need dimensions.
 */
export function getImageDimensionsFromUrl(url: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image from URL'));
    };

    img.src = url;
  });
}

/**
 * Get the ratio value for a given type
 */
export function getRatioValue(type: ImageRatioType): number {
  const ratio = IMAGE_RATIOS[type];
  return ratio.width / ratio.height;
}

/**
 * Format a ratio as a string (e.g., "16:9")
 */
export function formatRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);

  // For very complex ratios, just show the decimal
  if (w > 100 || h > 100) {
    return (width / height).toFixed(2);
  }

  return `${w}:${h}`;
}

/**
 * Check if image dimensions match the expected aspect ratio
 */
export function checkAspectRatio(
  width: number,
  height: number,
  type: ImageRatioType
): RatioCheckResult {
  const actualRatio = width / height;
  const expectedRatio = getRatioValue(type);
  const deviation = Math.abs(actualRatio - expectedRatio) / expectedRatio;

  let status: RatioStatus;
  let message: string;

  if (deviation <= RATIO_TOLERANCE.PERFECT) {
    status = 'perfect';
    message = 'Image matches the expected aspect ratio';
  } else if (deviation <= RATIO_TOLERANCE.CLOSE) {
    status = 'close';
    message = 'Image is close to the expected ratio, minor cropping may occur';
  } else {
    status = 'mismatch';
    message = 'Image will be cropped to fit the expected aspect ratio';
  }

  return {
    status,
    actualRatio,
    expectedRatio,
    deviation,
    message,
  };
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: RatioStatus): {
  border: string;
  text: string;
  bg: string;
} {
  switch (status) {
    case 'perfect':
      return {
        border: 'border-green-500',
        text: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-950',
      };
    case 'close':
      return {
        border: 'border-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-950',
      };
    case 'mismatch':
      return {
        border: 'border-red-500',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950',
      };
  }
}

/**
 * Get status icon indicator
 */
export function getStatusIndicator(status: RatioStatus): string {
  switch (status) {
    case 'perfect':
      return '✓';
    case 'close':
      return '⚠';
    case 'mismatch':
      return '✗';
  }
}
