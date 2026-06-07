import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  consumeAuthReturnPath,
} from '@gp/shared/auth/redirect'
import { useService } from '../../context/ServiceContext'
import { KaspiButton, KaspiCard } from '@gp/shared/ui/KaspiUI'
import { getDeviceId, getRefreshToken } from '@gp/shared/api/token'
import { useLanguage } from '../../i18n'

const copy = {
  ru: {
    title: 'Вход и регистрация',
    subtitle: 'GP Service',
    role: 'Тип клиента *',
    client: 'Физ лицо',
    legalClient: 'Юр лицо',
    legalForm: 'Форма юрлица',
    ip: 'ИП',
    too: 'ТОО',
    otherLegal: 'Другое',
    companyName: 'Название компании',
    bin: 'БИН',
    city: 'Город',
    phone: 'Телефон',
    phoneRequired: 'Введите номер телефона',
    otpChannel: 'Куда отправить код',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    otpHint: 'OTP нужен только для первого входа или нового устройства.',
    sendOtp: 'Отправить OTP',
    otpRequired: 'Введите OTP-код',
    otpConfirm: 'Подтверждение OTP для {role}',
    otpPlaceholder: '4-8 цифр',
    confirm: 'Подтвердить',
    trustedLogin: 'Войти через Face ID / Touch ID',
    trustedHint: 'Для доверенного устройства OTP не требуется.',
    legalRequired: 'Заполните название компании, БИН из 12 цифр и город',
    egovVerified: 'Компания проверена через {provider}',
    egovUnavailable: 'eGov недоступен, заявка уйдет на ручную проверку',
    ecpHint: 'После регистрации Admin проверит БИН, документы и ЭЦП. ЭЦП понадобится для договоров, актов и юридически значимых действий.',
    devHint: 'DEV режим: используйте код 0000',
    devCode: 'DEV OTP код',
  },
  kk: {
    title: 'Кіру және тіркелу',
    subtitle: 'GP Service',
    role: 'Клиент түрі *',
    client: 'Жеке тұлға',
    legalClient: 'Заңды тұлға',
    legalForm: 'Заңды тұлға формасы',
    ip: 'ЖК',
    too: 'ЖШС',
    otherLegal: 'Басқа',
    companyName: 'Компания атауы',
    bin: 'БИН',
    city: 'Қала',
    phone: 'Телефон',
    phoneRequired: 'Телефон нөмірін енгізіңіз',
    otpChannel: 'Кодты қайда жібереміз',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    otpHint: 'OTP тек бірінші кіру немесе жаңа құрылғы үшін керек.',
    sendOtp: 'OTP жіберу',
    otpRequired: 'OTP кодын енгізіңіз',
    otpConfirm: '{role} үшін OTP растау',
    otpPlaceholder: '4-8 сан',
    confirm: 'Растау',
    trustedLogin: 'Face ID / Touch ID арқылы кіру',
    trustedHint: 'Сенімді құрылғыда OTP қажет емес.',
    legalRequired: 'Компания атауын, 12 санды БИН және қаланы толтырыңыз',
    egovVerified: 'Компания {provider} арқылы тексерілді',
    egovUnavailable: 'eGov қолжетімсіз, өтінім қолмен тексеріледі',
    ecpHint: 'Тіркелгеннен кейін Admin БИН, құжаттар және ЭЦП тексереді. ЭЦП шарттар, актілер және заңды әрекеттер үшін қолданылады.',
    devHint: 'DEV режим: 0000 кодын пайдаланыңыз',
    devCode: 'DEV OTP коды',
  },
  en: {
    title: 'Sign in and register',
    subtitle: 'GP Service',
    role: 'Client type *',
    client: 'Individual',
    legalClient: 'Legal entity',
    legalForm: 'Legal form',
    ip: 'Individual entrepreneur',
    too: 'LLP',
    otherLegal: 'Other',
    companyName: 'Company name',
    bin: 'BIN',
    city: 'City',
    phone: 'Phone',
    phoneRequired: 'Enter your phone number',
    otpChannel: 'Send code to',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    otpHint: 'OTP is only needed for first login or a new device.',
    sendOtp: 'Send OTP',
    otpRequired: 'Enter the OTP code',
    otpConfirm: 'OTP confirmation for {role}',
    otpPlaceholder: '4-8 digits',
    confirm: 'Confirm',
    trustedLogin: 'Sign in with Face ID / Touch ID',
    trustedHint: 'Trusted devices do not need OTP.',
    legalRequired: 'Fill company name, 12-digit BIN and city',
    egovVerified: 'Company checked via {provider}',
    egovUnavailable: 'eGov is unavailable, application will go to manual review',
    ecpHint: 'After registration Admin checks BIN, documents and EDS. EDS is used for contracts, acts and legally significant actions.',
    devHint: 'DEV mode: use code 0000',
    devCode: 'DEV OTP code',
  },
}

