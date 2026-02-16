import pino from 'pino';

/**
 * Root pino logger — stdout-only, JSON in production, pretty-ish in dev.
 * No transports, no worker threads, just fast stdout JSON.
 */
const rootLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
});

export type Logger = pino.Logger;

/**
 * Create a child logger bound to a service name.
 *
 * Usage:
 *   const log = createLogger('Worker');
 *   log.info('Starting...');
 *   log.info({ taskId }, 'Processing task');
 *   log.error({ err }, 'Task failed');
 */
export function createLogger(service: string): Logger {
  return rootLogger.child({ service });
}

/**
 * Create a request-scoped child logger with requestId.
 *
 * Usage:
 *   const log = createRequestLogger('Backend', requestId);
 *   log.info('Handling request');
 */
export function createRequestLogger(service: string, requestId: string): Logger {
  return rootLogger.child({ service, requestId });
}

/**
 * Create a task-scoped child logger with taskId and optional requestId.
 *
 * Usage:
 *   const log = createTaskLogger('Worker', taskId, requestId);
 *   log.info('Processing task');
 */
export function createTaskLogger(service: string, taskId: string, requestId?: string): Logger {
  const bindings: Record<string, string> = { service, taskId };
  if (requestId) bindings.requestId = requestId;
  return rootLogger.child(bindings);
}
