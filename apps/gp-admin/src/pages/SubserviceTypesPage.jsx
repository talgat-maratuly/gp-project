import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@gp/shared/api'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { EMPTY_NAMES, hasAllLocalizedNames, normalizeNames, resolveLocalizedName, withLocalizedName } from '@gp/shared/i18n'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import LocalizedNameFields from '../components/LocalizedNameFields'

const emptyForm = () => ({
  serviceTypeId: '',
  code: '',
  names: { ...EMPTY_NAMES },
  active: true,
  sortOrder: 0,
})

export default function SubserviceTypesPage() {
  const { can } = useAccess()
  const { t, lang } = useLanguage()
  const [items, setItems] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [filterCode, setFilterCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  const label = (entity) => resolveLocalizedName(entity, lang)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subs, types] = await Promise.all([
        api.adminSubservices(filterCode || undefined),
        api.adminServiceTypes(),
      ])
      setItems(Array.isArray(subs) ? subs : [])
      setServiceTypes(Array.isArray(types) ? types : [])
    } catch (e) {
      console.warn('[SubserviceTypes]', e?.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filterCode])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setFormError('')
    setModal('new')
    setForm({
      ...emptyForm(),
      serviceTypeId: serviceTypes[0]?.id || '',
    })
  }

  const openEdit = (row) => {
    setFormError('')
    setModal(row.id)
    setForm({
      serviceTypeId: row.serviceTypeId || '',
      code: row.code,
      names: normalizeNames(row),
      active: row.active !== false,
      sortOrder: row.sortOrder ?? 0,
    })
  }

  const save = async () => {
    if (!form.serviceTypeId) {
      setFormError(t('selectService'))
      return
    }
    if (!form.code?.trim()) {
      setFormError(t('codeRequired'))
      return
    }
    if (!hasAllLocalizedNames(form.names)) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({
      serviceTypeId: form.serviceTypeId,
      code: form.code.trim().toLowerCase(),
      names: form.names,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
    })
    try {
      if (modal === 'new') {
        await api.adminCreateSubservice(payload)
      } else {
        await api.adminUpdateStandaloneSubservice(modal, payload)
      }
      setModal(null)
      setFormError('')
      await load()
    } catch (e) {
      setFormError(e?.message || t('saveError'))
    }
  }

  const remove = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    await api.adminRemoveStandaloneSubservice(id)
    await load()
  }

  if (!can(ACTIONS.SERVICE_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm admin-muted">{t('subserviceTypesHint')}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/services" className="text-sky-400 font-semibold hover:underline">← {t('nav_service_types')}</Link>
          <Link to="/services/septic-pricing" className="text-sky-400 font-semibold hover:underline">{t('nav_septic_pricing')} →</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={openAdd} disabled={!serviceTypes.length} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold disabled:opacity-40">
          <Plus className="w-4 h-4" /> {t('addSubserviceType')}
        </button>
        <select
          className="admin-input text-sm py-2 max-w-[180px]"
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
        >
          <option value="">{t('allServices')}</option>
          {serviceTypes.map((s) => (
            <option key={s.id} value={s.code}>{label(s)} ({s.code})</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm admin-muted">{t('loading')}</p>}

      <div className="overflow-x-auto admin-card !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs admin-muted">
              <th className="p-3">{t('service')}</th>
              <th className="p-3">{t('subserviceCode')}</th>
              <th className="p-3">{t('name')}</th>
              <th className="p-3">{t('priority')}</th>
              <th className="p-3">{t('status')}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 font-mono text-xs">{row.serviceCode || '—'}</td>
                <td className="p-3 font-mono text-xs">{row.code}</td>
                <td className="p-3 font-medium">{label(row)}</td>
                <td className="p-3">{row.sortOrder ?? 0}</td>
                <td className="p-3">
                  <Badge color={row.active ? 'emerald' : 'slate'}>{row.active ? t('activeF') : t('inactiveF')}</Badge>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button type="button" className="text-xs text-sky-400 mr-2" onClick={() => openEdit(row)}>{t('edit')}</button>
                  <button type="button" className="text-xs text-red-400" onClick={() => remove(row.id)}><Trash2 className="w-3 h-3 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !items.length && (
          <p className="p-4 text-sm admin-muted text-center">{t('noData')}</p>
        )}
      </div>

      <Modal open={!!modal} onClose={() => { setModal(null); setFormError('') }} title={modal === 'new' ? t('addSubserviceType') : t('edit')}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('service')}</span>
            <select
              className="admin-input mt-1"
              value={form.serviceTypeId}
              onChange={(e) => setForm({ ...form, serviceTypeId: e.target.value })}
            >
              <option value="">{t('selectService')}</option>
              {serviceTypes.map((s) => (
                <option key={s.id} value={s.id}>{label(s)} ({s.code})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('subserviceCode')}</span>
            <input className="admin-input mt-1 font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="vol_3_4" />
          </label>
          <LocalizedNameFields names={form.names} onChange={(names) => setForm({ ...form, names })} />
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('priority')}</span>
            <input type="number" className="admin-input mt-1" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            {t('activeF')}
          </label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={save} onCancel={() => { setModal(null); setFormError('') }} />
        </div>
      </Modal>
    </div>
  )
}
