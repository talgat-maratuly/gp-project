import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useAccess } from '../context/AccessContext'
import { useLanguage, useOrderStatusLabel } from '../i18n/LanguageContext'
import { ACTIONS } from '../lib/permissions'

const ROLE_KEYS = [
  { id: 'SUPER_ADMIN', descKey: 'role_SUPER_ADMINDesc' },
  { id: 'FRANCHISE_ADMIN', descKey: 'role_FRANCHISE_ADMINDesc' },
  { id: 'MANAGER', descKey: 'role_MANAGERDesc' },
  { id: 'FINANCE', descKey: 'role_FINANCEDesc' },
  { id: 'SUPPORT', descKey: 'role_SUPPORTDesc' },
]

export default function SettingsPage() {
  const { store, updateSettings, resetDemoData, orderStatuses } = useStore()
  const { user } = useAuth()
  const { can, currentFranchise } = useAccess()
  const { t } = useLanguage()
  const statusLabel = useOrderStatusLabel()
  const s = store.settings

  return (
    <div className="space-y-6 max-w-2xl">
      {currentFranchise && (
        <div className="admin-card">
          <p className="text-sm text-slate-400">{t('franchise')}</p>
          <p className="font-bold">{currentFranchise.name} · {currentFranchise.city}</p>
        </div>
      )}
      {can(ACTIONS.SETTINGS_EDIT) && (
        <section className="admin-card space-y-4">
          <h2 className="font-bold">{t('settingsCommission')}</h2>
          <label className="block text-sm">
            <span className="text-slate-500 text-xs">{t('defaultPercent')}</span>
            <input type="number" className="admin-input mt-1" value={s.defaultCommissionPercent} onChange={(e) => updateSettings({ defaultCommissionPercent: Number(e.target.value) || 0 })} />
          </label>
          <p className="text-xs text-slate-500">{t('commissionHint')}</p>
        </section>
      )}
      <section className="admin-card space-y-3">
        <h2 className="font-bold">{t('userRoles')}</h2>
        <ul className="text-sm space-y-2">
          {ROLE_KEYS.map((r) => (
            <li key={r.id} className={`px-3 py-2 rounded-lg border ${user.role === r.id ? 'border-sky-500/50 bg-sky-500/10' : 'border-white/10'}`}>{t(r.descKey)}</li>
          ))}
        </ul>
      </section>
      <section className="admin-card space-y-3">
        <h2 className="font-bold">{t('orderStatuses')}</h2>
        <ul className="flex flex-wrap gap-2">
          {orderStatuses.map((st) => (
            <li key={st.id} className="px-3 py-1.5 rounded-lg bg-white/5 text-sm">{statusLabel(st.id)}</li>
          ))}
        </ul>
      </section>
      {user.role === 'SUPER_ADMIN' && (
        <button type="button" onClick={() => { if (confirm(t('resetConfirm'))) resetDemoData() }} className="px-4 py-2 rounded-xl border border-red-500/40 text-red-300 text-sm hover:bg-red-500/10">
          {t('resetDemo')}
        </button>
      )}
    </div>
  )
}
