import { useState } from 'react'
import { api } from '../api/client.js'
import { useLanguage } from '../i18n/index.js'

const COPY = {
  ru: {
    phoneRequired: 'Введите номер телефона',
    channel: 'Куда отправить код',
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    smsNotSent: 'SMS-доставка не настроена на сервере. Для теста используйте DEV код.',
    whatsappNotSent: 'WhatsApp-доставка не настроена на сервере. Для теста используйте DEV код.',
    sendError: 'Ошибка отправки OTP',
    otpRequired: 'Введите OTP код',
    wrongCode: 'Неверный код',
    hint: 'Код будет отправлен по выбранному каналу',
    send: 'Отправить OTP',
    enterCode: (phone, channel) => `${phone} — введите код из ${channel}`,
    devCode: 'Dev код',
    devHint: 'DEV режим: используйте код 0000',
    placeholder: '4 цифры',
    confirm: 'Подтвердить',
    otherPhone: 'Другой номер',
  },
  kk: {
    phoneRequired: 'Телефон нөмірін енгізіңіз',
    channel: 'Кодты қайда жібереміз',
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    smsNotSent: 'Серверде SMS жіберу бапталмаған. Тест үшін DEV кодын пайдаланыңыз.',
    whatsappNotSent: 'Серверде WhatsApp жіберу бапталмаған. Тест үшін DEV кодын пайдаланыңыз.',
    sendError: 'OTP жіберу қатесі',
    otpRequired: 'OTP кодын енгізіңіз',
    wrongCode: 'Код қате',
    hint: 'Код таңдалған арна арқылы жіберіледі',
    send: 'OTP жіберу',
    enterCode: (phone, channel) => `${phone} — ${channel} кодын енгізіңіз`,
    devCode: 'Dev код',
    devHint: 'DEV режим: 0000 кодын пайдаланыңыз',
    placeholder: '4 сан',
    confirm: 'Растау',
    otherPhone: 'Басқа нөмір',
  },
  en: {
    phoneRequired: 'Enter a phone number',
    channel: 'Send code to',
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    smsNotSent: 'SMS delivery is not configured on the server. Use the DEV code for testing.',
    whatsappNotSent: 'WhatsApp delivery is not configured on the server. Use the DEV code for testing.',
    sendError: 'OTP send error',
    otpRequired: 'Enter the OTP code',
    wrongCode: 'Invalid code',
    hint: 'The code will be sent through the selected channel',
    send: 'Send OTP',
    enterCode: (phone, channel) => `${phone} — enter the code from ${channel}`,
    devCode: 'Dev code',
    devHint: 'DEV mode: use code 0000',
    placeholder: '4 digits',
    confirm: 'Confirm',
    otherPhone: 'Use another number',
  },
}

/**
 * Телефон + OTP. Historical export name is kept for Partner/Admin compatibility.
 */
export function WhatsappOtpLogin({
  deviceId,
  deviceName = 'GP Web',
  loginAs = 'client',
  desiredRole,
  accountType,
  defaultChannel = 'sms',
  onVerified,
  className = '',
  inputClassName = 'w-full p-3 rounded-xl border border-[var(--gp-border,#334155)] bg-[var(--gp-surface,#1e293b)] text-[var(--gp-text,#f8fafc)]',
  buttonClassName = 'w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50',
}) {
  const { lang = 'ru' } = useLanguage()
  const copy = COPY[lang] || COPY.ru
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState(defaultChannel)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')

  const sendCode = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    if (!phone.trim()) {
      setError(copy.phoneRequired)
      return
    }
    setLoading(true)
    try {
      const res = await api.sendOtp(phone.trim(), channel)
      const sent = channel === 'sms' ? res.smsSent !== false : res.whatsappSent !== false
      if (res.devCode) setDevCode(String(res.devCode))
      if (!sent && !res.devCode) {
        setError(channel === 'sms' ? copy.smsNotSent : copy.whatsappNotSent)
        return
      }
      setStep(2)
    } catch (err) {
      setError(err?.message || copy.sendError)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    if (!otp.trim()) {
      setError(copy.otpRequired)
      return
    }
    setLoading(true)
    try {
      const body = {
        phone: phone.trim(),
        code: otp.trim(),
        deviceId,
        deviceName,
        platform: 'web',
        loginAs,
      }
      if (desiredRole) body.desiredRole = desiredRole
      if (accountType) body.accountType = accountType
      const session = await api.verifyOtp(body)
      await onVerified(session)
    } catch (err) {
      setError(err?.message || copy.wrongCode)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <form onSubmit={sendCode} className={`space-y-3 ${className}`}>
        <p className="text-xs text-[var(--gp-text-muted,#94a3b8)]">
          {copy.hint}
        </p>
        <div>
          <p className="text-xs font-semibold text-[var(--gp-text-muted,#94a3b8)] mb-2">
            {copy.channel}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['sms', copy.sms],
              ['whatsapp', copy.whatsapp],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannel(id)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  channel === id
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-white/10 text-[var(--gp-text-muted,#94a3b8)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {import.meta.env.DEV && (
          <p className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
            {copy.devHint}
          </p>
        )}
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClassName}
          placeholder="+7 701 234 56 78"
          autoComplete="tel"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClassName}>
          {loading ? '…' : copy.send}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={verifyCode} className={`space-y-3 ${className}`}>
      <p className="text-xs text-[var(--gp-text-muted,#94a3b8)]">
        {copy.enterCode(phone, channel === 'sms' ? copy.sms : copy.whatsapp)}
      </p>
      {devCode && (
        <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1">
          {copy.devHint} · {copy.devCode}: {devCode}
        </p>
      )}
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className={inputClassName}
        placeholder={copy.placeholder}
        inputMode="numeric"
        autoComplete="one-time-code"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className={buttonClassName}>
        {loading ? '…' : copy.confirm}
      </button>
      <button
        type="button"
        className="w-full text-xs text-[var(--gp-text-muted,#94a3b8)] underline"
        onClick={() => { setStep(1); setOtp(''); setError('') }}
      >
        {copy.otherPhone}
      </button>
    </form>
  )
}
