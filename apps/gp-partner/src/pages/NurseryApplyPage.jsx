import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'

export default function NurseryApplyPage() {
  const { t } = useLanguage()
  const { syncPartner } = usePartner()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    legalForm: 'IP',
    bin: '',
    cityId: 'city-uralsk',
    city: 'Уральск',
    address: '',
    phone: '',
    description: '',
    categories: 'trees,flowers,seedlings',
    delivers: true,
    growsToOrder: true,
  })
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.partnerNurseryApply({
        ...form,
        accountType: 'LEGAL_ENTITY',
        categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
        serviceCities: [form.cityId],
      })
      await syncPartner?.()
      navigate('/profile', { replace: true })
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('nursery_apply')}</h1>
      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <form onSubmit={submit} className="space-y-3">
        {[
          ['name', t('market_shop_name')],
          ['bin', 'БИН/ИИН'],
          ['city', t('city')],
          ['address', t('address')],
          ['phone', t('phone')],
          ['categories', t('nursery_plant_type')],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-semibold">{label}</span>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 p-3 rounded-xl border" required={key !== 'phone'} />
          </label>
        ))}
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full p-3 rounded-xl border" placeholder={t('nursery_comment')} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.delivers} onChange={(e) => setForm({ ...form, delivers: e.target.checked })} />
          {t('nursery_delivery_needed')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.growsToOrder} onChange={(e) => setForm({ ...form, growsToOrder: e.target.checked })} />
          {t('nursery_preorder_title')}
        </label>
        <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">{t('nursery_apply')}</button>
      </form>
    </div>
  )
}
