import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken } from '@gp/shared/api'
import { isDemoMode } from '@gp/shared/demo'
import { DEMO_USERS } from '../data/seedData'
import { mapMeToAdminSession } from '../lib/adminSession'

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
      if (getToken()) {
        api
          .me()
          .then((me) => {
            const session = mapMeToAdminSession(me)
            if (session) {
              localStorage.setItem(AUTH_KEY, JSON.stringify(session))
              setUser(session)
              return
            }
            clearToken()
            setUser(loadSession())
          })
          .catch(() => {
            clearToken()
            setUser(loadSession())
          })
          .finally(() => setReady(true))
        return
      }
      setUser(loadSession())
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
        const session = mapMeToAdminSession(me)
        if (!session) {
          clearToken()
          setUser(null)
          return
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

  const loginViaWhatsappOtp = useCallback(async () => {
    const me = await api.me()
    const session = mapMeToAdminSession(me)
    if (!session) {
      clearToken()
      throw new Error('login_error')
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const login = useCallback(async (username, password) => {
    const email = username.includes('@') ? username.trim().toLowerCase() : `${username.trim().toLowerCase()}@gp.kz`

    if (isDemoMode()) {
      const tryApiAdmin = email.endsWith('@gp.kz') || email.endsWith('@gp.local')
      if (tryApiAdmin) {
        try {
          await api.login(email, password)
          const me = await api.me()
          const session = mapMeToAdminSession(me)
          if (session) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(session))
            setUser(session)
            return session
          }
          clearToken()
        } catch {
          /* demo fallback */
        }
      }
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
    await api.login(email, password)
    const me = await api.me()
    const session = mapMeToAdminSession(me)
    if (!session) {
      clearToken()
      throw new Error('login_error')
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, loginViaWhatsappOtp, logout, ready }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth')
  return c
}
