import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
  PARTNER_DOCUMENT_KIND_OPTIONS,
  BUSINESS_FORMS,
  isLegalBusinessForm,
  getPartnerSubserviceLabel,
  getServiceWebUrl,
} from '@gp/shared/constants'
import { API_URL } from '@gp/shared/api'
import { usePartner } from '../context/PartnerContext'

const SERVICE_GROUPS = [
  ...PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  SHOP_REGISTRATION_GROUP,
]
const REG_STEPS = 3

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6" aria-label={`Шаг ${step} из ${REG_STEPS}`}>
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex-1 flex items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              n < step ? 'bg-emerald-500' : n === step ? 'bg-emerald-400' : 'bg-white/10'
            }`}
          />
        </div>
      ))}
    </div>
  )
}

export default function AuthPage({ initialMode = 'register' }) {
  const navigate = useNavigate()
  const { register, login, loading, user, authReady } = usePartner()
  const [mode, setMode] = useState(initialMode)
  const [regStep, setRegStep] = useState(1)
  const [selectedMainIds, setSelectedMainIds] = useState(() => new Set(['lawn']))
  const [selectedSubIds, setSelectedSubIds] = useState(() => new Set())
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    company: '',
    city: 'Уральск',
    referralCode: '',
    accountType: 'INDIVIDUAL',
    businessForm: 'individual',
    bin: '',
    legalAddress: '',
    docKind: 'BIN_CERTIFICATE',
    docNumber: '',
  })
  const [error, setError] = useState('')
  /** Показывать подсказку по паролю только после начала ввода (шаг 2) */
  const [passwordStarted, setPasswordStarted] = useState(false)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (authReady && user) navigate('/', { replace: true })
  }, [authReady, user, navigate])

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[GP Partner] API_URL =', API_URL)
  }, [])

  const visibleGroups = useMemo(
    () => SERVICE_GROUPS.filter((g) => selectedMainIds.has(g.id)),
    [selectedMainIds],
  )

  const selectedSubLabels = useMemo(
    () => [...selectedSubIds].map((id) => getPartnerSubserviceLabel(id)),
    [selectedSubIds],
  )

  const toggleMain = (id) => {
    setSelectedMainIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSub = (id) => {
    setSelectedSubIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetRegister = () => {
    setRegStep(1)
    setError('')
    setPasswordStarted(false)
  }

  const validateStep1 = () => {
    if (selectedMainIds.size < 1) return 'Выберите хотя бы одну категорию услуг'
    if (selectedSubIds.size < 1) return 'Отметьте хотя бы одну подуслугу'
    return null
  }

  const validateStep2 = () => {
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Некорректный email'
    }
    return null
  }

  const validatePassword = () => {
    if (!form.password) return null
    if (form.password.length < 6 && form.password !== '1234') return 'Пароль минимум 6 символов'
    return null
  }

  const goNextFromStep1 = () => {
    setError('')
    const err = validateStep1()
    if (err) {
      setError(err)
      return
    }
    const allowed = new Set(visibleGroups.flatMap((g) => g.subs.map((s) => s.id)))
    setSelectedSubIds((prev) => new Set([...prev].filter((id) => allowed.has(id))))
    setPasswordStarted(false)
    setRegStep(2)
  }

  const goNextFromStep2 = () => {
    setError('')
    const err = validateStep2()
    if (err) {
      setError(err)
      return
    }
    setRegStep(3)
  }

  const validateStep3 = () => {
    if (!isLegalBusinessForm(form.businessForm)) return null
    if (!form.company.trim()) return 'Укажите название ИП или ТОО'
    if (!form.bin.trim()) return 'Укажите БИН'
    if (!form.legalAddress.trim()) return 'Укажите юридический адрес'
    if (!form.docNumber.trim()) return 'Укажите номер документа (БИН / регистрация)'
    return null
  }

  const quickTestRegister = async (preset) => {
    setError('')
    const presets = {
      specialist: { main: ['lawn'], subs: ['grass-mowing'], label: 'Специалист' },
      shop: { main: ['shop'], subs: ['gp-shop'], label: 'Магазин' },
      mixed_partner: { main: ['lawn', 'shop'], subs: ['grass-mowing', 'gp-shop'], label: 'Смешанный' },
    }
    const cfg = presets[preset]
    if (!cfg) return
    try {
      setSelectedMainIds(new Set(cfg.main))
      setSelectedSubIds(new Set(cfg.subs))
      await register({
        name: `Тест ${cfg.label}`,
        mainGroupIds: cfg.main,
        subserviceIds: cfg.subs,
        accountType: 'INDIVIDUAL',
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Ошибка регистрации')
    }
  }

  const finishRegister = async () => {
    setError('')
    const pwdErr = validatePassword()
    if (pwdErr) {
      setError(pwdErr)
      return
    }
    const step3Err = validateStep3()
    if (step3Err) {
      setError(step3Err)
      return
    }
    const subserviceIds = [...selectedSubIds]
    try {
      const isLegal = isLegalBusinessForm(form.businessForm)
      await register({
        name: form.name.trim() || undefined,
        company: (form.company.trim() || form.name.trim() || undefined),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password || undefined,
        city: form.city.trim() || 'Уральск',
        referralCode: form.referralCode.trim() || undefined,
        subserviceIds,
        mainGroupIds: [...selectedMainIds],
        accountType: isLegal ? 'LEGAL_ENTITY' : 'INDIVIDUAL',
        bin: isLegal ? form.bin.trim() : undefined,
        legalAddress: isLegal ? form.legalAddress.trim() : undefined,
        documents: isLegal
          ? [{ kind: form.docKind, number: form.docNumber.trim() }]
          : undefined,
      })
    } catch (err) {
      setError(err?.message || 'Ошибка регистрации')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const pwdErr = validatePassword()
    if (pwdErr) {
      setError(pwdErr)
      return
    }
    try {
      await login(form.email, form.password)
    } catch (err) {
      setError(err?.message || 'Ошибка входа')
    }
  }

  const onFormSubmit = (e) => {
    e.preventDefault()
    if (mode === 'login') handleLogin(e)
    else if (regStep === 3) finishRegister()
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center gp-app-bg text-[var(--gp-text-muted)]">
        Загрузка…
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto gp-app-bg">
      <div className="mb-6 gp-animate-in">
        <h1 className="text-2xl font-extrabold gp-text-gradient">GP Partner</h1>
        <p className="text-[var(--gp-text-muted)] text-sm mt-1">
          {mode === 'register' ? 'Регистрация специалиста' : 'Вход в аккаунт'}
        </p>
        {import.meta.env.DEV && mode === 'register' && (
          <p className="text-[11px] text-emerald-600/90 mt-2">
            MVP: email, телефон и пароль можно оставить пустыми — подставятся тестовые значения. Регион не обязателен.
          </p>
        )}
      </div>

      {import.meta.env.DEV && mode === 'register' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" disabled={loading} onClick={() => quickTestRegister('specialist')} className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/20">
            Тест: specialist
          </button>
          <button type="button" disabled={loading} onClick={() => quickTestRegister('shop')} className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/20">
            Тест: shop
          </button>
          <button type="button" disabled={loading} onClick={() => quickTestRegister('mixed_partner')} className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/20">
            Тест: mixed_partner
          </button>
        </div>
      )}

      <div className="flex bg-[var(--gp-surface)] rounded-2xl p-1 mb-5 border border-[var(--gp-border)] shadow-sm">
        {['register', 'login'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(''); resetRegister() }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
              mode === m ? 'gp-gradient-kaspi text-white shadow-md' : 'text-[var(--gp-text-muted)]'
            }`}
          >
            {m === 'register' ? 'Регистрация' : 'Вход'}
          </button>
        ))}
      </div>

      {mode === 'register' && <StepDots step={regStep} />}

      <form onSubmit={onFormSubmit} noValidate className="gp-card-kaspi p-5 space-y-4">
        {/* ——— Регистрация: шаг 1 — услуги ——— */}
        {mode === 'register' && regStep === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">Какие услуги вы оказываете?</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Сначала выберите направления, затем конкретные работы. Заявки приходят только по активным позициям после модерации.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Направления</p>
              <div className="grid gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-white/5 bg-[#0a0f1a]/60 p-2">
                {SERVICE_GROUPS.map((g) => (
                  <label
                    key={g.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${
                      selectedMainIds.has(g.id) ? 'bg-emerald-500/10 border border-emerald-500/40' : 'border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-500 w-4 h-4"
                      checked={selectedMainIds.has(g.id)}
                      onChange={() => toggleMain(g.id)}
                    />
                    <span className="text-sm text-slate-200">{g.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {visibleGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Подуслуги · выбрано {selectedSubIds.size}
                </p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-0.5">
                  {visibleGroups.map((g) => (
                    <div key={g.id} className="rounded-xl border border-white/5 bg-[#0a0f1a]/50 p-3">
                      <p className="text-xs font-medium text-emerald-400/90 mb-2">{g.title}</p>
                      <div className="space-y-1">
                        {g.subs.map((s) => (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm ${
                              selectedSubIds.has(s.id) ? 'text-slate-100 bg-emerald-500/10' : 'text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="accent-emerald-500 w-3.5 h-3.5"
                              checked={selectedSubIds.has(s.id)}
                              onChange={() => toggleSub(s.id)}
                            />
                            <span>{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ——— Регистрация: шаг 2 — контакты ——— */}
        {mode === 'register' && regStep === 2 && (
          <div className="gp-form-stack">
            <div>
              <p className="text-sm font-semibold text-[var(--gp-text)]">Ваши контакты</p>
              <p className="text-[11px] text-slate-500 mt-1">Для входа и уведомлений о новых заявках</p>
            </div>
            <label className="block">
              <span className="gp-form-hint">Имя / ФИО</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="gp-input-kaspi"
                placeholder="Бауыржан Нурланов"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="gp-form-hint">Телефон</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="gp-input-kaspi"
                placeholder="+7 701 234 56 78"
                autoComplete="tel"
              />
            </label>
            <label className="block">
              <span className="gp-form-hint">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="gp-input-kaspi"
                placeholder="partner@example.kz"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="gp-form-hint">Пароль</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => {
                  const v = e.target.value
                  if (v.length > 0) setPasswordStarted(true)
                  setForm({ ...form, password: v })
                  if (error && (error.includes('парол') || error.includes('Парол'))) setError('')
                }}
                className="gp-input-kaspi"
                placeholder="Минимум 6 символов"
                autoComplete="new-password"
              />
              {passwordStarted && form.password.length > 0 && form.password.length < 6 && (
                <p className="text-slate-500 text-xs mt-1.5">Ещё {6 - form.password.length} симв.</p>
              )}
            </label>
          </div>
        )}

        {/* ——— Регистрация: шаг 3 — компания и подтверждение ——— */}
        {mode === 'register' && regStep === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold">Тип регистрации</p>
              <p className="text-[11px] text-[var(--gp-text-muted)] mt-1">Заполните только нужное</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BUSINESS_FORMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, businessForm: t.id, accountType: t.accountType })}
                  className={`py-3 rounded-2xl text-sm font-bold transition ${
                    form.businessForm === t.id
                      ? 'gp-gradient-kaspi text-white shadow-md'
                      : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold">Профиль в GP</p>
              <p className="text-[11px] text-[var(--gp-text-muted)] mt-1">Как вас увидят клиенты</p>
            </div>
            <label className="block">
              <span className="gp-form-hint">
                {form.businessForm === 'too' ? 'Название ТОО' : form.businessForm === 'ip' ? 'ИП / бренд' : 'Ник / бренд'}
              </span>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="gp-input-kaspi"
                placeholder={form.businessForm === 'individual' ? 'Необязательно' : 'Укажите название'}
              />
            </label>
            <label className="block">
              <span className="gp-form-hint">Город работы</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="gp-input-kaspi"
                placeholder="Уральск"
              />
            </label>
            <input
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
              className="gp-input-kaspi"
              placeholder="Код приглашения GP (необязательно)"
            />

            {isLegalBusinessForm(form.businessForm) && (
              <div className="space-y-3 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-4">
                <p className="text-sm font-bold">Реквизиты юрлица</p>
                <label className="block">
                  <span className="gp-form-hint">БИН</span>
                  <input
                    value={form.bin}
                    onChange={(e) => setForm({ ...form, bin: e.target.value })}
                    className="gp-input-kaspi"
                    placeholder="12 цифр"
                    inputMode="numeric"
                    required
                  />
                </label>
                <label className="block">
                  <span className="gp-form-hint">Юридический адрес</span>
                  <input
                    value={form.legalAddress}
                    onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
                    className="gp-input-kaspi"
                    placeholder="Город, улица, офис"
                    required
                  />
                </label>
                <label className="block">
                  <span className="gp-form-hint">Документ</span>
                  <select
                    value={form.docKind}
                    onChange={(e) => setForm({ ...form, docKind: e.target.value })}
                    className="gp-input-kaspi"
                  >
                    {PARTNER_DOCUMENT_KIND_OPTIONS.filter((d) =>
                      ['BIN_CERTIFICATE', 'COMPANY_REGISTRATION'].includes(d.id),
                    ).map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="gp-form-hint">Номер документа</span>
                  <input
                    value={form.docNumber}
                    onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                    className="gp-input-kaspi"
                    placeholder="Номер свидетельства"
                    required
                  />
                </label>
              </div>
            )}

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Проверьте данные</p>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--gp-text-muted)]">Имя</dt>
                  <dd className="font-semibold text-right">{form.name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Телефон</dt>
                  <dd className="text-slate-200 text-right">{form.phone || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-slate-200 text-right truncate max-w-[55%]">{form.email}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--gp-text-muted)]">Тип</dt>
                  <dd className="font-semibold text-right">
                    {BUSINESS_FORMS.find((b) => b.id === form.businessForm)?.label || '—'}
                  </dd>
                </div>
                {isLegalBusinessForm(form.businessForm) && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--gp-text-muted)]">БИН</dt>
                      <dd className="font-semibold text-right">{form.bin || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--gp-text-muted)]">Юр. адрес</dt>
                      <dd className="font-semibold text-right text-xs max-w-[55%]">{form.legalAddress || '—'}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--gp-text-muted)]">Город</dt>
                  <dd className="font-semibold text-right">{form.city || 'Уральск'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs mb-1">Услуги ({selectedSubIds.size})</dt>
                  <dd className="flex flex-wrap gap-1">
                    {selectedSubLabels.slice(0, 6).map((label) => (
                      <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                        {label}
                      </span>
                    ))}
                    {selectedSubLabels.length > 6 && (
                      <span className="text-[10px] text-slate-500">+{selectedSubLabels.length - 6}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* ——— Вход ——— */}
        {mode === 'login' && (
          <div className="gp-form-stack">
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="gp-input-kaspi"
              placeholder="uralsk_partner или partner@gp.kz"
              autoComplete="username"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="gp-input-kaspi"
              placeholder="Пароль"
              autoComplete="current-password"
            />
            <p className="text-[11px] text-slate-500">API: partner@gp.kz / password123 · Demo: uralsk_partner / 1234</p>
            <Link to="/forgot-password" className="text-xs text-emerald-400 hover:underline">Забыли пароль?</Link>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {mode === 'register' && regStep > 1 && (
            <button
              type="button"
              onClick={() => { setError(''); setRegStep((s) => s - 1) }}
              className="flex items-center justify-center gap-1 px-4 py-3.5 rounded-2xl border border-white/15 text-slate-300 font-semibold text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
          )}
          {mode === 'register' && regStep === 1 && (
            <button
              type="button"
              onClick={goNextFromStep1}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md"
            >
              Далее <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {mode === 'register' && regStep === 2 && (
            <button
              type="button"
              onClick={goNextFromStep2}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md"
            >
              Далее <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {(mode === 'login' || (mode === 'register' && regStep === 3)) && (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md disabled:opacity-50"
            >
              {loading ? (
                '…'
              ) : mode === 'login' ? (
                'Войти'
              ) : (
                <>
                  <Check className="w-4 h-4" /> Зарегистрироваться
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {mode === 'register' && (
        <p className="text-center text-[11px] text-slate-600 mt-4">
          Шаг {regStep} из {REG_STEPS}
        </p>
      )}

      <p className="text-center text-xs text-slate-600 mt-6">
        <a href={getServiceWebUrl()} className="text-emerald-500 hover:underline">GP Service</a> — для клиентов
      </p>
    </div>
  )
}
