import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccess } from '../context/AccessContext'
import { createQrCodeObject } from '@gp/shared/demo'
import {
  QR_OBJECT_TYPES,
  QR_SERVICE_TYPES,
  QR_OBJECT_TYPE_LABELS,
  QR_SERVICE_TYPE_LABELS,
} from '@gp/shared/constants'

export default function QrCreatePage() {
  const navigate = useNavigate()
  const { scopedStore } = useAccess()
  const [form, setForm] = useState({
    title: '',
    type: 'filter',
    serviceType: 'filter_replacement',
    franchiseId: scopedStore.franchises?.[0]?.id || 'fr-uralsk',
    clientId: '',
    partnerId: '',
    productId: '',
    address: '',
    city: 'Уральск',
    description: '',
    lastServiceDate: '',
    nextServiceDate: '',
    phone: '',
    qrCode: '',
  })

  const submit = (e) => {
    e.preventDefault()
    const obj = createQrCodeObject(form)
    navigate(`/qr/${obj.id}`)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Создать QR-объект</h1>
      <form onSubmit={submit} className="space-y-4 admin-card p-5">
        <label className="block text-sm">
          <span className="text-slate-400">Код QR (опционально)</span>
          <input className="admin-input mt-1" value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} placeholder="QR-FILTER-002" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Название</span>
          <input required className="admin-input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Тип объекта</span>
          <select className="admin-input mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {QR_OBJECT_TYPES.map((t) => (
              <option key={t} value={t}>{QR_OBJECT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Услуга</span>
          <select className="admin-input mt-1" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
            {QR_SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>{QR_SERVICE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Клиент</span>
          <select className="admin-input mt-1" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">—</option>
            {scopedStore.clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Партнёр</span>
          <select className="admin-input mt-1" value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })}>
            <option value="">—</option>
            {scopedStore.partners?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Товар GP Market</span>
          <select className="admin-input mt-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">—</option>
            {scopedStore.marketProducts?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Адрес</span>
          <input required className="admin-input mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Город</span>
          <input className="admin-input mt-1" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-slate-400">Последнее обслуживание</span>
            <input type="date" className="admin-input mt-1" value={form.lastServiceDate} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Следующее</span>
            <input type="date" className="admin-input mt-1" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} />
          </label>
        </div>
        <button type="submit" className="w-full py-3 rounded-xl bg-sky-600 font-bold text-sm">Создать</button>
      </form>
    </div>
  )
}
