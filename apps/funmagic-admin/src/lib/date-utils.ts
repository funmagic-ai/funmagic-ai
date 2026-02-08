/**
 * Date formatting utilities with consistent timezone handling.
 * Uses UTC timezone to ensure identical output on server and client,
 * preventing hydration mismatches.
 */

export type DateFormat = 'date' | 'time' | 'datetime';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
};

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  ...TIME_OPTIONS,
};

/**
 * Format a date with consistent timezone handling.
 * Uses UTC timezone to ensure server and client render the same output.
 *
 * @param date - Date string, Date object, or timestamp
 * @param format - Output format: 'date', 'time', or 'datetime'
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number,
  format: DateFormat = 'date'
): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const options =
    format === 'date'
      ? DATE_OPTIONS
      : format === 'time'
        ? TIME_OPTIONS
        : DATETIME_OPTIONS;

  return d.toLocaleString('en-US', options);
}

/**
 * Format a date for display in a table or list (short format).
 * Uses UTC timezone for consistency.
 */
export function formatShortDate(date: string | Date | number): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Calculate relative time from a date.
 * This should only be used in client components after mounting
 * to avoid hydration mismatches.
 */
export function getRelativeTime(date: string | Date | number): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';

  return formatDate(d, 'date');
}
