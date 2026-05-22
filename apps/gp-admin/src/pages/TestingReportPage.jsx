import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const EMPTY = {
  summary: { totalTests: 0, passed: 0, failed: 0, warnings: 0, systemStatus: 'unknown' },
  modules: [],
  errors: [],
  metrics: {},
}

export default function TestingReportPage() {
  const { t } = useLanguage()
  const [report, setReport] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/qa-report.json?t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setReport(data)
    } catch (e) {
      setLoadError(e.message)
      setReport(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const s = report?.summary || EMPTY.summary
  const statusColor =
    s.systemStatus === 'healthy' ? 'text-emerald-400'
    : s.systemStatus === 'degraded' ? 'text-amber-400'
    : 'text-red-400'

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('qa_title')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {report?.runAt
              ? `${t('qa_last_run')}: ${new Date(report.runAt).toLocaleString('ru-RU')}`
              : t('qa_no_report')}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('qa_refresh')}
        </button>
      </div>

      {loadError && (
        <div className="mb-4 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
          {t('qa_report_missing')}: {loadError}. {t('qa_run_hint')}: <code className="font-mono">npm run qa:full</code>
        </div>
      )}

      {report?.note && (
        <p className="text-xs text-slate-500 mb-4">{report.note}</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('qa_total_tests')} value={s.totalTests} />
        <StatCard label={t('qa_passed')} value={s.passed} icon={<CheckCircle className="w-5 h-5 text-emerald-400" />} />
        <StatCard label={t('qa_failed')} value={s.failed} icon={<XCircle className="w-5 h-5 text-red-400" />} />
        <StatCard label={t('qa_warnings')} value={s.warnings} icon={<AlertTriangle className="w-5 h-5 text-amber-400" />} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label={t('qa_system_status')} value={s.systemStatus} className={statusColor} />
        <StatCard label={t('qa_success_rate')} value={`${s.successRate ?? 0}%`} />
        <StatCard label={t('qa_avg_api')} value={s.avgApiResponseMs ?? '—'} />
        <StatCard label={t('qa_server')} value={report?.metrics?.apiReachable ? t('qa_online') : t('qa_offline')} />
        <StatCard label="Hunter" value={report?.metrics?.hunterCreated ?? 0} />
        <StatCard label="Furniture" value={report?.metrics?.furnitureCreated ?? 0} />
        <StatCard label="Market" value={report?.metrics?.marketOrdersCreated ?? 0} />
        <StatCard label={t('qa_test_users')} value={report?.metrics?.testUsersGenerated ?? 0} />
        <StatCard label={t('qa_partners_gen')} value={report?.metrics?.partnersGenerated ?? 0} />
        <StatCard label="Duration" value={report?.durationMs ? `${(report.durationMs / 1000).toFixed(1)}s` : '—'} />
      </div>

      {report?.e2e && (
        <div className="mb-6 p-4 rounded-xl border border-sky-500/30 bg-sky-500/10">
          <h2 className="text-sm font-bold text-sky-300 mb-2">{t('qa_e2e_section')}</h2>
          <p className="text-sm text-slate-300">
            {report.e2e.passed}/{report.e2e.totalTests} passed ({report.e2e.successRate}%)
          </p>
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">{t('qa_modules')}</h2>
      <div className="overflow-x-auto rounded-xl border border-white/10 mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="text-left p-3">Module</th>
              <th className="text-right p-3">Tests</th>
              <th className="text-right p-3">Passed</th>
              <th className="text-right p-3">Failed</th>
              <th className="text-right p-3">Warnings</th>
              <th className="text-right p-3">Avg Response (ms)</th>
            </tr>
          </thead>
          <tbody>
            {(report?.modules || []).map((m) => (
              <tr key={m.module} className="border-t border-white/5">
                <td className="p-3 font-medium">{m.module}</td>
                <td className="p-3 text-right">{m.tests}</td>
                <td className="p-3 text-right text-emerald-400">{m.passed}</td>
                <td className="p-3 text-right text-red-400">{m.failed}</td>
                <td className="p-3 text-right text-amber-400">{m.warnings}</td>
                <td className="p-3 text-right">{m.avgResponseTimeMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-bold mb-3">{t('qa_errors')} ({report?.errors?.length || 0})</h2>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {(report?.errors || []).slice(0, 50).map((e, i) => (
              <li key={i} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs">
                <p className="font-bold text-red-300">[{e.module}] {e.test}</p>
                <p className="text-slate-400 mt-1">{e.message}</p>
              </li>
            ))}
            {!report?.errors?.length && <li className="text-slate-500 text-sm">{t('qa_no_errors')}</li>}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-3">{t('qa_slow_api')}</h2>
          <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
            {(report?.slowApis || []).map((a, i) => (
              <li key={i} className="flex justify-between text-slate-400">
                <span>{a.method} {a.path}</span>
                <span className="text-amber-400">{a.ms} ms</span>
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-bold mb-3 mt-6">{t('qa_logs')}</h2>
          <ul className="text-xs text-slate-500 space-y-1 font-mono">
            <li>qa-logs/test-run.log</li>
            <li>qa-logs/api-requests.json</li>
            <li>qa-logs/playwright-report.json</li>
            <li>apps/gp-admin/public/qa-report.json</li>
          </ul>
          <p className="text-xs text-slate-500 mt-4">
            <code className="bg-slate-800 px-1 rounded">npm run qa:full</code>
            {' · '}
            <code className="bg-slate-800 px-1 rounded">npm run qa:e2e</code>
          </p>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, className = '' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${className}`}>
        {icon}
        {value}
      </p>
    </div>
  )
}
