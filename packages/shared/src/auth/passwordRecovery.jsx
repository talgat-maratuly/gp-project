import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'

const defaultT = (key) =>
  ({
    auth_forgot_title: 'Восстановить пароль',
    auth_forgot_hint: 'Введите email или телефон — отправим код',
    auth_email: 'Email',
    auth_phone: 'Телефон',
    auth_send_code: 'Отправить код',
    auth_back_login: 'Назад ко входу',
    auth_reset_title: 'Новый пароль',
    auth_otp: 'Код из SMS / email',
    auth_verify: 'Подтвердить код',
    auth_new_password: 'Новый пароль',
    auth_save_password: 'Сохранить пароль',
    auth_success: 'Пароль обновлён. Войдите с новым паролем.',
    loading: 'Загрузка…',
    error: 'Ошибка',
  })[key] || key

export function ForgotPasswordScreen({
  loginPath = '/login',
  resetPath = '/reset-password',
  t = defaultT,
  className = '',
}) {
  const navigate = useNavigate()
  const [channel, setChannel] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const body =
        channel === 'email'
          ? { email: email.trim() }
          : { phone: phone.trim() }
      const res = await api.forgotPassword(body)
      setInfo(res.message || t('auth_forgot_hint'))
      const params = new URLSearchParams()
      if (channel === 'email') params.set('email', email.trim())
      else params.set('phone', phone.trim())
      if (res.devCode) params.set('devCode', res.devCode)
      if (res.devResetToken) params.set('devToken', res.devResetToken)
      navigate(`${resetPath}?${params}`)
    } catch (err) {
      setError(err?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto p-4 ${className}`}>
      <h1 className="text-xl font-bold mb-2 text-[var(--gp-text,#f8fafc)]">{t('auth_forgot_title')}</h1>
      <p className="text-sm text-[var(--gp-text-muted,#94a3b8)] mb-4">{t('auth_forgot_hint')}</p>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${channel === 'email' ? 'border-emerald-500 text-emerald-600' : 'border-[var(--gp-border,#334155)] text-[var(--gp-text-muted,#94a3b8)]'}`}
          onClick={() => setChannel('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${channel === 'phone' ? 'border-emerald-500 text-emerald-600' : 'border-[var(--gp-border,#334155)] text-[var(--gp-text-muted,#94a3b8)]'}`}
          onClick={() => setChannel('phone')}
        >
          {t('auth_phone')}
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        {channel === 'email' ? (
          <input
            className="gp-input-kaspi w-full admin-input"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        ) : (
          <input
            className="gp-input-kaspi w-full admin-input"
            type="tel"
            placeholder="+7 701 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white disabled:opacity-50"
        >
          {loading ? t('loading') : t('auth_send_code')}
        </button>
      </form>
      <Link to={loginPath} className="block mt-4 text-center text-sm text-[var(--gp-text-muted,#94a3b8)]">
        {t('auth_back_login')}
      </Link>
    </div>
  )
}

export function ResetPasswordScreen({ loginPath = '/login', t = defaultT, className = '' }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const phone = params.get('phone') || ''
  const [otp, setOtp] = useState(params.get('devCode') || '')
  const [resetToken, setResetToken] = useState(params.get('devToken') || '')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState(resetToken ? 'password' : 'otp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const verifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body = email ? { email, otp: otp.trim() } : { phone, otp: otp.trim() }
      const res = await api.verifyResetOtp(body)
      setResetToken(res.resetToken || res.devResetToken)
      setStep('password')
    } catch (err) {
      setError(err?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.resetPassword({ resetToken, password })
      setSuccess(t('auth_success'))
      setTimeout(() => navigate(loginPath, { replace: true }), 1200)
    } catch (err) {
      setError(err?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto p-4 ${className}`}>
      <h1 className="text-xl font-bold mb-4 text-[var(--gp-text,#f8fafc)]">{t('auth_reset_title')}</h1>
      {step === 'otp' ? (
        <form onSubmit={verifyOtp} className="space-y-3">
          <input
            className="gp-input-kaspi w-full"
            placeholder={t('auth_otp')}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white disabled:opacity-50">
            {loading ? t('loading') : t('auth_verify')}
          </button>
        </form>
      ) : (
        <form onSubmit={savePassword} className="space-y-3">
          <input
            type="password"
            className="gp-input-kaspi w-full"
            placeholder={t('auth_new_password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white disabled:opacity-50">
            {loading ? t('loading') : t('auth_save_password')}
          </button>
        </form>
      )}
      <Link to={loginPath} className="block mt-4 text-center text-sm text-[var(--gp-text-muted,#94a3b8)]">
        {t('auth_back_login')}
      </Link>
    </div>
  )
}
