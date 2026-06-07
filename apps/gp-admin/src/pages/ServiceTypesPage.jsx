import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { api } from '@gp/shared/api'
import { useAccess } from '../context/AccessContext'
import { useLanguage } from '../i18n/LanguageContext'
import { EMPTY_NAMES, hasAllLocalizedNames, normalizeNames, resolveLocalizedName, withLocalizedName } from '@gp/shared/i18n'
import { ACTIONS } from '../lib/permissions'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import FormActions from '../components/FormActions'
import LocalizedNameFields from '../components/LocalizedNameFields'

const emptyTypeForm = () => ({
  code: '',
  names: { ...EMPTY_NAMES },
  active: true,
})

const emptySubForm = () => ({
  code: '',
  names: { ...EMPTY_NAMES },
  active: true,
})

export default function ServiceTypesPage() {
  const { can } = useAccess()
  const { t, lang } = useLanguage()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [typeModal, setTypeModal] = useState(null)
  const [subModal, setSubModal] = useState(null)
  const [typeForm, setTypeForm] = useState(emptyTypeForm())
  const [subForm, setSubForm] = useState(emptySubForm())
  const [formError, setFormError] = useState('')

  const label = (entity) => resolveLocalizedName(entity, lang)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api.adminServiceTypes()
      setTypes(Array.isArray(list) ? list : [])
    } catch (e) {
      console.warn('[ServiceTypes]', e?.message)
      setTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openAddType = () => {
    setFormError('')
    setTypeModal('new')
    setTypeForm(emptyTypeForm())
  }

  const openEditType = (row) => {
    setFormError('')
    setTypeModal(row.id)
    setTypeForm({
      code: row.code,
      names: normalizeNames(row),
      active: row.active !== false,
    })
  }

  const openAddSub = (serviceTypeId) => {
    setFormError('')
    setSubModal({ serviceTypeId, subId: 'new' })
    setSubForm(emptySubForm())
  }

  const openEditSub = (serviceTypeId, sub) => {
    setFormError('')
    setSubModal({ serviceTypeId, subId: sub.id })
    setSubForm({
      code: sub.code,
      names: normalizeNames(sub),
      active: sub.active !== false,
    })
  }

  const saveType = async () => {
    if (!typeForm.code?.trim()) {
      setFormError(t('codeRequired'))
      return
    }
    if (!hasAllLocalizedNames(typeForm.names)) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({
      code: typeForm.code.trim().toLowerCase(),
      names: typeForm.names,
      active: typeForm.active,
    })
    try {
      if (typeModal === 'new') {
        await api.adminCreateServiceType(payload)
      } else {
        await api.adminUpdateServiceType(typeModal, payload)
      }
      setTypeModal(null)
      setFormError('')
      await load()
    } catch (e) {
      setFormError(e?.message || t('saveError'))
    }
  }

  const saveSub = async () => {
    if (!subModal) return
    if (!subForm.code?.trim()) {
      setFormError(t('codeRequired'))
      return
    }
    if (!hasAllLocalizedNames(subForm.names)) {
      setFormError(t('namesRequired'))
      return
    }
    const payload = withLocalizedName({
      code: subForm.code.trim().toLowerCase(),
      names: subForm.names,
      active: subForm.active,
    })
    try {
      if (subModal.subId === 'new') {
        await api.adminAddSubserviceType(subModal.serviceTypeId, payload)
      } else {
        await api.adminUpdateSubserviceType(subModal.serviceTypeId, subModal.subId, payload)
      }
      setSubModal(null)
      setFormError('')
      await load()
    } catch (e) {
      setFormError(e?.message || t('saveError'))
    }
  }

  const removeType = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    await api.adminRemoveServiceType(id)
    await load()
  }

  const removeSub = async (serviceTypeId, subId) => {
    if (!window.confirm(t('confirmDelete'))) return
    await api.adminRemoveSubserviceType(serviceTypeId, subId)
    await load()
  }

  if (!can(ACTIONS.SERVICE_CRUD)) return <p className="text-slate-500">{t('noAccess')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm admin-muted">{t('serviceTypesHint')}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/services/subservices" className="text-sm text-sky-400 font-semibold hover:underline">
            {t('nav_subservice_types')} →
          </Link>
          <Link to="/services/septic-pricing" className="text-sm text-sky-400 font-semibold hover:underline">
            {t('nav_septic_pricing')} →
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openAddType} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-sm font-semibold">
          <Plus className="w-4 h-4" /> {t('addServiceType')}
        </button>
      </div>

      {loading && <p className="text-sm admin-muted">{t('loading')}</p>}

      {types.map((s) => (
        <div key={s.id} className="admin-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{label(s)}</h3>
              <p className="text-xs text-slate-500 font-mono">code: {s.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={s.active ? 'emerald' : 'slate'}>{s.active ? t('activeF') : t('inactiveF')}</Badge>
              <button type="button" className="admin-btn-icon" onClick={() => openEditType(s)}>{t('edit')}</button>
              <button type="button" className="admin-btn-icon text-red-400" onClick={() => removeType(s.id)}><Trash2 className="w-4 h-4" /></button>
              <button type="button" className="admin-btn-icon" onClick={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))}>
                {expanded[s.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {expanded[s.id] && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">{t('subserviceTypes')}</span>
                <button type="button" className="text-xs text-sky-400" onClick={() => openAddSub(s.id)}>
                  + {t('addSubserviceType')}
                </button>
              </div>
              <ul className="space-y-2">
                {(s.subservices || []).map((sub) => (
                  <li key={sub.id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 text-sm">
                    <span className="flex items-center gap-2 flex-wrap">
                      {label(sub)} <span className="text-xs font-mono text-slate-500">({sub.code})</span>
                      {sub.active === false && <Badge color="slate">{t('inactiveF')}</Badge>}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" className="text-xs text-sky-400" onClick={() => openEditSub(s.id, sub)}>{t('edit')}</button>
                      <button type="button" className="text-xs text-red-400" onClick={() => removeSub(s.id, sub.id)}>{t('delete')}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      <Modal open={!!typeModal} onClose={() => { setTypeModal(null); setFormError('') }} title={typeModal === 'new' ? t('addServiceType') : t('edit')}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('serviceCode')}</span>
            <input className="admin-input mt-1 font-mono" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} placeholder="septic" />
          </label>
          <LocalizedNameFields names={typeForm.names} onChange={(names) => setTypeForm({ ...typeForm, names })} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={typeForm.active} onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })} />{t('activeF')}</label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={saveType} onCancel={() => { setTypeModal(null); setFormError('') }} />
        </div>
      </Modal>

      <Modal open={!!subModal} onClose={() => { setSubModal(null); setFormError('') }} title={subModal?.subId === 'new' ? t('addSubserviceType') : t('subservice')}>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-slate-300 font-medium">{t('subserviceCode')}</span>
            <input className="admin-input mt-1 font-mono" value={subForm.code} onChange={(e) => setSubForm({ ...subForm, code: e.target.value })} placeholder="vol_3_4" />
          </label>
          <LocalizedNameFields names={subForm.names} onChange={(names) => setSubForm({ ...subForm, names })} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={subForm.active} onChange={(e) => setSubForm({ ...subForm, active: e.target.checked })} />{t('activeF')}</label>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <FormActions onSave={saveSub} onCancel={() => { setSubModal(null); setFormError('') }} />
        </div>
      </Modal>
    </div>
  )
}
