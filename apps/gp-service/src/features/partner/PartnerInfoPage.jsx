import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Mail, MapPin, Phone, Send, Store } from 'lucide-react'
import { GP_CONTACTS, PARTNER_APP, getPartnerWebUrl } from '@gp/shared/constants'
import { useService } from '../../context/ServiceContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function PartnerInfoPage() {
  const navigate = useNavigate()
  const { submitPartnerLead } = useService()
  const [form, setForm] = useState({ name: '', phone: '', type: 'shop', message: '' })
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) return
    submitPartnerLead(form)
    setSent(true)
  }

  return (
    <div className="px-4 py-6">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-gp-blue-600 mb-4">← Назад</button>

      <div className="gp-card p-6 mb-6 text-center bg-gradient-to-br from-gp-green-50 to-gp-blue-50">
        <Store className="w-12 h-12 text-gp-green-600 mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-slate-800 mb-3">Зарабатывайте вместе с GP</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          GP Partner — отдельное приложение для исполнителей, водителей, питомников, магазинов автополива,
          поставщиков растений, оборудования и ландшафтных компаний.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <Button size="lg" className="w-full" onClick={() => window.open(getPartnerWebUrl(), '_blank', 'noopener')}>
          <Store className="w-5 h-5" /> Открыть GP Partner
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
          <Send className="w-5 h-5" /> Оставить заявку
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => window.open(PARTNER_APP.storeAndroid, '_blank', 'noopener')}>
          <Download className="w-5 h-5" /> Google Play (скоро)
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => { window.location.href = GP_CONTACTS.phoneHref }}>
          <Phone className="w-5 h-5" /> Связаться с GP
        </Button>
      </div>

      <div className="gp-card p-5 mb-8 space-y-4 text-sm">
        <h2 className="font-bold">Контакты</h2>
        <a href={GP_CONTACTS.phoneHref} className="flex items-center gap-3 text-slate-700">
          <Phone className="w-5 h-5 text-gp-green-600" /> {GP_CONTACTS.phone}
        </a>
        <a href={GP_CONTACTS.emailHref} className="flex items-center gap-3 text-slate-700">
          <Mail className="w-5 h-5 text-gp-green-600" /> {GP_CONTACTS.email}
        </a>
        <p className="flex items-start gap-3 text-slate-700">
          <MapPin className="w-5 h-5 text-gp-green-600 shrink-0" />
          {GP_CONTACTS.address}, {GP_CONTACTS.addressLine}
        </p>
      </div>

      <form id="lead-form" onSubmit={submit} className="gp-card p-5 space-y-3">
        <h2 className="font-bold">Заявка на партнёрство</h2>
        {sent ? (
          <p className="text-gp-green-700 text-sm">Спасибо! Мы свяжемся с вами в ближайшее время.</p>
        ) : (
          <>
            <Input label="Имя / компания" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Телефон" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Тип партнёра</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 p-3 rounded-xl border">
                <option value="shop">Магазин</option>
                <option value="nursery">Питомник</option>
                <option value="executor">Исполнитель</option>
                <option value="driver">Водитель</option>
                <option value="supplier">Поставщик</option>
              </select>
            </label>
            <Input label="Сообщение" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <Button type="submit" className="w-full">Отправить заявку</Button>
          </>
        )}
      </form>

      <p className="text-center text-xs text-slate-400 mt-6">
        GP Partner:{' '}
        <a href={getPartnerWebUrl()} target="_blank" rel="noopener noreferrer" className="text-gp-blue-600">
          {getPartnerWebUrl()}
        </a>
        {' '}— запустите <code className="text-[10px]">npm run dev:partner</code>
      </p>
    </div>
  )
}
