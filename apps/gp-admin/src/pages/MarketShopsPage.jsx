import { useAccess } from '../context/AccessContext'
import { useStore } from '../context/StoreContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function MarketShopsPage() {
  const { t } = useLanguage()
  const { scopedShops, canBlockShop } = useAccess()
  const { updateShop } = useStore()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('market_shops')}</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="text-left p-3">{t('market_shop_name')}</th>
              <th className="text-left p-3">{t('city')}</th>
              <th className="text-left p-3">{t('partner')}</th>
              <th className="text-left p-3">{t('status')}</th>
              <th className="text-left p-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {scopedShops.map((s) => (
              <tr key={s.id} className="border-t border-white/5">
                <td className="p-3 font-medium">{s.shopName}</td>
                <td className="p-3">{s.city}</td>
                <td className="p-3">{s.ownerName}</td>
                <td className="p-3">{s.status}</td>
                <td className="p-3">
                  {canBlockShop && s.status !== 'BLOCKED' && (
                    <button type="button" className="text-red-400 text-xs" onClick={() => updateShop(s.id, { status: 'BLOCKED' })}>
                      {t('market_block')}
                    </button>
                  )}
                  {s.status === 'BLOCKED' && (
                    <button type="button" className="text-emerald-400 text-xs" onClick={() => updateShop(s.id, { status: 'ACTIVE' })}>
                      {t('market_activate')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
