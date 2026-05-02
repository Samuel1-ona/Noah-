import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { error } from '../utils/response.js';

/**
 * Global Express error handler.
 * Maps known error patterns to structured API responses.
 * Ensures no stack traces or private data leak in production.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const msg = err.message || 'An unexpected error occurred';

  logger.error(`[Server] Unhandled error`, {
    path: req.path,
    method: req.method,
    error: msg,
    // Stack only logged server-side, never sent to client
    stack: err.stack,
  });

  // Map common blockchain / ethers errors to meaningful codes
  if (msg.includes('insufficient funds')) {
    error(res, 'Relayer wallet has insufficient funds for gas', 502, 'RELAYER_ERROR');
    return;
  }
  if (msg.includes('nonce') || msg.includes('replacement')) {
    error(res, 'Transaction nonce conflict — please retry', 502, 'RELAYER_ERROR');
    return;
  }
  if (msg.includes('revert')) {
    error(res, `Contract reverted: ${msg}`, 400, 'CONTRACT_ERROR');
    return;
  }
  if (msg.includes('not registered') || msg.includes('NOT_FOUND')) {
    error(res, msg, 404, 'NOT_FOUND');
    return;
  }

  error(res, process.env.NODE_ENV === 'production' ? 'Internal server error' : msg, 500, 'INTERNAL_ERROR');
}
