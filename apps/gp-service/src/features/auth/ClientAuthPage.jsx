import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BUSINESS_FORMS } from '@gp/shared/constants'
import { useService } from '../../context/ServiceContext'
import { useLanguage } from '../../i18n'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

const QUICK_TESTS = [
  { id: 'individual', label: 'Войти как клиент', name: 'Тест Клиент' },
  { id: 'ip', label: 'Войти как ИП', name: 'Тест ИП' },
  { id: 'too', label: 'Войти как ТОО', name: 'Тест ТОО' },
]

export default function ClientAuthPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const { login, register, isLoggedIn } = useService()
  const [mode, setMode] = useState('register')
  const [businessForm, setBusinessForm] = useState('individual')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const accountType = BUSINESS_FORMS.find((b) => b.id === businessForm)?.accountType || 'INDIVIDUAL'
  const isLegal = businessForm === 'ip' || businessForm === 'too'

  if (isLoggedIn) {
    navigate(from, { replace: true })
    return null
  }

  const finish = () => navigate(from, { replace: true })

  const submit = async (e) => {
    e?.preventDefault?.()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const email = form.email.trim() || 'uralsk_client@gp.kz'
        const password = form.password || '1234'
        await login(email, password)
      } else {
        if (!form.name.trim()) {
          setError('Укажите имя')
          setLoading(false)
          return
        }
        await register({
          ...form,
          accountType,
          companyName: isLegal ? form.name.trim() : undefined,
          contactPerson: isLegal ? form.name.trim() : undefined,
        })
      }
      finish()
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const quickTest = async (testId) => {
    const cfg = QUICK_TESTS.find((q) => q.id === testId)
    if (!cfg) return
    setBusinessForm(testId)
    setError('')
    setLoading(true)
    try {
      const bf = BUSINESS_FORMS.find((b) => b.id === testId)
      await register({
        name: cfg.name,
        accountType: bf?.accountType || 'INDIVIDUAL',
        companyName: testId !== 'individual' ? cfg.name : undefined,
        contactPerson: testId !== 'individual' ? cfg.name : undefined,
      })
      finish()
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] text-[var(--gp-text)]'

  return (
    <div className="px-4 py-6 max-w-md mx-auto gp-animate-in">
      <h1 className="text-2xl font-extrabold mb-2">{mode === 'login' ? t('login') : t('register')}</h1>
      <p className="text-sm text-[var(--gp-text-muted)] mb-4">{t('app_service')}</p>
      <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
        MVP: регион не нужен. Email, телефон и пароль подставятся автоматически, если оставить пустыми.
      </p>

      <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-[var(--gp-surface)] border border-[var(--gp-border)]">
        {['login', 'register'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === m ? 'gp-gradient-kaspi text-white shadow-md' : 'text-[var(--gp-text-muted)]'
            }`}
          >
            {m === 'login' ? t('login') : t('register')}
          </button>
        ))}
      </div>

      {mode === 'register' && (
        <div className="grid gap-2 mb-4">
          {QUICK_TESTS.map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={loading}
              onClick={() => quickTest(q.id)}
              className="w-full py-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-700 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit}>
        <KaspiCard className="!p-5 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">Тип аккаунта *</p>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_FORMS.map((bf) => (
                    <button
                      key={bf.id}
                      type="button"
                      onClick={() => setBusinessForm(bf.id)}
                      className={`py-3 rounded-2xl text-sm font-bold transition ${
                        businessForm === bf.id
                          ? 'gp-gradient-kaspi text-white shadow-md'
                          : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                      }`}
                    >
                      {bf.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold mb-1 block">
                  {isLegal ? 'Название / ФИО *' : 'ФИО *'}
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder={isLegal ? 'Тест ИП' : 'Айдар'}
                />
              </label>
            </>
          )}

          <p className="text-xs text-[var(--gp-text-muted)]">Необязательно (для теста можно оставить пустым):</p>
          <label className="block">
            <span className="text-sm font-semibold mb-1 block">Телефон</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="авто: test_phone_…"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold mb-1 block">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="авто: test_…@gp.local"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold mb-1 block">{t('password')}</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder={mode === 'login' ? '' : 'по умолчанию: 123456'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <KaspiButton type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? t('login') : t('register')}
          </KaspiButton>
        </KaspiCard>
      </form>

      <p className="text-xs text-[var(--gp-text-muted)] mt-4 text-center">
        Demo вход: uralsk_client / 1234
      </p>
    </div>
  )
}
