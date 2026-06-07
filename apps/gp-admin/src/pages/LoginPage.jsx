import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
<<<<<<< HEAD
import { isDemoMode } from '@gp/shared/demo'
import {
  consumeAuthReturnPath,
  resolveAuthReturnPath,
} from '@gp/shared/auth/redirect'
=======
import { WhatsappOtpLogin } from '@gp/shared/auth/whatsappOtpLogin'
>>>>>>> 61b771f4cabb203f1a879564c1f97476256ecdb8
import { useAuth } from '../context/AuthContext'
import { canAccess } from '../lib/permissions'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LoginPage() {
  const { login, loginViaWhatsappOtp } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
<<<<<<< HEAD
  const location = useLocation()
  const returnPath = resolveAuthReturnPath('admin', location)

  const [username, setUsername] = useState(isDemoMode() ? 'admin@gp.kz' : '')
  const [password, setPassword] = useState(isDemoMode() ? 'password123' : '')
=======
  const [loginMethod, setLoginMethod] = useState('whatsapp')
  const [username, setUsername] = useState('admin@gp.kz')
  const [password, setPassword] = useState('password123')
>>>>>>> 61b771f4cabb203f1a879564c1f97476256ecdb8
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const showDemoHints = isDemoMode() || import.meta.env.DEV

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await login(username, password)
      const target = consumeAuthReturnPath('admin', returnPath || '/')
      const safeTarget = target && canAccess(session.role, target) ? target : '/'
      navigate(safeTarget, { replace: true })
    } catch {
      setError(t('login_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 admin-shell">
      <div
        className="absolute inset-0 -z-10 opacity-90"
        style={{
          background: 'linear-gradient(135deg, var(--gp-bg) 0%, color-mix(in srgb, var(--gp-accent-soft) 40%, var(--gp-bg)) 100%)',
        }}
      />
      <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md admin-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl admin-panel border" style={{ color: 'var(--gp-accent-text)' }}>
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold admin-heading">{t('appName')}</h1>
            <p className="text-sm admin-muted">{t('appSubtitle')}</p>
          </div>
        </div>
<<<<<<< HEAD
        {returnPath && returnPath !== '/' && (
          <p className="text-sm text-sky-300/90 mb-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
            {t('auth_return_hint')}
            <span className="block text-xs text-slate-400 mt-1 truncate">{returnPath}</span>
          </p>
        )}
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="text-xs text-slate-400 mb-1 block">{t('username')}</span><input className="admin-input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></label>
          <label className="block"><span className="text-xs text-slate-400 mb-1 block">{t('password')}</span><input type="password" className="admin-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">{t('auth_forgot_link')}</Link>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm disabled:opacity-50">{loading ? t('loading') : t('login')}</button>
        </form>
        {showDemoHints && (
          <div className="mt-6 p-3 rounded-xl bg-white/5 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">API (demo/dev)</p>
            <p>admin@gp.kz · password123 (SUPER_ADMIN)</p>
            <p>uralsk_admin@gp.kz · password123 (регион)</p>
            <p className="font-semibold text-slate-400 mt-2">{t('demoAccounts')}</p>
            <p>VITE_GP_DEMO=true: superadmin · uralsk_admin (1234)</p>
          </div>
        )}
=======
        <div className="flex gap-2 mb-4">
          {[
            ['whatsapp', 'WhatsApp OTP'],
            ['password', 'Email / пароль'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setLoginMethod(id); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                loginMethod === id ? 'admin-tab-active' : 'admin-tab'
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
            loginAs="admin"
            inputClassName="admin-input"
            buttonClassName="w-full py-3 rounded-xl admin-btn-primary font-bold text-sm disabled:opacity-50"
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
            <label className="block"><span className="text-xs admin-muted mb-1 block">{t('username')}</span><input className="admin-input" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
            <label className="block"><span className="text-xs admin-muted mb-1 block">{t('password')}</span><input type="password" className="admin-input" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--gp-accent-text)' }}>{t('auth_forgot_link')}</Link>
            {error && <p className="text-sm" style={{ color: 'var(--gp-danger-text)' }}>{error}</p>}
            <button type="submit" className="w-full py-3 rounded-xl admin-btn-primary font-bold text-sm">{t('login')}</button>
          </form>
        )}
        {loginMethod === 'whatsapp' && error && <p className="text-sm mt-3" style={{ color: 'var(--gp-danger-text)' }}>{error}</p>}
        <div className="mt-6 p-3 rounded-xl admin-panel border text-xs admin-muted space-y-1">
          <p className="font-semibold admin-heading">API</p>
          <p>admin@gp.kz · password123 (SUPER_ADMIN)</p>
          <p>uralsk_admin@gp.kz · password123 (регион)</p>
          <p className="mt-2">WhatsApp OTP: +77001110001 / +77001110002 (seed)</p>
          <p className="font-semibold admin-heading mt-2">{t('demoAccounts')}</p>
          <p>VITE_GP_DEMO=true: superadmin · uralsk_admin (1234) немесе API email жоғарыда</p>
        </div>
>>>>>>> 61b771f4cabb203f1a879564c1f97476256ecdb8
      </div>
    </div>
  )
}
