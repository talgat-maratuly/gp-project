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

  const scopeList = useCallback(
    (list) => (effectiveFranchiseId ? scopeByFranchise(list || [], effectiveFranchiseId) : list || []),
    [effectiveFranchiseId],
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
      shops: scopeByFranchise(store.shops || [], effectiveFranchiseId),
      marketProducts: scopeByFranchise(store.marketProducts || [], effectiveFranchiseId),
      marketOrders: scopeByFranchise(store.marketOrders || [], effectiveFranchiseId),
      qrCodeObjects: scopeByFranchise(store.qrCodeObjects || [], effectiveFranchiseId),
      qrServiceOrders: scopeByFranchise(store.qrServiceOrders || [], effectiveFranchiseId),
      qrScanLogs: (store.qrScanLogs || []).filter((s) => {
        const obj = (store.qrCodeObjects || []).find((o) => o.id === s.qrCodeObjectId)
        return !effectiveFranchiseId || obj?.franchiseId === effectiveFranchiseId
      }),
      deliveryCompanies: (store.deliveryCompanies || []).filter(
        (d) => !d.franchiseId || d.franchiseId === effectiveFranchiseId,
      ),
    }
  }, [store, effectiveFranchiseId])

  const scopedShops = useMemo(() => scopeList(store.shops), [store.shops, scopeList])
  const scopedProducts = useMemo(() => scopeList(store.marketProducts), [store.marketProducts, scopeList])
  const scopedMarketOrders = useMemo(() => scopeList(store.marketOrders), [store.marketOrders, scopeList])
  const scopedDelivery = useMemo(() => {
    const list = store.deliveryCompanies || []
    if (!effectiveFranchiseId) return list
    return list.filter((d) => !d.franchiseId || d.franchiseId === effectiveFranchiseId)
  }, [store.deliveryCompanies, effectiveFranchiseId])

  const marketStats = useMemo(() => {
    const products = scopedProducts
    const orders = scopedMarketOrders
    const delivered = orders.filter((o) => o.status === 'DELIVERED')
    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === 'ACTIVE').length,
      shops: scopedShops.length,
      orders: orders.length,
      turnover: delivered.reduce((s, o) => s + o.finalAmount, 0),
      problemOrders: orders.filter((o) => o.status === 'PROBLEM').length,
    }
  }, [scopedProducts, scopedMarketOrders, scopedShops])

  const stats = useMemo(() => {
    const orders = scoped.orders
    const completed = orders.filter((o) => o.status === 'completed')
    return {
      totalOrders: orders.length,
      newOrders: orders.filter((o) => o.status === 'new').length,
      inProgress: orders.filter((o) => ['assigned', 'in_progress', 'in_work'].includes(o.status)).length,
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
      scopedStore: scoped,
      scopedShops,
      scopedProducts,
      scopedMarketOrders,
      scopedDelivery,
      marketStats,
      canBlockShop: user && ['SUPER_ADMIN', 'FRANCHISE_ADMIN'].includes(user.role),
    }),
    [
      scoped, stats, franchiseList, currentFranchise, effectiveFranchiseId, selectedFranchiseId,
      setSelectedFranchiseId, user, scopedShops, scopedProducts, scopedMarketOrders, scopedDelivery, marketStats,
    ],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error('useAccess')
  return ctx
}
