'use client';

import { useMounted } from '@/hooks/use-mounted';
import { getRelativeTime, formatDate } from '@/lib/date-utils';

interface RelativeTimeProps {
  date: string | Date | number;
  className?: string;
}

/**
 * Client-only component that displays relative time (e.g., "2m ago").
 * Shows a static date during SSR and switches to relative time after hydration.
 * This prevents hydration mismatches caused by different server/client times.
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const mounted = useMounted();

  // During SSR and initial hydration, show a static date to avoid mismatch
  if (!mounted) {
    return <span className={className}>{formatDate(date, 'date')}</span>;
  }

  // After mounting, show relative time
  return <span className={className}>{getRelativeTime(date)}</span>;
}
