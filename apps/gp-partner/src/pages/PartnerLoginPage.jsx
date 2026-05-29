import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getServiceWebUrl } from '@gp/shared/constants'
import { WhatsappOtpLogin } from '@gp/shared/auth/whatsappOtpLogin'
import { usePartner } from '../context/PartnerContext'

/**
 * Тек кіру: WhatsApp OTP + email/пароль.
 * Тіркелу формасы жоқ — /register бөлек.
 */
export default function PartnerLoginPage() {
  const navigate = useNavigate()
  const { login, loginViaWhatsappOtp, logout, loading, user, authReady } = usePartner()
  const [loginMethod, setLoginMethod] = useState('whatsapp')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) {
      setError('Email және парольді енгізіңіз')
      return
    }
    try {
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Кіру қатесі')
    }
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center gp-app-bg text-[var(--gp-text-muted)]">
        Жүктелуде…
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto gp-app-bg">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold gp-text-gradient">GP Partner</h1>
        <p className="text-[var(--gp-text-muted)] text-sm mt-1">Кіру</p>
      </div>

      {user ? (
        <div className="gp-card-kaspi p-4 space-y-3 border border-emerald-500/30">
          <p className="text-sm text-[var(--gp-text)]">
            Сіз кірдіңіз: <strong>{user.phone || user.email}</strong>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 py-2.5 rounded-xl gp-gradient-kaspi text-white text-sm font-bold"
            >
              Кабинетке өту
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 py-2.5 rounded-xl border border-[var(--gp-border)] text-sm font-semibold"
            >
              Шығу
            </button>
          </div>
        </div>
      ) : (
        <div className="gp-card-kaspi p-5 space-y-4">
          <div className="flex gap-2">
            {[
              ['whatsapp', 'WhatsApp OTP'],
              ['password', 'Email / пароль'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setLoginMethod(id); setError('') }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                  loginMethod === id
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-white/10 text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loginMethod === 'whatsapp' ? (
            <WhatsappOtpLogin
              deviceId="gp-partner-web"
              deviceName="GP Partner Web"
              loginAs="partner"
              inputClassName="gp-input-kaspi"
              buttonClassName="w-full py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md disabled:opacity-50"
              onVerified={async () => {
                await loginViaWhatsappOtp()
                navigate('/', { replace: true })
              }}
            />
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-3" noValidate>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="gp-input-kaspi w-full"
                placeholder="uralsk_partner немесе partner@gp.kz"
                autoComplete="username"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="gp-input-kaspi w-full"
                placeholder="Пароль"
                autoComplete="current-password"
              />
              <Link to="/forgot-password" className="text-xs text-emerald-400 hover:underline block">
                Парольді ұмыттыңыз ба?
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm disabled:opacity-50"
              >
                {loading ? '…' : 'Кіру'}
              </button>
            </form>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      <p className="text-center text-sm text-[var(--gp-text-muted)] mt-6">
        Жаңа серіктес?{' '}
        <Link to="/register" className="text-emerald-500 font-semibold hover:underline">
          Тіркелу
        </Link>
      </p>
      <p className="text-center text-xs text-slate-600 mt-4">
        <a href={getServiceWebUrl()} className="text-emerald-500 hover:underline">GP Service</a> — клиенттерге
      </p>
    </div>
  )
}
