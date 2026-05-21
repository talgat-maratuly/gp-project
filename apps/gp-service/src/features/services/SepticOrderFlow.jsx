import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Star } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import { api } from '@gp/shared/api'
import { PREFERRED_TIME_SLOTS, SEPTIC_VOLUME_OPTIONS, calcServiceTotal } from '@gp/shared/constants'
import { getServiceById } from '../../data/services'
import { useService } from '../../context/ServiceContext'
import PaymentMethodPicker from '../../components/PaymentMethodPicker'
import AddressPickerMap from '../../components/AddressPickerMap'
import {
  Chip,
  KaspiButton,
  KaspiCard,
  PageHeader,
  StatusTimeline,
  StepBar,
} from '@gp/shared/ui/KaspiUI'

const LIVE_STEPS = [
  { id: 'search', label: 'Поиск', hint: 'Ищем свободного исполнителя' },
  { id: 'found', label: 'Исполнитель найден' },
  { id: 'way', label: 'В пути' },
  { id: 'work', label: 'Начал работу' },
  { id: 'done', label: 'Завершено' },
]

function statusToIndex(status) {
  const map = { new: 0, pending: 0, assigned: 1, accepted: 1, on_way: 2, in_progress: 3, done: 4, client_confirmed: 4 }
  return map[status] ?? 0
}

