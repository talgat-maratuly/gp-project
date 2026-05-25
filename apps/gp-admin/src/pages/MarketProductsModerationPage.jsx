import { useCallback, useEffect, useState } from 'react'
import { api } from '@gp/shared/api'
import { isDemoMode } from '@gp/shared/demo'

export default function MarketProductsModerationPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (isDemoMode()) {
      setError('Модерация товаров Market доступна в API-режиме')
      setList([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await api.adminMarketProducts()
      setList(rows)
    } catch (e) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const moderate = async (id, isActive) => {
    setLoading(true)
    try {
      await api.adminModerateMarketProduct(id, { isActive })
      await load()
    } catch (e) {
      setError(e?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Модерация товаров GP Market</h1>
      <p className="text-sm text-slate-400">После одобрения товар виден в GP Service / Shop</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-slate-400 text-sm">Загрузка…</p>}
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/10 p-3 flex justify-between gap-2">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-xs text-slate-500">
                {p.store?.name} · магазин: {p.store?.status} · {Number(p.price)} ₸
              </p>
              <p className="text-xs">{p.isActive ? 'В каталоге' : 'Скрыт'}</p>
            </div>
            <div className="flex flex-col gap-1">
              {!p.isActive && (
                <button type="button" className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => moderate(p.id, true)}>
                  Одобрить товар
                </button>
              )}
              {p.isActive && (
                <button type="button" className="text-xs px-2 py-1 rounded-lg bg-amber-600 text-white" onClick={() => moderate(p.id, false)}>
                  Скрыть товар
                </button>
              )}
              {!p.isActive && p.store?.status !== 'APPROVED' && (
                <span className="text-[10px] text-amber-400">Сначала одобрите магазин</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