export default function ClientAuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLanguage()
  const text = copy[lang] || copy.ru
  const from = location.state?.from || new URLSearchParams(location.search).get('from') || '/'
  const { verifyOtp, sendOtp, checkLegalCompany, loginTrustedDevice, isLoggedIn } = useService()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('INDIVIDUAL')
  const [legalForm, setLegalForm] = useState('IP')
  const [otpChannel, setOtpChannel] = useState('whatsapp')
  const [hasTrustedSession, setHasTrustedSession] = useState(() => Boolean(getRefreshToken()))
  const [egovCheck, setEgovCheck] = useState(null)
  const [devOtpCode, setDevOtpCode] = useState('')
  const [form, setForm] = useState({
    phone: '',
    otp: '',
    companyName: '',
    bin: '',
    city: 'Уральск',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLegalClient = role === 'LEGAL_ENTITY'
  const accountType = isLegalClient ? 'LEGAL_ENTITY' : 'INDIVIDUAL'
  const roleLabel = useMemo(
    () => {
      const formLabel = legalForm === 'IP' ? text.ip : legalForm === 'TOO' ? text.too : text.otherLegal
      return isLegalClient ? `${text.legalClient} (${formLabel})` : text.client
    },
    [isLegalClient, legalForm, text.client, text.ip, text.legalClient, text.otherLegal, text.too],
  )

  if (isLoggedIn) {
    navigate(consumeAuthReturnPath('service', from), { replace: true })
    return null
  }

  const requestOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.phone.trim()) {
      setError(text.phoneRequired)
      return
    }
    if (isLegalClient && (!form.companyName.trim() || !/^\d{12}$/.test(form.bin.trim()) || !form.city.trim())) {
      setError(text.legalRequired)
      return
    }
    setLoading(true)
    try {
      if (isLegalClient) {
        const check = await checkLegalCompany({
          identifier: form.bin.trim(),
          companyName: form.companyName.trim(),
        })
        setEgovCheck(check)
      }
      const otpResponse = await sendOtp(form.phone, otpChannel)
      setDevOtpCode(otpResponse?.devCode ? String(otpResponse.devCode) : '')
      setStep(2)
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const trustedLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await loginTrustedDevice()
      navigate(from, { replace: true })
    } catch (err) {
      setHasTrustedSession(false)
      setError(err.message === 'NO_REFRESH_SESSION' ? text.otpHint : err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const confirmOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.otp.trim()) {
      setError(text.otpRequired)
      return
    }
    setLoading(true)
    try {
      await verifyOtp({
        phone: form.phone,
        code: form.otp.trim(),
        deviceId: getDeviceId(),
        deviceName: 'GP Service Web',
        platform: 'web',
        loginAs: 'client',
        accountType,
        legalForm: isLegalClient ? legalForm : undefined,
        companyName: isLegalClient ? form.companyName.trim() : undefined,
        bin: isLegalClient ? form.bin.trim() : undefined,
        city: isLegalClient ? form.city.trim() : undefined,
        name: isLegalClient ? form.companyName.trim() : undefined,
        contactPerson: isLegalClient ? form.companyName.trim() : undefined,
        rememberDevice: true,
        enableBiometric: true,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full p-4 rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] text-[var(--gp-text)]'

  return (
    <div className="px-4 py-6 max-w-md mx-auto gp-animate-in">
      <h1 className="text-2xl font-extrabold mb-2">{text.title}</h1>
      <p className="text-sm text-[var(--gp-text-muted)] mb-4">{text.subtitle}</p>
      {step === 1 && (
        <form onSubmit={requestOtp}>
          <KaspiCard className="!p-5 space-y-4">
            {hasTrustedSession && (
              <div className="space-y-2">
                <KaspiButton type="button" onClick={trustedLogin} disabled={loading}>
                  {loading ? '...' : text.trustedLogin}
                </KaspiButton>
                <p className="text-xs text-[var(--gp-text-muted)]">{text.trustedHint}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">{text.role}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'INDIVIDUAL', label: text.client },
                  { id: 'LEGAL_ENTITY', label: text.legalClient },
                ].map(({ id, label }) => (
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
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {isLegalClient && (
              <div>
                <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">{text.legalForm}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'IP', label: text.ip },
                    { id: 'TOO', label: text.too },
                    { id: 'OTHER', label: text.otherLegal },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLegalForm(id)}
                      className={`py-3 px-2 rounded-2xl text-sm font-bold transition ${
                        legalForm === id
                          ? 'gp-gradient-kaspi text-white shadow-md'
                          : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3 mt-3">
                  <input
                    className={inputClass}
                    placeholder={text.companyName}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder={text.bin}
                    value={form.bin}
                    onChange={(e) => setForm({ ...form, bin: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  />
                  <input
                    className={inputClass}
                    placeholder={text.city}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                  <p className="text-xs text-[var(--gp-text-muted)]">{text.ecpHint}</p>
                  {egovCheck && (
                    <p
                      className={`text-xs font-semibold ${
                        egovCheck.status === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {egovCheck.status === 'VERIFIED'
                        ? text.egovVerified.replace('{provider}', egovCheck.provider || 'eGov')
                        : text.egovUnavailable}
                    </p>
                  )}
                </div>
              </div>
            )}
            <label className="block">
              <span className="text-sm font-semibold mb-1 block">{text.phone}</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
                placeholder="+7 701 234 56 78"
              />
            </label>
            <div>
              <p className="text-xs font-bold text-[var(--gp-text-muted)] uppercase mb-2">{text.otpChannel}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'whatsapp', label: text.whatsapp },
                  { id: 'sms', label: text.sms },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOtpChannel(id)}
                    className={`py-3 rounded-2xl text-sm font-bold transition ${
                      otpChannel === id
                        ? 'gp-gradient-kaspi text-white shadow-md'
                        : 'bg-[var(--gp-surface-2)] border border-[var(--gp-border)] text-[var(--gp-text-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--gp-text-muted)]">{text.otpHint}</p>
            {import.meta.env.DEV && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {text.devHint}
              </p>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <KaspiButton type="submit" disabled={loading}>{loading ? '...' : text.sendOtp}</KaspiButton>
          </KaspiCard>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={confirmOtp}>
          <KaspiCard className="!p-5 space-y-4">
            <p className="text-sm text-[var(--gp-text-muted)]">{text.otpConfirm.replace('{role}', roleLabel)}</p>
            {import.meta.env.DEV && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                {text.devHint}{devOtpCode ? ` · ${text.devCode}: ${devOtpCode}` : ''}
              </p>
            )}
            <label className="block">
              <span className="text-sm font-semibold mb-1 block">OTP</span>
              <input value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} className={inputClass} placeholder={text.otpPlaceholder} />
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <KaspiButton type="submit" disabled={loading}>{loading ? '...' : text.confirm}</KaspiButton>
          </KaspiCard>
        </form>
      )}
    </div>
  )
}
