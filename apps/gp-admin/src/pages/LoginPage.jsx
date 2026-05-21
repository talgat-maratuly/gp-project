import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [username, setUsername] = useState('superadmin')
  const [password, setPassword] = useState('1234')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setError('')
    try {
      login(username, password)
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
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="text-xs text-slate-400 mb-1 block">{t('username')}</span><input className="admin-input" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label className="block"><span className="text-xs text-slate-400 mb-1 block">{t('password')}</span><input type="password" className="admin-input" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-sm">{t('login')}</button>
        </form>
        <div className="mt-6 p-3 rounded-xl bg-white/5 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">{t('demoAccounts')}</p>
          <p>superadmin · atyrau_admin · aktobe_admin · uralsk_admin</p>
          <p>manager · finance · support (Уральск)</p>
        </div>
      </div>
    </div>
  )
}
