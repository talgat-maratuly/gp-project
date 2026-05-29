import { useState } from 'react'
import { api } from '../api/client.js'

/**
 * Телефон + OTP (әдепкі арна — WhatsApp). Service / Partner / Admin веб кіруі.
 */
export function WhatsappOtpLogin({
  deviceId,
  deviceName = 'GP Web',
  loginAs = 'client',
  desiredRole,
  accountType,
  onVerified,
  className = '',
  inputClassName = 'w-full p-3 rounded-xl border border-[var(--gp-border,#334155)] bg-[var(--gp-surface,#1e293b)] text-[var(--gp-text,#f8fafc)]',
  buttonClassName = 'w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50',
}) {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')

  const sendCode = async (e) => {
    e.preventDefault()
    setError('')
    if (!phone.trim()) {
      setError('Телефон нөмірін енгізіңіз')
      return
    }
    setLoading(true)
    try {
      const res = await api.sendOtp(phone.trim(), 'whatsapp')
      if (res.devCode) setDevCode(String(res.devCode))
      setStep(2)
    } catch (err) {
      setError(err?.message || 'OTP жіберу қатесі')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp.trim()) {
      setError('OTP кодын енгізіңіз')
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
      setError(err?.message || 'Код қате')
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <form onSubmit={sendCode} className={`space-y-3 ${className}`}>
        <p className="text-xs text-[var(--gp-text-muted,#94a3b8)]">
          Код WhatsApp арқылы жіберіледі
        </p>
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
          {loading ? '…' : 'WhatsApp OTP жіберу'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={verifyCode} className={`space-y-3 ${className}`}>
      <p className="text-xs text-[var(--gp-text-muted,#94a3b8)]">
        {phone} — WhatsApp кодын енгізіңіз
      </p>
      {devCode && (
        <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1">
          Dev код: {devCode}
        </p>
      )}
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className={inputClassName}
        placeholder="6 сан"
        inputMode="numeric"
        autoComplete="one-time-code"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className={buttonClassName}>
        {loading ? '…' : 'Растау'}
      </button>
      <button
        type="button"
        className="w-full text-xs text-[var(--gp-text-muted,#94a3b8)] underline"
        onClick={() => { setStep(1); setOtp(''); setError('') }}
      >
        Басқа нөмір
      </button>
    </form>
  )
}
