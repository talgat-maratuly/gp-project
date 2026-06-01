import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PARTNER_ROLES } from '@gp/shared/constants'
import {
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
  resolvePartnerTypeFromGroups,
  resolvePartnerRoleFromGroups,
} from '@gp/shared/constants'
import { api } from '@gp/shared/api'
import { usePartner } from '../context/PartnerContext'

const SHOP_GROUPS = [SHOP_REGISTRATION_GROUP, FURNITURE_EXECUTOR_GROUP]

const FIELD_LABELS = {
  companyName: 'Название компании',
  fullName: 'ФИО',
  phone: 'Телефон',
  city: 'Город',
  address: 'Адрес',
  description: 'Описание',
}

export default function ShopApplyPage() {
  const navigate = useNavigate()
  const { user, syncPartner, notify, loading } = usePartner()
  const [regions, setRegions] = useState([])
  const [selectedMainIds, setSelectedMainIds] = useState(() => new Set(['shop']))
  const [selectedSubIds, setSelectedSubIds] = useState(() => new Set())
  const [form, setForm] = useState({
    regionId: '',
    companyName: user?.company || '',
    fullName: user?.name || '',
    phone: user?.phone || '',
    city: 'Уральск',
    address: '',
    description: '',
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
    () => SHOP_GROUPS.filter((g) => selectedMainIds.has(g.id)),
    [selectedMainIds],
  )

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const subserviceIds = [...selectedSubIds]
    const mainGroupIds = [...selectedMainIds]
    const partnerType = resolvePartnerTypeFromGroups(mainGroupIds)
    const partnerRole = resolvePartnerRoleFromGroups(mainGroupIds)
    try {
      const body = {
        partnerType,
        partnerRole: partnerRole || PARTNER_ROLES.SHOP,
        ...(form.regionId ? { regionId: form.regionId } : {}),
        companyName: form.companyName.trim() || user?.company || user?.name,
        fullName: form.fullName.trim() || user?.name,
        phone: form.phone.trim() || user?.phone,
        city: form.city.trim(),
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        accountType: user?.accountType || 'INDIVIDUAL',
        subserviceIds: subserviceIds.length ? subserviceIds : undefined,
      }
      if (user?.partnerStatus === 'NEEDS_REVISION') {
        await api.partnerResubmit(body)
      } else {
        await api.partnerApply(body)
      }
      await syncPartner()
      notify('Заявка отправлена на модерацию')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Ошибка отправки')
    }
  }

  return (
    <form onSubmit={submit} className="gp-form-stack max-w-lg mx-auto pb-8 w-full">
      <h1 className="text-xl font-bold text-[var(--gp-text)]">Заявка магазина / мебель</h1>
      <p className="text-sm text-[var(--gp-text-muted)]">
        Маман қызметтері үшін «Маман өтінімі» бөлімін пайдаланыңыз.
      </p>
      {error && (
        <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="gp-form-field">
        <label className="gp-form-label" htmlFor="shop-apply-region">Регион</label>
        <select
          id="shop-apply-region"
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
        <p className="gp-form-label mb-2">Направление</p>
        <div className="flex flex-wrap gap-2">
          {SHOP_GROUPS.map((g) => (
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
                selectedMainIds.has(g.id) ? 'gp-gradient-kaspi text-white' : 'bg-[var(--gp-surface-2)]'
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
                  selectedSubIds.has(s.id) ? 'bg-emerald-600 text-white' : 'bg-white text-black border'
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
          <label className="gp-form-label" htmlFor={`shop-${key}`}>{FIELD_LABELS[key] || key}</label>
          <input
            id={`shop-${key}`}
            className="gp-input-kaspi"
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            required={['companyName', 'fullName', 'phone'].includes(key)}
          />
        </div>
      ))}

      <button type="submit" disabled={loading} className="w-full min-h-[48px] py-3 rounded-xl gp-gradient-kaspi text-white font-bold disabled:opacity-50">
        Отправить на модерацию
      </button>
    </form>
  )
}
