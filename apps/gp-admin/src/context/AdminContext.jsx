import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken } from '@gp/shared/api'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setReady(true)
      return
    }
    api
      .me()
      .then((me) => {
        if (me?.role === 'ADMIN') {
          setUser({ id: me.id, email: me.email, name: me.name, role: me.role })
        } else {
          clearToken()
        }
      })
      .catch(() => clearToken())
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (email, password) => {
    await api.login(email.trim().toLowerCase(), password)
    const me = await api.me()
    if (me?.role !== 'ADMIN') {
      api.logout()
      throw new Error('Нет доступа. Нужен аккаунт администратора.')
    }
    setUser({ id: me.id, email: me.email, name: me.name, role: me.role })
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setUser(null)
  }, [])

  return (
    <AdminContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const c = useContext(AdminContext)
  if (!c) throw new Error('useAdmin')
  return c
}
