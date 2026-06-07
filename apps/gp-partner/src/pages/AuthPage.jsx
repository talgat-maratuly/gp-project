import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  consumeAuthReturnPath,
  resolveAuthReturnPath,
} from '@gp/shared/auth/redirect'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
  PARTNER_DOCUMENT_KIND_OPTIONS,
  BUSINESS_FORMS,
  isLegalBusinessForm,
  getServiceWebUrl,
} from '@gp/shared/constants'
import { API_URL } from '@gp/shared/api'
import { usePartner } from '../context/PartnerContext'
import { useLanguage } from '../i18n'

const SERVICE_GROUPS = [
  ...PARTNER_REGISTRATION_GROUPS,
  FURNITURE_EXECUTOR_GROUP,
]
const REG_STEPS = 3

function StepDots({ step, t }) {
  return (
    <div className="flex items-center gap-2 mb-6" aria-label={`${t('step')} ${step} ${t('of')} ${REG_STEPS}`}>
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

/** Регистрация в 3 шага. Вход вынесен на отдельную страницу `/login`. */
export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, loading, user, authReady } = usePartner()
  const { t } = useLanguage()
  const returnPath = resolveAuthReturnPath('partner', location)
  const [regStep, setRegStep] = useState(1)
  const [selectedMainIds, setSelectedMainIds] = useState(() => new Set(['lawn']))
  const [selectedSubIds, setSelectedSubIds] = useState(() => new Set())
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    company: '',
    city: t('uralsk'),
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
    if (authReady && user) {
      navigate(consumeAuthReturnPath('partner', returnPath), { replace: true })
    }
  }, [authReady, user, navigate, returnPath])

  useEffect(() => {
    if (import.meta.env.DEV) console.log('[GP Partner] API_URL =', API_URL)
  }, [])

  const visibleGroups = useMemo(
    () => SERVICE_GROUPS.filter((g) => selectedMainIds.has(g.id)),
    [selectedMainIds],
  )

  const selectedSubLabels = useMemo(
    () => [...selectedSubIds].map((id) => {
      const key = `partner_subservice_${id}`
      const value = t(key)
      return value !== key ? value : id
    }),
    [selectedSubIds, t],
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
    if (selectedMainIds.size < 1) return t('partner_auth_select_category_error')
    if (selectedSubIds.size < 1) return t('partner_auth_select_subservice_error')
    return null
  }

  const validateStep2 = () => {
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return t('partner_auth_invalid_email')
    }
    return null
  }

  const validatePassword = () => {
    if (!form.password) return null
    if (form.password.length < 6 && form.password !== '1234') return t('partner_auth_password_min')
    return null
  }

  const goNextFromStep1 = () => {
    setError('')
    const err = validateStep1()
    if (err) {
      setError(err)
      return
    }
    const allowed = new Set(visibleGroups.flatMap((g) => (g.subs || []).map((s) => s.id)))
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
    if (!form.company.trim()) return t('partner_auth_company_required')
    if (!form.bin.trim()) return t('partner_auth_bin_required')
    if (!form.legalAddress.trim()) return t('partner_auth_legal_address_required')
    if (!form.docNumber.trim()) return t('partner_auth_doc_number_required')
    return null
  }

  const quickTestRegister = async (preset) => {
    setError('')
    const presets = {
      specialist: { main: ['lawn'], subs: ['grass-mowing'], label: t('partner_auth_specialist') },
    }
    const cfg = presets[preset]
    if (!cfg) return
    try {
      setSelectedMainIds(new Set(cfg.main))
      setSelectedSubIds(new Set(cfg.subs))
      await register({
        name: `${t('test')} ${cfg.label}`,
        mainGroupIds: cfg.main,
        subserviceIds: cfg.subs,
        accountType: 'INDIVIDUAL',
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || t('partner_auth_registration_error'))
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
        city: form.city.trim() || t('uralsk'),
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
      const selectedGroups = [...selectedMainIds]
      const nextApplyPath =
        selectedGroups.length === 1 && selectedGroups[0] === 'shop'
          ? '/apply'
          : selectedGroups.length === 1 && selectedGroups[0] === 'nursery'
            ? '/apply/nursery'
            : selectedGroups.length === 1 && selectedGroups[0] === 'delivery'
              ? '/apply/delivery'
              : '/apply/specialist'
      navigate(nextApplyPath, { replace: true })
    } catch (err) {
      setError(err?.message || t('partner_auth_registration_error'))
    }
  }

  const onFormSubmit = (e) => {
    e.preventDefault()
    if (regStep === 3) finishRegister()
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center gp-app-bg text-[var(--gp-text-muted)]">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto gp-app-bg">
      <div className="mb-6 gp-animate-in">
        <h1 className="text-2xl font-extrabold gp-text-gradient">GP Partner</h1>
        <p className="text-[var(--gp-text-muted)] text-sm mt-1">
          {t('partner_auth_title')}
        </p>
        {returnPath && returnPath !== '/' && (
          <p className="text-sm text-emerald-400/90 mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            {t('auth_return_hint')}
            <span className="block text-xs text-[var(--gp-text-muted)] mt-1 truncate">{returnPath}</span>
          </p>
        )}
        {import.meta.env.DEV && (
          <p className="text-[11px] text-emerald-600/90 mt-2">
            {t('partner_auth_dev_hint')}
          </p>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" disabled={loading} onClick={() => quickTestRegister('specialist')} className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/20">
            {t('test')}: specialist
          </button>
        </div>
      )}

      <p className="text-center text-sm text-[var(--gp-text-muted)] mb-4">
        {t('partner_auth_have_account')}{' '}
        <Link to="/login" className="text-emerald-500 font-semibold hover:underline">
          {t('login')}
        </Link>
      </p>

      <StepDots step={regStep} t={t} />

      <form onSubmit={onFormSubmit} noValidate className="gp-card-kaspi p-5 space-y-4">
        {/* ——— Регистрация: шаг 1 — тип и услуги ——— */}
        {regStep === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-white">{t('partner_auth_registration_type')}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t('partner_auth_registration_type_hint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_FORMS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setForm({ ...form, businessForm: b.id, accountType: b.accountType })}
                  className={`py-3 rounded-2xl text-sm font-bold transition ${
                    form.businessForm === b.id
                      ? 'gp-gradient-kaspi text-white shadow-md'
                      : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                  }`}
                >
                  {t(`businessForm_${b.id}`)}
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold text-white">{t('partner_auth_services_question')}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {t('partner_auth_services_hint')}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('partner_profile_directions')}</p>
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
                    <span className="text-sm text-slate-200">{t(`partnerGroup_${g.id}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {visibleGroups.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  {t('partner_auth_subservices_selected')} {selectedSubIds.size}
                </p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-0.5">
                  {visibleGroups.map((g) => (
                    <div key={g.id} className="rounded-xl border border-white/5 bg-[#0a0f1a]/50 p-3">
                      <p className="text-xs font-medium text-emerald-400/90 mb-2">{t(`partnerGroup_${g.id}`)}</p>
                      <div className="space-y-1">
                        {(g.subs || []).map((s) => (
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
                            <span>{t(`partner_subservice_${s.id}`) !== `partner_subservice_${s.id}` ? t(`partner_subservice_${s.id}`) : s.id}</span>
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
        {regStep === 2 && (
          <div className="gp-form-stack">
            <div>
              <p className="text-sm font-semibold text-[var(--gp-text)]">{t('partner_auth_contacts')}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t('partner_auth_contacts_hint')}</p>
            </div>
            <label className="block">
              <span className="gp-form-hint">{t('fullName')}</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="gp-input-kaspi"
                placeholder="Бауыржан Нурланов"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="gp-form-hint">{t('phone')}</span>
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
              <span className="gp-form-hint">{t('password')}</span>
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
                placeholder={t('partner_auth_password_placeholder')}
                autoComplete="new-password"
              />
              {passwordStarted && form.password.length > 0 && form.password.length < 6 && (
                <p className="text-slate-500 text-xs mt-1.5">{t('partner_auth_password_left')} {6 - form.password.length}</p>
              )}
            </label>
          </div>
        )}

        {/* ——— Регистрация: шаг 3 — компания и подтверждение ——— */}
        {regStep === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold">{t('partner_auth_gp_profile')}</p>
              <p className="text-[11px] text-[var(--gp-text-muted)] mt-1">{t('partner_auth_gp_profile_hint')}</p>
            </div>
            <label className="block">
              <span className="gp-form-hint">
                {form.businessForm === 'too' ? t('partner_auth_too_name') : form.businessForm === 'ip' ? t('partner_auth_ip_brand') : t('partner_auth_nickname_brand')}
              </span>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="gp-input-kaspi"
                placeholder={form.businessForm === 'individual' ? t('optional') : t('partner_auth_company_placeholder')}
              />
            </label>
            <label className="block">
              <span className="gp-form-hint">{t('partner_auth_work_city')}</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="gp-input-kaspi"
                placeholder={t('uralsk')}
              />
            </label>
            <input
              value={form.referralCode}
              onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
              className="gp-input-kaspi"
              placeholder={t('partner_auth_referral_placeholder')}
            />

            {isLegalBusinessForm(form.businessForm) && (
              <div className="space-y-3 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-4">
                <p className="text-sm font-bold">{t('partner_auth_legal_details')}</p>
                <label className="block">
                  <span className="gp-form-hint">БИН</span>
                  <input
                    value={form.bin}
                    onChange={(e) => setForm({ ...form, bin: e.target.value })}
                    className="gp-input-kaspi"
                    placeholder={t('partner_auth_bin_placeholder')}
                    inputMode="numeric"
                    required
                  />
                </label>
                <label className="block">
                  <span className="gp-form-hint">{t('legalAddress')}</span>
                  <input
                    value={form.legalAddress}
                    onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
                    className="gp-input-kaspi"
                    placeholder={t('partner_auth_legal_address_placeholder')}
                    required
                  />
                </label>
                <label className="block">
                  <span className="gp-form-hint">{t('document')}</span>
                  <select
                    value={form.docKind}
                    onChange={(e) => setForm({ ...form, docKind: e.target.value })}
                    className="gp-input-kaspi"
                  >
                    {PARTNER_DOCUMENT_KIND_OPTIONS.filter((d) =>
                      ['BIN_CERTIFICATE', 'COMPANY_REGISTRATION'].includes(d.id),
                    ).map((d) => (
                      <option key={d.id} value={d.id}>{t(`partnerDocument_${d.id}`)}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="gp-form-hint">{t('partner_auth_doc_number')}</span>
                  <input
                    value={form.docNumber}
                    onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                    className="gp-input-kaspi"
                    placeholder={t('partner_auth_doc_number_placeholder')}
                    required
                  />
                </label>
              </div>
            )}

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('partner_auth_check_data')}</p>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--gp-text-muted)]">{t('name')}</dt>
                  <dd className="font-semibold text-right">{form.name || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t('phone')}</dt>
                  <dd className="text-slate-200 text-right">{form.phone || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-slate-200 text-right truncate max-w-[55%]">{form.email}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--gp-text-muted)]">{t('type')}</dt>
                  <dd className="font-semibold text-right">
                    {t(`businessForm_${form.businessForm}`)}
                  </dd>
                </div>
                {isLegalBusinessForm(form.businessForm) && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--gp-text-muted)]">{t('bin')}</dt>
                      <dd className="font-semibold text-right">{form.bin || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--gp-text-muted)]">{t('legalAddressShort')}</dt>
                      <dd className="font-semibold text-right text-xs max-w-[55%]">{form.legalAddress || '—'}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--gp-text-muted)]">{t('city')}</dt>
                  <dd className="font-semibold text-right">{form.city || t('uralsk')}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs mb-1">{t('services')} ({selectedSubIds.size})</dt>
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

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {regStep > 1 && (
            <button
              type="button"
              onClick={() => { setError(''); setRegStep((s) => s - 1) }}
              className="flex items-center justify-center gap-1 px-4 py-3.5 rounded-2xl border border-white/15 text-slate-300 font-semibold text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> {t('back')}
            </button>
          )}
          {regStep === 1 && (
            <button
              type="button"
              onClick={goNextFromStep1}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md"
            >
              {t('next')} <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {regStep === 2 && (
            <button
              type="button"
              onClick={goNextFromStep2}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md"
            >
              {t('next')} <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {regStep === 3 ? (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl gp-gradient-kaspi text-white font-bold text-sm shadow-md disabled:opacity-50"
            >
              {loading ? '…' : (
                <>
                  <Check className="w-4 h-4" /> {t('register')}
                </>
              )}
            </button>
          ) : null}
        </div>
      </form>

      <p className="text-center text-[11px] text-slate-600 mt-4">
        {t('step')} {regStep} {t('of')} {REG_STEPS}
      </p>

      <p className="text-center text-xs text-slate-600 mt-6">
        <a href={getServiceWebUrl()} className="text-emerald-500 hover:underline">GP Service</a> — {t('partner_auth_for_clients')}
      </p>
    </div>
  )
}
