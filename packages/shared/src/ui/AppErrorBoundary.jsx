import { Component } from 'react'

const defaultLabels = {
  title: 'Что-то пошло не так',
  hint: 'Обновите страницу или вернитесь на главную.',
  retry: 'Обновить',
  home: 'На главную',
}

/**
 * Ловит runtime-ошибки React — вместо белого экрана показывает fallback.
 */
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.DEV) {
      console.error('[GP ErrorBoundary]', error, info)
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const labels = { ...defaultLabels, ...this.props.labels }
    const homeHref = this.props.homeHref || '/'

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{
          background: 'var(--gp-bg, #0f172a)',
          color: 'var(--gp-text, #f1f5f9)',
        }}
      >
        <h1 className="text-lg font-bold mb-2">{labels.title}</h1>
        <p className="text-sm opacity-80 mb-6 max-w-md">{labels.hint}</p>
        {import.meta.env?.DEV && (
          <pre className="text-left text-xs opacity-60 mb-6 max-w-lg overflow-auto p-3 rounded-lg bg-black/20">
            {String(error?.message || error)}
          </pre>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm min-h-[44px]"
            onClick={() => window.location.reload()}
          >
            {labels.retry}
          </button>
          <a
            href={homeHref}
            className="px-5 py-2.5 rounded-xl border border-white/20 font-semibold text-sm min-h-[44px] inline-flex items-center"
          >
            {labels.home}
          </a>
        </div>
      </div>
    )
  }
}
