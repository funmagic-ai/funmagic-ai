import { createMiddleware } from 'hono/factory';
import { createLogger } from '@funmagic/services';
import type { Logger } from '@funmagic/services';

const log = createLogger('Backend');

/**
 * Request ID middleware — assigns a unique requestId to every HTTP request.
 *
 * - Checks for an incoming `X-Request-Id` header (allows frontend-initiated traces)
 * - Falls back to `crypto.randomUUID()`
 * - Stores in Hono context as `requestId` and `requestLogger`
 * - Adds `X-Request-Id` response header
 */
export const requestId = createMiddleware<{
  Variables: {
    requestId: string;
    requestLogger: Logger;
  };
}>(async (c, next) => {
  const id = c.req.header('X-Request-Id') || crypto.randomUUID();
  const requestLogger = log.child({ requestId: id });

  c.set('requestId', id);
  c.set('requestLogger', requestLogger);
  c.header('X-Request-Id', id);

  await next();
});
