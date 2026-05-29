import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PARTNER_ROLES } from '@gp/shared/constants'
import {
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
  resolvePartnerTypeFromGroups,
  resolvePartnerRoleFromGroups,
} from '@gp/shared/constants'
import { api } from '@gp/shared/api'
import { usePartner } from '../context/PartnerContext'

const ALL_GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP, SHOP_REGISTRATION_GROUP]
const SPECIALIST_GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP]

const FIELD_LABELS = {
  companyName: 'Название компании',
  fullName: 'ФИО',
  phone: 'Телефон',
  city: 'Город',
  address: 'Адрес',
  description: 'Описание услуг',
}

export default function PartnerApplyPage({ specialistOnly = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const fromWhatsappLogin = Boolean(location.state?.fromWhatsappLogin)
  const { user, syncPartner, notify, loading } = usePartner()
  const groups = specialistOnly ? SPECIALIST_GROUPS : ALL_GROUPS
  const [regions, setRegions] = useState([])
  const [selectedMainIds, setSelectedMainIds] = useState(() => new Set(['lawn']))
  const [selectedSubIds, setSelectedSubIds] = useState(() => new Set())
  const [form, setForm] = useState({
    regionId: '',
    companyName: user?.company || '',
    fullName: user?.name || '',
    phone: user?.phone || '',
    city: 'Уральск',
    address: '',
    description: '',
    vehiclePhotos: '',
    equipmentPhotos: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    api.getRegions().then((list) => {
      setRegions(list)
      const uralsk = list.find((r) => r.code === 'uralsk')
      setForm((f) => ({ ...f, regionId: f.regionId || uralsk?.id || list[0]?.id || '' }))
    }).catch(() => {})
  }, [])

  const visibleGroups = useMemo(
    () => groups.filter((g) => selectedMainIds.has(g.id)),
    [selectedMainIds, groups],
  )

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const subserviceIds = [...selectedSubIds]
    const mainGroupIds = [...selectedMainIds]
    const partnerType = resolvePartnerTypeFromGroups(mainGroupIds)
    const partnerRole = specialistOnly
      ? PARTNER_ROLES.SPECIALIST
      : resolvePartnerRoleFromGroups(mainGroupIds)
    const vehiclePhotos = form.vehiclePhotos.split('\n').map((s) => s.trim()).filter(Boolean)
    const equipmentPhotos = form.equipmentPhotos.split('\n').map((s) => s.trim()).filter(Boolean)
    try {
      const body = {
        partnerType,
        partnerRole,
        ...(form.regionId ? { regionId: form.regionId } : {}),
        companyName: form.companyName.trim() || user?.company || user?.name,
        fullName: form.fullName.trim() || user?.name,
        phone: form.phone.trim() || user?.phone,
        city: form.city.trim(),
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        accountType: user?.accountType || 'INDIVIDUAL',
        vehiclePhotos,
        equipmentPhotos,
        subserviceIds: subserviceIds.length ? subserviceIds : undefined,
      }
      if (user?.partnerStatus === 'NEEDS_REVISION') {
        await api.partnerResubmit(body)
      } else {
        await api.partnerApply(body)
      }
      await syncPartner()
      notify(specialistOnly ? 'Маман өтінімі модерацияға жіберілді' : 'Заявка отправлена на модерацию')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Ошибка отправки')
    }
  }

  return (
    <form onSubmit={submit} className="gp-form-stack max-w-lg mx-auto pb-8 w-full">
      <h1 className="text-xl font-bold text-[var(--gp-text)]">
        {specialistOnly ? 'Маман ретінде тіркелу' : 'Заявка партнёра GP'}
      </h1>
      {fromWhatsappLogin && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
          Сіз кірдіңіз. Бұл толық тіркелу емес — маман өтінімін толтырып, модерацияға жіберіңіз.
        </p>
      )}
      {specialistOnly && (
        <p className="text-sm text-[var(--gp-text-muted)]">
          Өтінім GP Admin арқылы қабылданғаннан кейін ғана қызметтер мен тапсырыстарға қол жеткізесіз.
        </p>
      )}
      {error && <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      <div className="gp-form-field">
        <label className="gp-form-label" htmlFor="apply-region">Регион (необязательно)</label>
        <select
          id="apply-region"
          className="gp-input-kaspi"
          value={form.regionId}
          onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}
        >
          <option value="">По умолчанию (Уральск)</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="gp-form-label mb-2">Направления услуг</p>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedMainIds((prev) => {
                const n = new Set(prev)
                if (n.has(g.id)) n.delete(g.id)
                else n.add(g.id)
                return n
              })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                selectedMainIds.has(g.id) ? 'gp-gradient-kaspi text-white' : 'bg-[var(--gp-surface-2)] text-[var(--gp-text)]'
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      </div>

      {visibleGroups.map((g) => (
        <div key={g.id}>
          <p className="gp-form-hint">{g.title}</p>
          <div className="flex flex-wrap gap-2">
            {(g.subs || []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubIds((prev) => {
                  const n = new Set(prev)
                  if (n.has(s.id)) n.delete(s.id)
                  else n.add(s.id)
                  return n
                })}
                className={`px-2 py-1 rounded-lg text-xs ${
                  selectedSubIds.has(s.id) ? 'bg-emerald-600 text-white' : 'bg-white text-black border border-gray-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {['companyName', 'fullName', 'phone', 'city', 'address', 'description'].map((key) => (
        <div key={key} className="gp-form-field">
          <label className="gp-form-label" htmlFor={`apply-${key}`}>{FIELD_LABELS[key] || key}</label>
          <input
            id={`apply-${key}`}
            className="gp-input-kaspi"
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            required={['companyName', 'fullName', 'phone'].includes(key)}
            autoComplete={key === 'phone' ? 'tel' : key === 'fullName' ? 'name' : 'off'}
          />
        </div>
      ))}

      <div className="gp-form-field">
        <label className="gp-form-label" htmlFor="apply-vehicle-photos">URL фото техники</label>
        <span className="gp-form-hint">По одному URL на строку</span>
        <textarea
          id="apply-vehicle-photos"
          className="gp-textarea-kaspi"
          value={form.vehiclePhotos}
          onChange={(e) => setForm((f) => ({ ...f, vehiclePhotos: e.target.value }))}
          placeholder="https://example.com/photo1.jpg"
        />
      </div>

      <div className="gp-form-field">
        <label className="gp-form-label" htmlFor="apply-equipment-photos">URL фото оборудования</label>
        <textarea
          id="apply-equipment-photos"
          className="gp-textarea-kaspi"
          value={form.equipmentPhotos}
          onChange={(e) => setForm((f) => ({ ...f, equipmentPhotos: e.target.value }))}
          placeholder="https://example.com/equip1.jpg"
        />
      </div>

      <button type="submit" disabled={loading} className="w-full min-h-[48px] py-3 rounded-xl gp-gradient-kaspi text-white font-bold disabled:opacity-50">
        Отправить на модерацию
      </button>
    </form>
  )
}
