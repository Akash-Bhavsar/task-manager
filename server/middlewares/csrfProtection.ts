import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Reject state-changing requests whose Origin (or Referer) isn't in the
 * allowlist. CORS only withholds *response* headers — the request still
 * executes. This middleware blocks the request itself, closing the CSRF
 * window for "simple" requests (form POSTs) that skip preflight.
 */
export function csrfProtection(
  allowedOrigins: string[],
  originRegex: RegExp | null,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Derive the origin to check: prefer Origin, fall back to Referer's origin.
    let requestOrigin: string | undefined;
    if (typeof origin === 'string' && origin) {
      requestOrigin = origin;
    } else if (typeof referer === 'string' && referer) {
      try {
        const url = new URL(referer);
        requestOrigin = url.origin;
      } catch {
        // malformed Referer — treat as missing
      }
    }

    // No origin info at all: only same-origin or non-browser clients (curl,
    // server-to-server) omit both headers. Allow these — they can't be CSRF
    // because browsers always send Origin on cross-origin POST/PUT/DELETE.
    if (!requestOrigin) {
      next();
      return;
    }

    if (
      allowedOrigins.includes(requestOrigin) ||
      originRegex?.test(requestOrigin)
    ) {
      next();
      return;
    }

    logger.warn(`CSRF blocked: origin=${requestOrigin} method=${req.method} url=${req.originalUrl}`);
    res.status(403).json({ error: 'Forbidden: origin not allowed' });
  };
}
