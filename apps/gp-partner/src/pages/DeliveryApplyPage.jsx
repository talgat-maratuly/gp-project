import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@gp/shared/api'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'

export default function DeliveryApplyPage() {
  const { t } = useLanguage()
  const { syncPartner } = usePartner()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyName: '',
    bin: '',
    cityId: 'city-uralsk',
    city: 'Уральск',
    address: '',
    direction: 'Уральск → Астана',
    transportType: 'Газель',
    bodyVolumeM3: 12,
    capacityKg: 1500,
    freePlaces: 1,
    basePrice: '',
  })
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.partnerDeliveryApply(form)
      await syncPartner?.()
      navigate('/profile', { replace: true })
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('delivery_apply')}</h1>
      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      <form onSubmit={submit} className="space-y-3">
        {[
          ['companyName', t('market_shop_name')],
          ['bin', 'БИН/ИИН'],
          ['city', t('city')],
          ['address', t('address')],
          ['direction', t('delivery_routes')],
          ['transportType', 'Транспорт'],
          ['bodyVolumeM3', 'м³'],
          ['capacityKg', 'кг'],
          ['freePlaces', 'Свободные места'],
          ['basePrice', t('priceFrom')],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-semibold">{label}</span>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full mt-1 p-3 rounded-xl border" required={key !== 'basePrice'} />
          </label>
        ))}
        <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">{t('delivery_apply')}</button>
      </form>
    </div>
  )
}
