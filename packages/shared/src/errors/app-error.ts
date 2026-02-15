import type { ErrorCode } from './codes';

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  cause?: unknown;
  details?: Record<string, unknown>;
}

/**
 * Structured application error.
 * - `code` is sent to the client for programmatic handling
 * - `message` is sent to the client as a human-readable fallback
 * - `details` and `cause` are for server-side logging only
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details;
  }

  /** Safe serialization for HTTP responses — never includes details or stack */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}
