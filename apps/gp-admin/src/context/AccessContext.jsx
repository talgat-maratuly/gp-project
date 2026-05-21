import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { useStore } from './StoreContext'
import {
  canPerform,
  isSuperAdmin,
  resolveFranchiseFilter,
  scopeByFranchise,
  franchiseStats,
} from '../lib/permissions'

const FILTER_KEY = 'gp-admin-franchise-filter'

const AccessContext = createContext(null)

function loadFilter() {
  try {
    return localStorage.getItem(FILTER_KEY) || 'all'
  } catch {
    return 'all'
  }
}

export function AccessProvider({ children }) {
  const { user } = useAuth()
  const { store } = useStore()
  const [selectedFranchiseId, setSelectedFranchiseIdState] = useState(loadFilter)

  const setSelectedFranchiseId = useCallback((id) => {
    localStorage.setItem(FILTER_KEY, id)
    setSelectedFranchiseIdState(id)
  }, [])

  const effectiveFranchiseId = useMemo(
    () => (user ? resolveFranchiseFilter(user, selectedFranchiseId) : null),
    [user, selectedFranchiseId],
  )

  const scoped = useMemo(() => {
    if (!effectiveFranchiseId) return store
    return {
      ...store,
      clients: scopeByFranchise(store.clients, effectiveFranchiseId),
      partners: scopeByFranchise(store.partners, effectiveFranchiseId),
      orders: scopeByFranchise(store.orders, effectiveFranchiseId),
      services: scopeByFranchise(store.services, effectiveFranchiseId),
      reviews: scopeByFranchise(store.reviews, effectiveFranchiseId),
      discounts: scopeByFranchise(store.discounts, effectiveFranchiseId),
      payouts: scopeByFranchise(store.payouts, effectiveFranchiseId),
    }
  }, [store, effectiveFranchiseId])

  const stats = useMemo(() => {
    const orders = scoped.orders
    const completed = orders.filter((o) => o.status === 'completed')
    return {
      totalOrders: orders.length,
      newOrders: orders.filter((o) => o.status === 'new').length,
      inProgress: orders.filter((o) => ['assigned', 'in_progress'].includes(o.status)).length,
      completed: completed.length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      partners: scoped.partners.length,
      clients: scoped.clients.length,
      turnover: completed.reduce((s, o) => s + o.amount, 0),
      gpCommission: completed.reduce((s, o) => s + o.gpCommission, 0),
    }
  }, [scoped])

  const franchiseList = useMemo(() => {
    return store.franchises.map((f) => ({
      ...f,
      stats: franchiseStats(store, f.id),
    }))
  }, [store])

  const currentFranchise = useMemo(() => {
    if (!effectiveFranchiseId) return null
    return store.franchises.find((f) => f.id === effectiveFranchiseId) || null
  }, [store.franchises, effectiveFranchiseId])

  const value = useMemo(
    () => ({
      scoped,
      stats,
      franchiseList,
      currentFranchise,
      effectiveFranchiseId,
      selectedFranchiseId: user && isSuperAdmin(user.role) ? selectedFranchiseId : user?.franchiseId,
      setSelectedFranchiseId,
      isSuperAdmin: user ? isSuperAdmin(user.role) : false,
      can: (action) => (user ? canPerform(user.role, action) : false),
    }),
    [scoped, stats, franchiseList, currentFranchise, effectiveFranchiseId, selectedFranchiseId, setSelectedFranchiseId, user],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error('useAccess')
  return ctx
}
