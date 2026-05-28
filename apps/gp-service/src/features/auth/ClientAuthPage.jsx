import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useService } from '../../context/ServiceContext'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function ClientAuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const { verifyOtp, sendOtp, submitPartnerApplication, logout, isLoggedIn } = useService()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('CLIENT')
  const [form, setForm] = useState({
    phone: '',
    otp: '',
    companyName: '',
    bin: '',
    city: '',
    contactPhone: '',
    email: '',
    direction: '',
  })
  const [partnerSession, setPartnerSession] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isPartnerRole = role === 'IP' || role === 'TOO'
  const accountType = role === 'TOO' ? 'LEGAL_ENTITY' : 'INDIVIDUAL'
  const roleLabel = useMemo(() => (role === 'TOO' ? 'ТОО' : role === 'IP' ? 'ИП' : 'Клиент'), [role])

  if (isLoggedIn) {
    navigate(from, { replace: true })
    return null
  }

  const requestOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.phone.trim()) {
      setError('Телефон нөмірін енгізіңіз')
      return
    }
    setLoading(true)
    try {
      await sendOtp(form.phone)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const confirmOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.otp.trim()) {
      setError('OTP кодын енгізіңіз')
      return
    }
    setLoading(true)
    try {
      const { me } = await verifyOtp({
        phone: form.phone,
        code: form.otp.trim(),
        deviceId: 'gp-service-web',
        deviceName: 'GP Service Web',
        platform: 'web',
        desiredRole: isPartnerRole ? 'PARTNER' : 'CLIENT',
        accountType,
      })
      if (isPartnerRole) {
        setPartnerSession(me)
        setStep(3)
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const submitCompany = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.companyName.trim() || !form.bin.trim() || !form.city.trim() || !form.contactPhone.trim() || !form.email.trim() || !form.direction.trim()) {
      setError('Барлық міндетті өрістерді толтырыңыз')
      return
    }
    setLoading(true)
    try {
      await submitPartnerApplication({
        partnerType: 'OTHER',
        partnerRole: 'SPECIALIST',
        companyName: form.companyName.trim(),
        fullName: partnerSession?.name || form.companyName.trim(),
        phone: form.contactPhone.trim(),
        city: form.city.trim(),
        address: form.city.trim(),
        description: form.direction.trim(),
        accountType,
        bin: form.bin.trim(),
        legalAddress: form.city.trim(),
        documents: [{ kind: 'COMPANY_REGISTRATION', number: form.bin.trim(), note: 'web-otp-flow' }],
      })
      logout()
      setStep(4)
    } catch (err) {
      setError(err.message || 'Өтінімді жіберу қатесі')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] text-[var(--gp-text)]'

  return (
    <div className="px-4 py-6 max-w-md mx-auto gp-animate-in">
      <h1 className="text-2xl font-extrabold mb-2">Кіру және тіркелу</h1>
      <p className="text-sm text-[var(--gp-text-muted)] mb-4">GP Service</p>
      {step === 1 && (
        <form onSubmit={requestOtp}>
          <KaspiCard className="!p-5 space-y-4">
            <div>
              <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">Рөл *</p>
              <div className="grid grid-cols-3 gap-2">
                {['CLIENT', 'IP', 'TOO'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={`py-3 rounded-2xl text-sm font-bold transition ${
                      role === id
                        ? 'gp-gradient-kaspi text-white shadow-md'
                        : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                    }`}
                  >
                    {id === 'CLIENT' ? 'Клиент' : id}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-semibold mb-1 block">Телефон</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="+7 701 234 56 78"
              />
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <KaspiButton type="submit" disabled={loading}>{loading ? '...' : 'OTP жіберу'}</KaspiButton>
          </KaspiCard>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={confirmOtp}>
          <KaspiCard className="!p-5 space-y-4">
            <p className="text-sm text-[var(--gp-text-muted)]">{roleLabel} үшін OTP растау</p>
            <label className="block">
              <span className="text-sm font-semibold mb-1 block">OTP</span>
              <input value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} className={inputClass} placeholder="4-8 сан" />
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <KaspiButton type="submit" disabled={loading}>{loading ? '...' : 'Растау'}</KaspiButton>
          </KaspiCard>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={submitCompany}>
          <KaspiCard className="!p-5 space-y-4">
            <p className="text-sm font-semibold">Компания анкетасы ({roleLabel})</p>
            <input className={inputClass} placeholder="Компания атауы" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <input className={inputClass} placeholder="БИН / ИИН" value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} />
            <input className={inputClass} placeholder="Қала" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className={inputClass} placeholder="Байланыс телефоны" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <input className={inputClass} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={inputClass} placeholder="Қызмет бағыты" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} />
            <p className="text-xs text-[var(--gp-text-muted)]">
              Дерек backend-ке жіберіледі, тек localStorage-қа сақталмайды.
            </p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <KaspiButton type="submit" disabled={loading}>{loading ? '...' : 'Модерацияға жіберу'}</KaspiButton>
          </KaspiCard>
        </form>
      )}
      {step === 4 && (
        <KaspiCard className="!p-5 space-y-4">
          <p className="text-lg font-bold">Аккаунтыңыз тексеруде</p>
          <p className="text-sm text-[var(--gp-text-muted)]">
            Өтінім жіберілді. GP Admin бекіткеннен кейін ғана тапсырыстар мен функциялар ашылады.
          </p>
          <KaspiButton type="button" onClick={() => navigate('/')}>Басты бетке өту</KaspiButton>
        </KaspiCard>
      )}
    </div>
  )
}
