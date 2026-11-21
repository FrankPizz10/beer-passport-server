// Error model for the /api/v1 discovery endpoints (API_CONTRACT.md).
// New endpoints only: the body is { error: { code, message } } with a stable
// machine-readable code. Existing unversioned endpoints keep the Phase 0
// { message } shape and are untouched. Auth failures (401/403) are produced
// by the Phase 0 middleware before these handlers run, not by this helper.
import { Response } from 'express';

export type ApiErrorCode =
  | 'invalid_parameter'
  | 'unauthenticated'
  | 'unauthorized'
  | 'not_found'
  | 'internal_error';

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const invalidParameter = (message: string) => new ApiError(400, 'invalid_parameter', message);
export const notFound = (message: string) => new ApiError(404, 'not_found', message);

export const sendError = (res: Response, err: unknown) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  // Never leak a stack trace or a Prisma error message to the client.
  console.error('Discovery handler error', err);
  return res
    .status(500)
    .json({ error: { code: 'internal_error', message: 'Internal server error.' } });
};
