import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Phone, MessageCircle, ShoppingBag, Wrench } from 'lucide-react'
import {
  QR_OBJECT_TYPE_LABELS,
  QR_SERVICE_TYPE_LABELS,
  GP_SUPPORT_PHONE,
  GP_WHATSAPP_PHONE,
} from '@gp/shared/constants'
import { formatPrice } from '@gp/shared/utils'
import { fetchQrPublic, submitQrOrder } from '../../lib/qrApi'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU')
}

export default function QrPublicPage() {
  const { qrCode } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('info')
  const [form, setForm] = useState({ clientName: '', phone: '', address: '', comment: '' })
  const [orderId, setOrderId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchQrPublic(qrCode)
      .then((d) => {
        setData(d)
        setForm((f) => ({ ...f, address: d.address || '' }))
      })
      .catch(() => setError('QR-код не найден или объект неактивен'))
      .finally(() => setLoading(false))
  }, [qrCode])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const order = await submitQrOrder(qrCode, form)
      setOrderId(order.id)
      setStep('done')
    } catch (err) {
      setError(err.message || 'Не удалось отправить заявку')
    } finally {
      setSubmitting(false)
    }
  }

  const waLink = `https://wa.me/${GP_WHATSAPP_PHONE}?text=${encodeURIComponent(`Здравствуйте! QR ${qrCode}`)}`

  if (loading) {
    return (
      <div className="min-h-screen gp-app-bg flex items-center justify-center text-[var(--gp-text-muted)]">
        Загрузка…
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen gp-app-bg px-4 py-12 text-center">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <Link to="/" className="text-emerald-600 font-bold">На главную GP Service</Link>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen gp-app-bg px-4 py-8 max-w-md mx-auto">
        <KaspiCard className="!p-6 text-center">
          <p className="text-2xl font-extrabold gp-text-gradient mb-2">Заявка принята</p>
          <p className="text-sm text-[var(--gp-text-muted)] mb-4">Номер заявки</p>
          <p className="font-mono text-lg font-bold mb-6">{orderId}</p>
          <p className="text-sm text-[var(--gp-text-muted)]">Мы свяжемся с вами по телефону. Заявка передана в GP Admin и партнёру.</p>
          <Link to="/" className="inline-block mt-6 text-emerald-600 font-bold">GP Service</Link>
        </KaspiCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen gp-app-bg">
      <header className="px-4 py-4 border-b border-[var(--gp-border)] bg-[var(--gp-surface)]">
        <Link to="/" className="font-extrabold text-lg gp-text-gradient">GP Service</Link>
        <p className="text-[10px] text-[var(--gp-text-muted)]">QR Service</p>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4">
        <KaspiCard className="!p-5">
          <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase">{QR_OBJECT_TYPE_LABELS[data.type] || data.type}</p>
          <h1 className="text-xl font-extrabold mt-1">{data.title}</h1>
          <p className="text-sm text-[var(--gp-text-muted)] mt-2">{data.address}{data.city ? `, ${data.city}` : ''}</p>
          {data.description && <p className="text-sm mt-3">{data.description}</p>}
        </KaspiCard>

        <KaspiCard className="!p-4 space-y-2">
          <p className="text-sm font-bold">Услуга</p>
          <p className="text-emerald-700 font-semibold">{QR_SERVICE_TYPE_LABELS[data.serviceType] || data.serviceType}</p>
          <div className="grid grid-cols-2 gap-3 text-sm pt-2">
            <div>
              <p className="text-[var(--gp-text-muted)] text-xs">Последнее обслуживание</p>
              <p className="font-semibold">{formatDate(data.lastServiceDate)}</p>
            </div>
            <div>
              <p className="text-[var(--gp-text-muted)] text-xs">Рекомендуется</p>
              <p className="font-semibold">{formatDate(data.nextServiceDate)}</p>
            </div>
          </div>
        </KaspiCard>

        {data.type === 'filter' && (
          <KaspiCard className="!p-4 bg-emerald-500/10 border-emerald-500/30">
            <p className="font-bold text-sm">Фильтр воды</p>
            <p className="text-xs text-[var(--gp-text-muted)] mt-1">Рекомендуем замену по графику обслуживания</p>
          </KaspiCard>
        )}

        {data.product && (
          <KaspiCard className="!p-4">
            <div className="flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{data.product.name}</p>
                <p className="text-emerald-700 font-semibold">{formatPrice(data.product.price)}</p>
                <p className="text-xs text-[var(--gp-text-muted)]">В наличии: {data.product.quantity ?? '—'} {data.product.unit || 'шт'}</p>
                <Link to={`/shop/product/${data.product.id}`} className="text-xs text-emerald-600 font-bold mt-2 inline-block">
                  Купить в GP Market
                </Link>
              </div>
            </div>
          </KaspiCard>
        )}

        {step === 'info' && (
          <>
            <div className="flex gap-2">
              <a href={`tel:${GP_SUPPORT_PHONE}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-[var(--gp-border)] font-semibold text-sm">
                <Phone className="w-4 h-4" /> Позвонить
              </a>
              <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-emerald-500/40 text-emerald-700 font-semibold text-sm">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
            <KaspiButton type="button" onClick={() => setStep('form')}>
              <Wrench className="w-5 h-5 inline mr-2" />
              Заказать услугу
            </KaspiButton>
          </>
        )}

        {step === 'form' && (
          <form onSubmit={submit} className="space-y-4">
            <KaspiCard className="!p-4 space-y-3">
              <label className="block text-sm font-semibold">
                Имя
                <input required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="mt-1 w-full p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" />
              </label>
              <label className="block text-sm font-semibold">
                Телефон
                <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" />
              </label>
              <label className="block text-sm font-semibold">
                Адрес
                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" />
              </label>
              <label className="block text-sm font-semibold">
                Комментарий
                <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} className="mt-1 w-full p-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]" />
              </label>
            </KaspiCard>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <KaspiButton type="submit" disabled={submitting}>
              {submitting ? 'Отправка…' : 'Отправить заявку'}
            </KaspiButton>
            <button type="button" className="w-full text-sm text-[var(--gp-text-muted)]" onClick={() => setStep('info')}>
              Назад
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
