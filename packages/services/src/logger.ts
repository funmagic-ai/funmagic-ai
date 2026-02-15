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
