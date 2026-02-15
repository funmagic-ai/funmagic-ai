import { createMiddleware } from 'hono/factory';

/**
 * Security headers middleware.
 * Adds standard security headers to all responses.
 */
export const securityHeaders = createMiddleware(async (c, next) => {
  await next();

  // Prevent MIME-type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');

  // Enable XSS protection (legacy browsers)
  c.header('X-XSS-Protection', '1; mode=block');

  // Prevent referrer leakage
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Only send HSTS in production (avoids localhost issues in dev)
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
});
