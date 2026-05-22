/** Централизованные ошибки API для всех GP фронтендов */

export const API_ERROR_CODES = {
  NETWORK: 'NETWORK',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  PARSE: 'PARSE',
  UNKNOWN: 'UNKNOWN',
}

export class ApiError extends Error {
  constructor(message, { code = API_ERROR_CODES.UNKNOWN, status = 0, details = null, retryable = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
    this.retryable = retryable
  }
}

export function codeFromStatus(status) {
  if (status === 401) return API_ERROR_CODES.UNAUTHORIZED
  if (status === 403) return API_ERROR_CODES.FORBIDDEN
  if (status === 404) return API_ERROR_CODES.NOT_FOUND
  if (status === 400 || status === 422) return API_ERROR_CODES.VALIDATION
  if (status >= 500) return API_ERROR_CODES.SERVER
  return API_ERROR_CODES.UNKNOWN
}

export function isRetryableError(err) {
  if (err instanceof ApiError) return err.retryable || err.code === API_ERROR_CODES.NETWORK || err.code === API_ERROR_CODES.SERVER
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('failed to fetch') || msg.includes('недоступен') || msg.includes('подключиться')
}

export function getErrorMessage(err, fallback = 'Произошла ошибка') {
  if (err instanceof ApiError) return err.message
  if (err?.message) return err.message
  return fallback
}

export function toApiError(err, { status = 0, data = null } = {}) {
  if (err instanceof ApiError) return err
  const message = typeof err?.message === 'string' ? err.message : 'Произошла ошибка'
  const lower = message.toLowerCase()
  if (lower.includes('failed to fetch') || lower.includes('подключиться к api')) {
    return new ApiError(message, { code: API_ERROR_CODES.NETWORK, status, retryable: true })
  }
  return new ApiError(message, {
    code: codeFromStatus(status),
    status,
    details: data,
    retryable: status >= 500 || status === 0,
  })
}

export function parseApiErrorBody(data, status) {
  const prismaHint = [data?.message, data?.error, ...(Array.isArray(data?.message) ? data.message : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (
    prismaHint.includes('prisma') ||
    prismaHint.includes('database') ||
    prismaHint.includes('p1001') ||
    prismaHint.includes('postgresql')
  ) {
    return new ApiError('Ошибка базы данных. Проверьте PostgreSQL и миграции.', {
      code: API_ERROR_CODES.SERVER,
      status,
      retryable: true,
    })
  }
  let message
  if (Array.isArray(data?.message)) message = data.message.join(', ')
  else if (typeof data?.message === 'string') message = data.message
  else if (status === 401) message = 'Войдите в аккаунт'
  else if (status === 403) message = 'Недостаточно прав для этого действия'
  else if (status === 502 || status === 503) message = 'API временно недоступен'
  else message = data?.error || `Ошибка API (${status})`

  return new ApiError(message, {
    code: codeFromStatus(status),
    status,
    details: data,
    retryable: status >= 500,
  })
}

export function formatConnectionError(url) {
  return new ApiError(
    [
      `Не удалось подключиться к API (${url}).`,
      'API не запущен → npm run dev:api:safe',
      'Порт 4000 занят → npm run kill:ports',
    ].join('\n'),
    { code: API_ERROR_CODES.NETWORK, retryable: true },
  )
}
