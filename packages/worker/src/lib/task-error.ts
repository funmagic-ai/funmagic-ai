import type { ErrorCode } from '@funmagic/shared';

/**
 * Structured error for task workers.
 *
 * `code`    – a value from ERROR_CODES, used by the frontend to show a
 *             localized, user-friendly message.
 * `message` – the original technical detail, logged server-side for debugging.
 */
export class TaskError extends Error {
  public readonly code: ErrorCode;

  constructor(code: ErrorCode, technicalMessage: string) {
    super(technicalMessage);
    this.name = 'TaskError';
    this.code = code;
  }
}
