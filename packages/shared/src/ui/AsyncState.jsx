import { AlertCircle, Loader2, Inbox, RefreshCw } from 'lucide-react'
import { getErrorMessage, isRetryableError } from '../api/errors.js'

/**
 * Унифицированные состояния загрузки / ошибки / пусто / retry.
 */
export function AsyncState({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Нет данных',
  onRetry,
  className = '',
  children,
}) {
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 py-12 text-slate-500 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" aria-hidden />
        <p className="text-sm">Загрузка…</p>
      </div>
    )
  }

  if (error) {
    const msg = getErrorMessage(error)
    const canRetry = onRetry && isRetryableError(error)
    return (
      <div className={`rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 ${className}`}>
        <div className="flex items-start gap-2 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm whitespace-pre-line">{msg}</p>
        </div>
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500"
          >
            <RefreshCw className="w-4 h-4" /> Повторить
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 py-12 text-slate-500 ${className}`}>
        <Inbox className="w-10 h-10 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return children
}