export default function SepticOrderFlow() {
  const navigate = useNavigate()
  const { placeServiceOrder, objects, profile, isLoggedIn, authReady, notify, refreshOrders } = useService()
  const service = getServiceById('septic-pumping')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().slice(0, 10)

  const [step, setStep] = useState(1)
  const [phase, setPhase] = useState('form')
  const [placedOrder, setPlacedOrder] = useState(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [photos, setPhotos] = useState([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

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
    lat: 51.233,
    lng: 51.367,
  })

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || profile.name || '',
      phone: f.phone || profile.phone || '',
      objectId: f.objectId || objects[0]?.id || '',
    }))
  }, [profile.name, profile.phone, objects])

  const total = useMemo(
    () => calcServiceTotal({ serviceId: 'septic-pumping', septicVolume: form.septicVolume }),
    [form.septicVolume],
  )

  const obj = objects.find((o) => o.id === form.objectId)

  const submitOrder = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/services/septic-pumping' } })
      return
    }
    setProcessing(true)
    setError('')
    try {
      const order = await placeServiceOrder({
        serviceId: service.id,
        serviceName: service.name,
        priceFrom: service.priceFrom,
        total,
        ...form,
        address: obj?.address,
      })
      setPlacedOrder(order)
      setPhase('tracking')
      setStep(3)
      notify('Заявка создана — ищем исполнителя')
    } catch (err) {
      setError(err.message || 'Ошибка')
      if (String(err.message).includes('Войдите')) navigate('/login', { state: { from: '/services/septic-pumping' } })
    } finally {
      setProcessing(false)
    }
  }

  const finishReview = () => {
    notify('Спасибо за отзыв!')
    navigate('/orders')
  }

  useEffect(() => {
    if (phase !== 'tracking' || !placedOrder?.id) return undefined
    const poll = async () => {
      try {
        const fresh = await api.getOrder(placedOrder.id)
        setPlacedOrder(fresh)
        await refreshOrders()
      } catch { /* keep last */ }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [phase, placedOrder?.id, refreshOrders])

  if (phase === 'review') {
    return (
      <div className="px-4 py-4 gp-animate-in safe-pb">
        <PageHeader title="Оцените работу" subtitle="Отзыв поможет другим клиентам" />
        <KaspiCard className="!p-5 mb-4 text-center">
          <p className="text-sm text-[var(--gp-text-muted)] mb-3">Ваша оценка</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                <Star className={`w-9 h-9 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--gp-border)]'}`} />
              </button>
            ))}
          </div>
        </KaspiCard>
        <label className="block mb-4">
          <span className="text-sm font-semibold mb-2 block">Отзыв</span>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            placeholder="Как прошла откачка?"
            className="w-full p-4 rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)] resize-none"
          />
        </label>
        <KaspiCard className="!p-4 mb-4 border-dashed">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Camera className="w-5 h-5" /> Фото работ
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="text-sm w-full"
            onChange={(e) => setPhotos(Array.from(e.target.files || []))}
          />
          {photos.length > 0 && <p className="text-xs text-[var(--gp-text-muted)] mt-2">{photos.length} фото выбрано</p>}
        </KaspiCard>
        <KaspiButton onClick={finishReview}>Отправить отзыв</KaspiButton>
      </div>
    )
  }

  if (phase === 'tracking' && placedOrder) {
    const liveIdx = statusToIndex(placedOrder.status)
    const isDone = ['done', 'client_confirmed'].includes(placedOrder.status)
    return (
      <div className="px-4 py-4 gp-animate-in">
        <PageHeader title="Заказ септика" subtitle={`№ ${placedOrder.id?.slice(0, 8) || '—'}`} onBack={() => navigate('/')} />
        <StepBar step={3} />
        <KaspiCard className="!p-5 mb-4">
          <p className="font-extrabold text-lg mb-1">{formatPrice(placedOrder.total)}</p>
          <p className="text-sm text-[var(--gp-text-muted)]">{obj?.address || placedOrder.address}</p>
        </KaspiCard>
        <KaspiCard className="!p-5 mb-4">
          <p className="font-bold mb-4">Статус заказа</p>
          <StatusTimeline steps={LIVE_STEPS} currentIndex={liveIdx} />
        </KaspiCard>
        {isDone ? (
          <KaspiButton onClick={() => setPhase('review')}>Оценить и оставить отзыв</KaspiButton>
        ) : (
          <p className="text-center text-sm text-[var(--gp-text-muted)]">Обновление каждые несколько секунд…</p>
        )}
        <button type="button" onClick={() => navigate('/orders')} className="w-full mt-3 py-3 text-sm font-bold text-emerald-600">
          Все заказы
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 gp-animate-in">
      <PageHeader
        title="Откачка септика"
        subtitle={step === 1 ? 'Объём и время' : step === 2 ? 'Адрес и оплата' : 'Подтверждение'}
        onBack={() => (step > 1 ? setStep((s) => s - 1) : navigate('/services'))}
      />
      <StepBar step={step} />

      {authReady && !isLoggedIn && (
        <KaspiCard className="!p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200/50">
          <p className="text-sm font-semibold mb-2">Войдите для заказа</p>
          <KaspiButton size="md" onClick={() => navigate('/login', { state: { from: '/services/septic-pumping' } })}>
            Войти
          </KaspiButton>
        </KaspiCard>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <KaspiCard className="!p-4">
            <p className="font-bold mb-3">Объём септика</p>
            <div className="grid grid-cols-2 gap-2">
              {SEPTIC_VOLUME_OPTIONS.map((o) => (
                <Chip
                  key={o.label}
                  active={form.septicVolume === o.value}
                  onClick={() => setForm({ ...form, septicVolume: o.value })}
                >
                  {o.label}
                  <span className="block text-xs opacity-80">{formatPrice(o.price)}</span>
                </Chip>
              ))}
            </div>
          </KaspiCard>
          <KaspiCard className="!p-4">
            <label className="block font-bold mb-2">Дата</label>
            <input
              type="date"
              min={defaultDate}
              value={form.preferredDate}
              disabled={form.flexibleTime}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
            />
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.flexibleTime}
                onChange={(e) => setForm({ ...form, flexibleTime: e.target.checked })}
                className="w-5 h-5 accent-emerald-600"
              />
              <span className="font-semibold">Любое время</span>
            </label>
            {!form.flexibleTime && (
              <div className="flex flex-wrap gap-2 mt-4">
                {PREFERRED_TIME_SLOTS.map((slot) => (
                  <Chip
                    key={slot.id}
                    active={form.preferredTime === slot.id}
                    onClick={() => setForm({ ...form, preferredTime: slot.id })}
                  >
                    {slot.label}
                  </Chip>
                ))}
              </div>
            )}
          </KaspiCard>
          <KaspiButton onClick={() => setStep(2)}>Далее</KaspiButton>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <KaspiCard className="!p-4">
            <p className="font-bold mb-2">Адрес</p>
            <select
              value={form.objectId}
              onChange={(e) => setForm({ ...form, objectId: e.target.value })}
              className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] mb-3"
            >
              {objects.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <AddressPickerMap
              lat={form.lat}
              lng={form.lng}
              onLocationChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
              className="h-40 rounded-2xl overflow-hidden"
            />
          </KaspiCard>
          <KaspiCard className="!p-4">
            <label className="font-bold block mb-2">Комментарий</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              placeholder="Подъезд, ворота, особенности"
              className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] resize-none"
            />
          </KaspiCard>
          <KaspiCard className="!p-4">
            <p className="font-bold mb-3">Способ оплаты</p>
            <PaymentMethodPicker value={form.paymentMethod} onChange={(paymentMethod) => setForm({ ...form, paymentMethod })} />
          </KaspiCard>
          <KaspiButton onClick={() => setStep(3)}>Далее</KaspiButton>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <KaspiCard className="!p-5">
            <p className="text-sm text-[var(--gp-text-muted)]">К оплате партнёру</p>
            <p className="text-3xl font-extrabold gp-text-gradient mt-1">{formatPrice(total)}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-[var(--gp-text-muted)]">Объём</span><span className="font-semibold">{form.septicVolume} м³</span></li>
              <li className="flex justify-between"><span className="text-[var(--gp-text-muted)]">Дата</span><span className="font-semibold">{form.flexibleTime ? 'Любое время' : form.preferredDate}</span></li>
              <li className="flex justify-between"><span className="text-[var(--gp-text-muted)]">Адрес</span><span className="font-semibold text-right max-w-[55%]">{obj?.address}</span></li>
            </ul>
          </KaspiCard>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <KaspiButton disabled={processing} onClick={submitOrder}>
            {processing ? 'Отправка…' : 'Подтвердить и найти исполнителя'}
          </KaspiButton>
        </div>
      )}
    </div>
  )
}
