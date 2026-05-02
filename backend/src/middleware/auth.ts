import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { config } from '../config/index.js';
import { error } from '../utils/response.js';

/**
 * Validates the X-API-Key header using a constant-time comparison
 * to prevent timing-based key oracle attacks.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const submitted = req.headers['x-api-key'];
  if (!submitted || typeof submitted !== 'string') {
    error(res, 'Missing X-API-Key header', 401, 'AUTH_ERROR');
    return;
  }

  try {
    const expected = Buffer.from(config.apiKey, 'utf8');
    const actual = Buffer.from(submitted, 'utf8');

    // Pad to same length before comparison to avoid length leakage
    const paddedActual = Buffer.alloc(expected.length, 0);
    actual.copy(paddedActual, 0, 0, Math.min(actual.length, expected.length));

    if (actual.length !== expected.length || !timingSafeEqual(expected, paddedActual)) {
      error(res, 'Invalid API key', 401, 'AUTH_ERROR');
      return;
    }
  } catch {
    error(res, 'Invalid API key', 401, 'AUTH_ERROR');
    return;
  }

  next();
}
