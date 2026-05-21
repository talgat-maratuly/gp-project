import { createContext, useCallback, useContext, useState } from 'react'
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
  const [user, setUser] = useState(() => loadSession())

  const login = useCallback((username, password) => {
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
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, ready: true }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth')
  return c
}
