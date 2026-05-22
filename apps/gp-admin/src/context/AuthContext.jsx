import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken } from '@gp/shared/api'
import { isDemoMode } from '@gp/shared/demo'
import { DEMO_USERS } from '../data/seedData'

const AUTH_KEY = 'gp-admin-session'

const AuthContext = createContext(null)

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isDemoMode() ? loadSession() : null))
  const [ready, setReady] = useState(isDemoMode())

  useEffect(() => {
    if (isDemoMode()) {
      setReady(true)
      return
    }
    if (!getToken()) {
      setReady(true)
      return
    }
    api
      .me()
      .then((me) => {
        if (me.role !== 'ADMIN') {
          clearToken()
          setUser(null)
          return
        }
        const session = {
          username: me.email,
          role: 'SUPER_ADMIN',
          name: me.name || 'GP Admin',
          franchiseId: null,
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(session))
        setUser(session)
      })
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (username, password) => {
    if (isDemoMode()) {
      const u = DEMO_USERS.find(
        (x) => x.username === username.trim().toLowerCase() && x.password === password,
      )
      if (!u) throw new Error('login_error')
      const session = {
        username: u.username,
        role: u.role,
        name: u.name,
        franchiseId: u.franchiseId ?? null,
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      setUser(session)
      return session
    }

    const email = username.includes('@') ? username.trim() : `${username.trim()}@gp.kz`
    await api.login(email, password)
    const me = await api.me()
    if (me.role !== 'ADMIN') {
      clearToken()
      throw new Error('login_error')
    }
    const session = {
      username: me.email,
      role: 'SUPER_ADMIN',
      name: me.name || 'GP Admin',
      franchiseId: null,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    if (!isDemoMode()) clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth')
  return c
}
