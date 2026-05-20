import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SepticOrderFlow from './SepticOrderFlow'
import { formatPrice } from '@gp/shared/utils'
import {
  PREFERRED_TIME_SLOTS,
  SEPTIC_VOLUME_OPTIONS,
  LAWN_SERVICE_IDS,
  CONSULTATION_SERVICE_IDS,
  calcServiceTotal,
} from '@gp/shared/constants'
import { getServiceById, getLawnPricing } from '../../data/services'
import { useService } from '../../context/ServiceContext'
import PaymentMethodPicker from '../../components/PaymentMethodPicker'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const NEEDS_SCHEDULE = new Set([
  'septic-pumping',
  ...LAWN_SERVICE_IDS,
  'irrigation-tuning',
  'irrigation-maintenance',
  'irrigation-mount',
  'filter-maintenance',
  'filter-install',
  'filter-cartridge',
])

export default function ServiceOrderPage() {
  const { serviceId } = useParams()
  if (serviceId === 'septic-pumping') return <SepticOrderFlow />
  const navigate = useNavigate()
  const { placeServiceOrder, objects, profile, isLoggedIn, authReady } = useService()
  const service = getServiceById(serviceId)
  const isSeptic = serviceId === 'septic-pumping'
  const isLawn = LAWN_SERVICE_IDS.includes(serviceId)
  const isConsultation = CONSULTATION_SERVICE_IDS.has(serviceId)
  const lawnPricing = getLawnPricing(serviceId)
  const needsSchedule = NEEDS_SCHEDULE.has(serviceId)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().slice(0, 10)

  const [form, setForm] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    objectId: objects[0]?.id || '',
    preferredDate: defaultDate,
    preferredTime: '11:00',
    flexibleTime: false,
    comment: '',
    paymentMethod: 'kaspi_partner',
    septicVolume: 4,
    lawnAreaSqm: '',
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || profile.name || '',
      phone: f.phone || profile.phone || '',
      objectId: f.objectId || objects[0]?.id || '',
    }))
  }, [profile.name, profile.phone, objects])

  const estimatedTotal = useMemo(() => {
    if (!serviceId) return 0
    return calcServiceTotal({
      serviceId,
      septicVolume: isSeptic ? form.septicVolume : undefined,
      lawnAreaSqm: isLawn && form.lawnAreaSqm ? Number(form.lawnAreaSqm) : undefined,
    })
  }, [serviceId, isSeptic, isLawn, form.septicVolume, form.lawnAreaSqm])

  if (!service) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-slate-500 mb-4">Услуга не найдена</p>
        <Button onClick={() => navigate('/services')}>К списку услуг</Button>
      </div>
    )
  }

  const septicOption = SEPTIC_VOLUME_OPTIONS.find(
    (o) => o.volumes?.includes(form.septicVolume) || o.value === form.septicVolume,
  )

  const submit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/services/${serviceId}` } })
      return
    }
    setProcessing(true)
    setError('')
    try {
      await placeServiceOrder({
        serviceId: service.id,
        serviceName: service.name,
        priceFrom: service.priceFrom,
        total: estimatedTotal,
        ...form,
        lawnAreaSqm: form.lawnAreaSqm ? Number(form.lawnAreaSqm) : undefined,
      })
      navigate('/orders')
    } catch (err) {
      const msg = err.message || 'Ошибка отправки'
      setError(msg)
      if (msg.includes('Войдите') || msg.includes('клиент') || msg.includes('партнёра')) {
        navigate('/login', { state: { from: `/services/${serviceId}` } })
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold mb-1">{service.name}</h1>
      {service.priceNote && <p className="text-sm text-gp-green-700 font-semibold mb-1">{service.priceNote}</p>}
      <p className="text-gp-green-700 font-bold mb-2">от {formatPrice(service.priceFrom)}</p>
      {service.description && <p className="text-sm text-slate-500 mb-4">{service.description}</p>}

      {authReady && !isLoggedIn && (
        <div className="gp-card p-4 mb-4 border-amber-200 bg-amber-50 text-sm">
          <p className="font-semibold text-amber-900 mb-2">Войдите как клиент</p>
          <p className="text-amber-800 text-xs mb-3">
            Demo: <strong>client@gp.kz</strong> / password123
          </p>
          <Link to="/login" state={{ from: `/services/${serviceId}` }} className="inline-block py-2 px-4 rounded-xl gp-gradient text-white text-sm font-semibold">
            Войти
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="gp-card p-5 space-y-4">
        <Input label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Телефон" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <label className="block text-sm">
          <span className="font-medium">Адрес</span>
          <select value={form.objectId} onChange={(e) => setForm({ ...form, objectId: e.target.value })} className="w-full mt-1 p-3 rounded-xl border">
            {objects.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>

        {isSeptic && (
          <label className="block text-sm">
            <span className="font-medium">Объём септика</span>
            <select
              value={form.septicVolume}
              onChange={(e) => setForm({ ...form, septicVolume: Number(e.target.value) })}
              className="w-full mt-1 p-3 rounded-xl border"
              required
            >
              {SEPTIC_VOLUME_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label} — {formatPrice(o.price)}
                </option>
              ))}
            </select>
          </label>
        )}

        {isLawn && lawnPricing && (
          <Input
            label={`Площадь, м² (${formatPrice(lawnPricing.pricePerSqm)}/м²)`}
            type="number"
            min={1}
            value={form.lawnAreaSqm}
            onChange={(e) => setForm({ ...form, lawnAreaSqm: e.target.value })}
            required
          />
        )}

        {isConsultation && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border">
            Выезд специалиста — <strong>{formatPrice(estimatedTotal)}</strong>. Стоимость работ определит мастер на месте.
          </p>
        )}

        {needsSchedule && (
          <>
            <Input
              label="Желаемая дата"
              type="date"
              min={defaultDate}
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              required={!form.flexibleTime}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.flexibleTime}
                onChange={(e) => setForm({ ...form, flexibleTime: e.target.checked })}
                className="accent-gp-green-600"
              />
              Любое свободное время
            </label>
            {!form.flexibleTime && (
              <label className="block text-sm">
                <span className="font-medium">Время визита</span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PREFERRED_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setForm({ ...form, preferredTime: slot.id })}
                      className={`py-2 rounded-xl text-sm font-semibold border ${
                        form.preferredTime === slot.id
                          ? 'gp-gradient text-white border-transparent'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </label>
            )}
          </>
        )}

        <Input label="Комментарий" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Оплата исполнителю</p>
          <PaymentMethodPicker value={form.paymentMethod} onChange={(paymentMethod) => setForm({ ...form, paymentMethod })} />
        </div>

        {estimatedTotal > 0 && (
          <div className="rounded-xl bg-gp-green-50 border border-gp-green-100 p-3 text-sm">
            <p className="font-semibold text-gp-green-800">
              К оплате партнёру: {formatPrice(estimatedTotal)}
            </p>
            {isLawn && lawnPricing && form.lawnAreaSqm && (
              <p className="text-xs text-slate-600 mt-1">
                {Number(form.lawnAreaSqm) * lawnPricing.pricePerSqm < lawnPricing.minTotal
                  ? `Минимальный заказ ${formatPrice(lawnPricing.minTotal)}`
                  : `${form.lawnAreaSqm} м² × ${formatPrice(lawnPricing.pricePerSqm)}/м²`}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={processing}>
          {processing ? 'Отправка…' : isSeptic ? 'Вызвать ассенизатора' : isConsultation ? 'Заказать выезд' : 'Отправить заявку'}
        </Button>
      </form>
    </div>
  )
}
