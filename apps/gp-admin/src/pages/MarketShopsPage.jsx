import { useState } from 'react'
import { useAccess } from '../context/AccessContext'
import { useStore } from '../context/StoreContext'
import { useLanguage } from '../i18n/LanguageContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/ui/Modal'
import AdminEmptyState from '../components/ui/AdminEmptyState'

export default function MarketShopsPage() {
  const { t } = useLanguage()
  const { scopedShops, canBlockShop } = useAccess()
  const { updateShop } = useStore()
  const [viewId, setViewId] = useState(null)
  const shop = viewId ? scopedShops.find((s) => s.id === viewId) : null

  return (
    <div className="space-y-4">
      <PageHeader title={t('nav_shops')} description={t('shops_page_desc')} />

      <div className="admin-table-wrap overflow-x-auto">
        <table className="admin-table min-w-[800px]">
          <thead>
            <tr>
              <th>{t('market_shop_name')}</th>
              <th>{t('city')}</th>
              <th>{t('partner')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {!scopedShops.length ? (
              <tr><td colSpan={5}><AdminEmptyState /></td></tr>
            ) : scopedShops.map((s) => (
              <tr key={s.id} className="cursor-pointer hover:bg-slate-800/40" onClick={() => setViewId(s.id)}>
                <td className="font-medium">{s.shopName}</td>
                <td>{s.city}</td>
                <td>{s.ownerName}</td>
                <td>{s.status}</td>
                <td onClick={(e) => e.stopPropagation()}>
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

      <Modal open={!!shop} onClose={() => setViewId(null)} title={shop?.shopName} wide>
        {shop && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">{t('city')}</dt><dd>{shop.city}</dd></div>
            <div><dt className="text-slate-500">{t('status')}</dt><dd>{shop.status}</dd></div>
            <div><dt className="text-slate-500">{t('partner')}</dt><dd>{shop.ownerName}</dd></div>
            <div><dt className="text-slate-500">{t('phone')}</dt><dd>{shop.phone}</dd></div>
            <div className="col-span-2"><dt className="text-slate-500">{t('address')}</dt><dd>{shop.address}</dd></div>
          </dl>
        )}
      </Modal>
    </div>
  )
}
