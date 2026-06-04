import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SepticOrderFlow from './SepticOrderFlow'
import { formatPrice } from '@gp/shared/utils'
import {
  PREFERRED_TIME_SLOTS,
  SEPTIC_VOLUME_OPTIONS,
  LAWN_SERVICE_IDS,
  CONSULTATION_SERVICE_IDS,
} from '@gp/shared/constants'
import { getServiceById, getLawnPricing } from '../../data/services'
import { useService } from '../../context/ServiceContext'
import { useLanguage } from '../../i18n'
import OrderLocationFields from '@gp/shared/components/OrderLocationFields'
import PaymentMethodPicker from '../../components/PaymentMethodPicker'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { PageHeader } from '@gp/shared/ui/KaspiUI'

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
  return <GenericServiceOrder serviceId={serviceId} />
}

function GenericServiceOrder({ serviceId }) {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const {
    placeServiceOrder, objects, profile, geoStore, isLoggedIn, authReady,
    getCityCatalog, isServiceAvailable, calcOrderTotal, ensureCatalog, isDemoMode,
  } = useService()
  const baseService = getServiceById(serviceId)
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
    oblastId: profile.oblastId || '',
    cityId: profile.cityId || '',
    city: profile.city || '',
    franchiseId: profile.franchiseId || null,
    address: objects[0]?.address || '',
    lat: 51.233,
    lng: 51.367,
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const available = isServiceAvailable(serviceId, form.franchiseId, form.cityId)

  useEffect(() => {
    if (!form.franchiseId && !form.cityId) return
    ensureCatalog({ franchiseId: form.franchiseId, cityId: form.cityId })
  }, [form.franchiseId, form.cityId, ensureCatalog])

  const cityService = useMemo(() => {
    const list = getCityCatalog(baseService ? [baseService] : [], lang, form.franchiseId, form.cityId)
    if (list[0]) return list[0]
    return isDemoMode ? baseService : null
  }, [getCityCatalog, baseService, lang, form.franchiseId, form.cityId, isDemoMode])
  const service = cityService

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || profile.name || '',
      phone: f.phone || profile.phone || '',
      objectId: f.objectId || objects[0]?.id || '',
      oblastId: f.oblastId || profile.oblastId || '',
      cityId: f.cityId || profile.cityId || '',
      city: f.city || profile.city || '',
      franchiseId: f.franchiseId || profile.franchiseId || null,
      objectId: f.objectId || objects[0]?.id || '',
      address: f.address || objects.find((o) => o.id === (f.objectId || objects[0]?.id))?.address || '',
    }))
  }, [profile.name, profile.phone, profile.oblastId, profile.cityId, profile.city, profile.franchiseId, objects])

  const estimatedTotal = useMemo(() => {
    if (!serviceId) return 0
    return calcOrderTotal({
      serviceId,
      septicVolume: isSeptic ? form.septicVolume : undefined,
      lawnAreaSqm: isLawn && form.lawnAreaSqm ? Number(form.lawnAreaSqm) : undefined,
    }, lang, form.franchiseId, form.cityId)
  }, [serviceId, isSeptic, isLawn, form.septicVolume, form.lawnAreaSqm, form.franchiseId, form.cityId, calcOrderTotal, lang])

  if (!baseService) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-slate-500 mb-4">{t('serviceNotFound')}</p>
        <Button onClick={() => navigate(-1)}>{t('back')}</Button>
      </div>
    )
  }

  if (!available || !service) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-slate-500 mb-4">{t('serviceUnavailableInCity')}</p>
        {profile.city && <p className="text-xs text-slate-400 mb-4">{profile.city}</p>}
        <Button onClick={() => navigate('/services')}>{t('nav_services')}</Button>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/services/${serviceId}` } })
      return
    }
    setProcessing(true)
    setError('')
    if (!form.cityId) {
      setError(t('selectCity'))
      setProcessing(false)
      return
    }
    if (!form.address?.trim()) {
      setError(t('address'))
      setProcessing(false)
      return
    }
    try {
      const obj = objects.find((o) => o.id === form.objectId)
      await placeServiceOrder({
        serviceId: service.id,
        serviceName: service.name,
        priceFrom: service.priceFrom,
        total: estimatedTotal,
        ...form,
        address: form.address || obj?.address,
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
      <PageHeader title={service.name} subtitle={t('orderFormSubtitle')} onBack={() => navigate(-1)} />
      {service.priceNote && <p className="text-sm text-gp-green-700 font-semibold mb-1">{service.priceNote}</p>}
      <p className="text-gp-green-700 font-bold mb-2">{t('priceFrom')} {formatPrice(service.priceFrom)}</p>
      {service.description && <p className="text-sm text-slate-500 mb-4">{service.description}</p>}

      {authReady && !isLoggedIn && (
        <div className="gp-card p-4 mb-4 border-amber-200 bg-amber-50 text-sm">
          <p className="font-semibold text-amber-900 mb-2">{t('loginAsClient')}</p>
          <p className="text-amber-800 text-xs mb-3">
            {t('demo_login_hint')}
          </p>
          <Link to="/login" state={{ from: `/services/${serviceId}` }} className="inline-block py-2 px-4 rounded-xl gp-gradient text-white text-sm font-semibold">
            {t('login')}
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="gp-card p-5 space-y-4">
        <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label={t('phone')} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <OrderLocationFields
          store={geoStore}
          profile={profile}
          objects={objects}
          value={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          showObjectPicker
        />

        {isSeptic && (
          <label className="block text-sm">
            <span className="font-medium">{t('septicVolume')}</span>
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
            label={t('lawnAreaLabel').replace('{rate}', formatPrice(lawnPricing.pricePerSqm))}
            type="number"
            min={1}
            value={form.lawnAreaSqm}
            onChange={(e) => setForm({ ...form, lawnAreaSqm: e.target.value })}
            required
          />
        )}

        {isConsultation && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border">
            {t('consultationHint').replace('{price}', formatPrice(estimatedTotal))}
          </p>
        )}

        {needsSchedule && (
          <>
            <Input
              label={t('visitDate')}
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
              {t('flexibleTime')}
            </label>
            {!form.flexibleTime && (
              <label className="block text-sm">
                <span className="font-medium">{t('visitTime')}</span>
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

        <Input label={t('comment')} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">{t('payToPartner')}</p>
          <PaymentMethodPicker value={form.paymentMethod} onChange={(paymentMethod) => setForm({ ...form, paymentMethod })} />
        </div>

        {estimatedTotal > 0 && (
          <div className="rounded-xl bg-gp-green-50 border border-gp-green-100 p-3 text-sm">
            <p className="font-semibold text-gp-green-800">
              {t('toPayPartner')}: {formatPrice(estimatedTotal)}
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
          {processing ? t('sending') : isSeptic ? t('callSeptic') : isConsultation ? t('orderConsultation') : t('sendRequest')}
        </Button>
      </form>
    </div>
  )
}
