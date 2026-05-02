import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { error } from '../utils/response.js';

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure it responds with a structured 400 error including the first invalid field.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = (result.error as ZodError).issues[0];
      const field = firstIssue?.path.join('.') || 'body';
      const message = firstIssue?.message || 'Validation failed';
      error(res, message, 400, 'VALIDATION_ERROR', field);
      return;
    }
    req.body = result.data;
    next();
  };
}
