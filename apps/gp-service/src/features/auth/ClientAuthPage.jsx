import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BUSINESS_FORMS, isLegalBusinessForm } from '@gp/shared/constants'
import { useService } from '../../context/ServiceContext'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'

export default function ClientAuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const { login, register, isLoggedIn } = useService()
  const [mode, setMode] = useState('login')
  const [businessForm, setBusinessForm] = useState('individual')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    companyName: '', bin: '', legalAddress: '', contactPerson: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLegal = isLegalBusinessForm(businessForm)
  const accountType = BUSINESS_FORMS.find((b) => b.id === businessForm)?.accountType || 'INDIVIDUAL'

  if (isLoggedIn) {
    navigate('/profile', { replace: true })
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ ...form, accountType })
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto gp-animate-in">
      <h1 className="text-2xl font-extrabold mb-2">{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
      <p className="text-sm text-[var(--gp-text-muted)] mb-6">Для заказов услуг и товаров</p>

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
            {m === 'login' ? 'Вход' : 'Регистрация'}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <KaspiCard className="!p-5 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">Тип аккаунта</p>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_FORMS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBusinessForm(t.id)}
                      className={`py-3 rounded-2xl text-sm font-bold transition ${
                        businessForm === t.id
                          ? 'gp-gradient-kaspi text-white shadow-md'
                          : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLegal ? (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">
                      {businessForm === 'too' ? 'Наименование ТОО' : 'Наименование ИП'}
                    </span>
                    <input
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">БИН</span>
                    <input
                      value={form.bin}
                      onChange={(e) => setForm({ ...form, bin: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">Юридический адрес</span>
                    <input
                      value={form.legalAddress}
                      onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">Контактное лицо (ФИО)</span>
                    <input
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">Телефон</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">ФИО</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold mb-1 block">Телефон</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
                    />
                  </label>
                </>
              )}
            </>
          )}

          <label className="block">
            <span className="text-sm font-semibold mb-1 block">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
              required
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold mb-1 block">Пароль</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)]"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <KaspiButton type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </KaspiButton>
        </KaspiCard>
      </form>

      <p className="text-xs text-[var(--gp-text-muted)] mt-4 text-center">Demo: client@gp.kz / password123</p>
    </div>
  )
}
