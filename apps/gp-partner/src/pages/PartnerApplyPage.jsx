import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
  resolvePartnerTypeFromGroups,
} from '@gp/shared/constants'
import { api } from '@gp/shared/api'
import { usePartner } from '../context/PartnerContext'

const GROUPS = [...PARTNER_REGISTRATION_GROUPS, FURNITURE_EXECUTOR_GROUP, SHOP_REGISTRATION_GROUP]

export default function PartnerApplyPage() {
  const navigate = useNavigate()
  const { user, syncPartner, notify, loading } = usePartner()
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
    () => GROUPS.filter((g) => selectedMainIds.has(g.id)),
    [selectedMainIds],
  )

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const subserviceIds = [...selectedSubIds]
    const partnerType = resolvePartnerTypeFromGroups([...selectedMainIds])
    const vehiclePhotos = form.vehiclePhotos.split('\n').map((s) => s.trim()).filter(Boolean)
    const equipmentPhotos = form.equipmentPhotos.split('\n').map((s) => s.trim()).filter(Boolean)
    try {
      const body = {
        partnerType,
        regionId: form.regionId,
        companyName: form.companyName.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
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
      notify('Заявка отправлена на модерацию')
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Ошибка отправки')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg mx-auto pb-8">
      <h1 className="text-xl font-bold">Заявка партнёра GP</h1>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <label className="block text-sm">
        Регион
        <select
          className="mt-1 w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-3"
          value={form.regionId}
          onChange={(e) => setForm((f) => ({ ...f, regionId: e.target.value }))}
          required
        >
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>

      <div>
        <p className="text-sm font-semibold mb-2">Направления услуг</p>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
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
          <p className="text-xs text-[var(--gp-text-muted)] mb-1">{g.title}</p>
          <div className="flex flex-wrap gap-2">
            {g.subservices.map((s) => (
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
                  selectedSubIds.has(s.id) ? 'bg-emerald-600 text-white' : 'bg-[var(--gp-surface-2)]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {['companyName', 'fullName', 'phone', 'city', 'address', 'description'].map((key) => (
        <label key={key} className="block text-sm capitalize">
          {key}
          <input
            className="mt-1 w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-3"
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            required={['companyName', 'fullName', 'phone'].includes(key)}
          />
        </label>
      ))}

      <label className="block text-sm">
        URL фото техники (по одному на строку)
        <textarea
          className="mt-1 w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-3 min-h-[80px]"
          value={form.vehiclePhotos}
          onChange={(e) => setForm((f) => ({ ...f, vehiclePhotos: e.target.value }))}
        />
      </label>
      <label className="block text-sm">
        URL фото оборудования
        <textarea
          className="mt-1 w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-3 min-h-[80px]"
          value={form.equipmentPhotos}
          onChange={(e) => setForm((f) => ({ ...f, equipmentPhotos: e.target.value }))}
        />
      </label>

      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl gp-gradient-kaspi text-white font-bold">
        Отправить на модерацию
      </button>
    </form>
  )
}
