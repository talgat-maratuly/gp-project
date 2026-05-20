import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { API_URL } from '@gp/shared/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err.message || 'Ошибка входа'
      if (msg.includes('fetch') || msg.includes('Failed')) {
        setError(`API недоступен. Запустите backend (${API_URL || 'localhost:4000'}).`)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="admin-card w-full max-w-md">
        <h1 className="text-xl font-bold text-white mb-1">GP Admin</h1>
        <p className="text-xs text-slate-500 mb-6">Доступ только для роли ADMIN в API</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Email</label>
            <input
              className="admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Пароль</label>
            <input
              className="admin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? '…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
