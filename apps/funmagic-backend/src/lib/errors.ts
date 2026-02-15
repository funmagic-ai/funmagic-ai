import { AppError, ERROR_CODES, type ErrorCode } from '@funmagic/shared';

const NOT_FOUND_MAP: Record<string, ErrorCode> = {
  tool: ERROR_CODES.TOOL_NOT_FOUND,
  'tool type': ERROR_CODES.TOOL_TYPE_NOT_FOUND,
  task: ERROR_CODES.TASK_NOT_FOUND,
  asset: ERROR_CODES.ASSET_NOT_FOUND,
  banner: ERROR_CODES.BANNER_NOT_FOUND,
  provider: ERROR_CODES.PROVIDER_NOT_FOUND,
  package: ERROR_CODES.PACKAGE_NOT_FOUND,
  user: ERROR_CODES.USER_NOT_FOUND,
  chat: ERROR_CODES.CHAT_NOT_FOUND,
  message: ERROR_CODES.MESSAGE_NOT_FOUND,
};

export function notFound(resource: string): AppError {
  const key = resource.toLowerCase();
  const code = NOT_FOUND_MAP[key] ?? ERROR_CODES.NOT_FOUND;
  return new AppError({
    code,
    message: `${resource} not found`,
    statusCode: 404,
  });
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError({
    code: ERROR_CODES.ASSET_FORBIDDEN,
    message,
    statusCode: 403,
  });
}

export function conflict(code: ErrorCode, message: string): AppError {
  return new AppError({ code, message, statusCode: 409 });
}

export function badRequest(code: ErrorCode, message: string, details?: Record<string, unknown>): AppError {
  return new AppError({ code, message, statusCode: 400, details });
}
