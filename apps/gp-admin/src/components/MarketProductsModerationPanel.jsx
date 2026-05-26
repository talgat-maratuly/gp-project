import { useCallback, useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { isDemoMode } from '@gp/shared/demo'
import { useLanguage } from '../i18n/LanguageContext'
import AdminEmptyState from './ui/AdminEmptyState'

export default function MarketProductsModerationPanel() {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [actingId, setActingId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (isDemoMode()) {
      setError(t('market_moderation_api_only'))
      setList([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await api.adminMarketProducts()
      setList(rows)
    } catch (e) {
      setError(e?.message || t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const moderate = async (id, isActive) => {
    setActingId(id)
    setError('')
    try {
      await api.adminModerateMarketProduct(id, { isActive })
      await load()
    } catch (e) {
      setError(e?.message || t('actionError'))
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">{t('product_moderation')}</h2>
      <p className="text-sm text-slate-400">{t('market_tab_moderation')}</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-slate-400 text-sm">{t('loading')}</p>}
      {!loading && !list.length && !error && <AdminEmptyState />}
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 p-3 flex flex-col sm:flex-row justify-between gap-2">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-xs text-slate-500">
                {p.store?.name} · {p.store?.status} · {Number(p.price)} ₸
              </p>
              <p className="text-xs">{p.isActive ? t('market_in_catalog') : t('market_hidden')}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {!p.isActive && (
                <button
                  type="button"
                  disabled={actingId === p.id}
                  className="text-xs px-3 py-2 min-h-[40px] rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                  onClick={() => moderate(p.id, true)}
                >
                  {actingId === p.id ? '…' : t('market_product_approve')}
                </button>
              )}
              {p.isActive && (
                <button
                  type="button"
                  disabled={actingId === p.id}
                  className="text-xs px-3 py-2 min-h-[40px] rounded-lg bg-amber-600 text-white disabled:opacity-50"
                  onClick={() => moderate(p.id, false)}
                >
                  {actingId === p.id ? '…' : t('market_product_hide')}
                </button>
              )}
              {!p.isActive && p.store?.status !== 'APPROVED' && (
                <span className="text-[10px] text-amber-400">{t('market_approve_store_first')}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
