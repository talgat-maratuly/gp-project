import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { WhatsappOtpLogin } from '@gp/shared/auth/whatsappOtpLogin'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LoginPage() {
  const { login, loginViaWhatsappOtp } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [loginMethod, setLoginMethod] = useState('whatsapp')
  const [username, setUsername] = useState('admin@gp.kz')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError(t('login_error'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">
      <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md admin-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-300"><Shield className="w-8 h-8" /></div>
          <div>
            <h1 className="text-2xl font-extrabold">{t('appName')}</h1>
            <p className="text-sm text-slate-400">{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {[
            ['whatsapp', 'WhatsApp OTP'],
            ['password', 'Email / пароль'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setLoginMethod(id); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                loginMethod === id ? 'border-sky-500 text-sky-300' : 'border-slate-600 text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {loginMethod === 'whatsapp' ? (
          <WhatsappOtpLogin
            deviceId="gp-admin-web"
            deviceName="GP Admin Web"
            desiredRole="CLIENT"
            inputClassName="admin-input"
            buttonClassName="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm text-white disabled:opacity-50"
            onVerified={async () => {
              try {
                await loginViaWhatsappOtp()
                navigate('/')
              } catch {
                setError(t('login_error'))
                throw new Error('login_error')
              }
            }}
          />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="text-xs text-slate-400 mb-1 block">{t('username')}</span><input className="admin-input" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
            <label className="block"><span className="text-xs text-slate-400 mb-1 block">{t('password')}</span><input type="password" className="admin-input" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">{t('auth_forgot_link')}</Link>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm">{t('login')}</button>
          </form>
        )}
        {loginMethod === 'whatsapp' && error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <div className="mt-6 p-3 rounded-xl bg-white/5 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">API</p>
          <p>admin@gp.kz · password123 (SUPER_ADMIN)</p>
          <p>uralsk_admin@gp.kz · password123 (регион)</p>
          <p className="mt-2">WhatsApp OTP: +77001110001 / +77001110002 (seed)</p>
          <p className="font-semibold text-slate-400 mt-2">{t('demoAccounts')}</p>
          <p>VITE_GP_DEMO=true: superadmin · uralsk_admin (1234) немесе API email жоғарыда</p>
        </div>
      </div>
    </div>
  )
}
