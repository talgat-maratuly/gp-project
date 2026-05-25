import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken } from '@gp/shared/api'
import { ADMIN_ORDER_UI_TO_PRISMA } from '@gp/shared/constants'
import { ORDER_STATUSES, recalcAggregates } from '../data/seedData'
import { uid } from '../lib/id'
import { fetchAdminStore } from '../lib/adminApiStore'
import {
  isDemoMode,
  loadGlobalStore,
  saveGlobalStore,
  resetGlobalStore,
  subscribeGlobalStore,
  syncFromHub,
} from '@gp/shared/demo'

const StoreContext = createContext(null)

function commissionForOrder(order, services, settings) {
  const svc = services.find((s) => s.id === order.serviceId)
  if (order.subserviceId && svc?.subservices) {
    const sub = svc.subservices.find((x) => x.id === order.subserviceId)
    if (sub?.gpCommission) return sub.gpCommission
  }
  if (svc?.gpCommission) return svc.gpCommission
  return Math.round((order.amount || 0) * ((settings.defaultCommissionPercent || 12) / 100))
}

function syncOrderFromRefs(order, state) {
  const client = state.clients.find((c) => c.id === order.clientId)
  const svc = state.services.find((s) => s.id === order.serviceId)
  const sub = svc?.subservices?.find((x) => x.id === order.subserviceId)
  const partner = state.partners.find((p) => p.id === order.partnerId)
  return {
    ...order,
    franchiseId: order.franchiseId || client?.franchiseId || svc?.franchiseId,
    clientName: client?.name ?? order.clientName,
    clientPhone: client?.phone ?? order.clientPhone,
    city: order.city || client?.city,
    serviceName: svc?.name ?? order.serviceName,
    subserviceName: sub?.name ?? order.subserviceName ?? null,
    partnerName: partner ? partner.company || partner.name : order.partnerName,
  }
}

export function StoreProvider({ children }) {
  const [store, setStore] = useState(() => loadGlobalStore())
  const [storeLoading, setStoreLoading] = useState(false)
  const [storeError, setStoreError] = useState(null)
  const apiMode = !isDemoMode()

  const refreshFromApi = useCallback(async () => {
    if (!apiMode || !getToken()) return
    setStoreLoading(true)
    setStoreError(null)
    try {
      const data = await fetchAdminStore()
      setStore(data)
    } catch (e) {
      setStoreError(e?.message || 'Не удалось загрузить данные')
      console.warn('[GP Admin] API store load failed', e?.message)
    } finally {
      setStoreLoading(false)
    }
  }, [apiMode])

  useEffect(() => {
    if (apiMode) {
      refreshFromApi()
      const t = setInterval(refreshFromApi, 15000)
      return () => clearInterval(t)
    }
    syncFromHub().then(setStore)
    return subscribeGlobalStore(setStore)
  }, [apiMode, refreshFromApi])

  const persist = useCallback((updater) => {
    setStore((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (apiMode) return next
      const aggregated = recalcAggregates(next)
      saveGlobalStore(aggregated)
      return aggregated
    })
  }, [apiMode])

  const addFranchise = useCallback((data) => {
    persist((s) => ({
      ...s,
      franchises: [...s.franchises, { ...data, id: data.id || uid('fr'), createdAt: data.createdAt || new Date().toISOString().slice(0, 10) }],
    }))
  }, [persist])

  const updateFranchise = useCallback((id, patch) => {
    persist((s) => ({
      ...s,
      franchises: s.franchises.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }))
  }, [persist])

  const removeFranchise = useCallback((id) => {
    persist((s) => ({
      ...s,
      franchises: s.franchises.filter((f) => f.id !== id),
    }))
  }, [persist])

  const addClient = useCallback((data) => {
    persist((s) => ({
      ...s,
      clients: [...s.clients, { ...data, id: uid('c'), orderIds: [], totalSpent: 0, gpIdBonus: data.gpIdBonus ?? 0, freeFifthOrder: false, discountPercent: 0 }],
    }))
  }, [persist])

  const updateClient = useCallback((id, patch) => {
    persist((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [persist])

  const removeClient = useCallback((id) => {
    persist((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))
  }, [persist])

  const addPartner = useCallback((data) => {
    persist((s) => ({
      ...s,
      partners: [
        ...s.partners,
        {
          ...data,
          id: uid('p'),
          completedOrders: 0,
          earnings: 0,
          gpCommissionPaid: 0,
          blocked: false,
          rating: data.rating ?? 5,
        },
      ],
    }))
  }, [persist])

  const updatePartner = useCallback((id, patch) => {
    persist((s) => ({ ...s, partners: s.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  }, [persist])

  const removePartner = useCallback((id) => {
    persist((s) => ({ ...s, partners: s.partners.filter((p) => p.id !== id) }))
  }, [persist])

  const addService = useCallback((data) => {
    persist((s) => ({
      ...s,
      services: [...s.services, { ...data, id: uid('svc'), templateId: data.templateId || uid('tpl'), subservices: data.subservices || [] }],
    }))
  }, [persist])

  const updateService = useCallback((serviceId, patch) => {
    persist((s) => ({
      ...s,
      services: s.services.map((x) => (x.id === serviceId ? { ...x, ...patch } : x)),
    }))
  }, [persist])

  const removeService = useCallback((serviceId) => {
    persist((s) => ({ ...s, services: s.services.filter((x) => x.id !== serviceId) }))
  }, [persist])

  const addSubservice = useCallback((serviceId, data) => {
    persist((s) => ({
      ...s,
      services: s.services.map((svc) =>
        svc.id === serviceId
          ? { ...svc, subservices: [...(svc.subservices || []), { ...data, id: data.id || uid('sub'), active: data.active !== false }] }
          : svc,
      ),
    }))
  }, [persist])

  const updateSubservice = useCallback((serviceId, subId, patch) => {
    persist((s) => ({
      ...s,
      services: s.services.map((svc) =>
        svc.id === serviceId
          ? { ...svc, subservices: (svc.subservices || []).map((sub) => (sub.id === subId ? { ...sub, ...patch } : sub)) }
          : svc,
      ),
    }))
  }, [persist])

  const removeSubservice = useCallback((serviceId, subId) => {
    persist((s) => ({
      ...s,
      services: s.services.map((svc) =>
        svc.id === serviceId ? { ...svc, subservices: (svc.subservices || []).filter((sub) => sub.id !== subId) } : svc,
      ),
    }))
  }, [persist])

  const addOrder = useCallback((data) => {
    persist((s) => {
      const order = syncOrderFromRefs({ ...data, id: uid('ord'), createdAt: Date.now(), status: data.status || 'new' }, s)
      if (order.status === 'completed') order.gpCommission = commissionForOrder(order, s.services, s.settings)
      return { ...s, orders: [...s.orders, order] }
    })
  }, [persist])

  const updateOrder = useCallback(async (orderId, patch) => {
    if (apiMode && patch.status) {
      const prismaStatus = ADMIN_ORDER_UI_TO_PRISMA[patch.status] || patch.status
      await api.adminUpdateOrderStatus(orderId, { status: prismaStatus })
      await refreshFromApi()
      return
    }
    persist((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o
        let updated = syncOrderFromRefs({ ...o, ...patch }, s)
        if (patch.status === 'completed' && o.status !== 'completed') {
          updated.gpCommission = commissionForOrder(updated, s.services, s.settings)
        }
        if (patch.status === 'cancelled') updated.gpCommission = 0
        return updated
      }),
    }))
  }, [apiMode, persist, refreshFromApi])

  const assignPartner = useCallback(async (orderId, partnerId) => {
    if (apiMode) {
      await api.adminAssignOrder(orderId, partnerId)
      await refreshFromApi()
      return
    }
    persist((s) => {
      const partner = s.partners.find((p) => p.id === partnerId)
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                partnerId,
                partnerName: partner?.company || partner?.name || null,
                status: o.status === 'new' ? 'assigned' : o.status,
              }
            : o,
        ),
      }
    })
  }, [apiMode, persist, refreshFromApi])

  const addDiscount = useCallback((data) => {
    persist((s) => ({ ...s, discounts: [...s.discounts, { ...data, id: uid('d'), active: data.active !== false }] }))
  }, [persist])

  const updateDiscount = useCallback((id, patch) => {
    persist((s) => ({ ...s, discounts: s.discounts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))
  }, [persist])

  const removeDiscount = useCallback((id) => {
    persist((s) => ({ ...s, discounts: s.discounts.filter((d) => d.id !== id) }))
  }, [persist])

  const updateSettings = useCallback((patch) => {
    persist((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [persist])

  const updateReviewStatus = useCallback((reviewId, status) => {
    persist((s) => ({
      ...s,
      reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, status } : r)),
    }))
  }, [persist])

  const updateShop = useCallback((id, patch) => {
    persist((s) => ({
      ...s,
      shops: (s.shops || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))
  }, [persist])

  const updateMarketProduct = useCallback((id, patch) => {
    persist((s) => ({
      ...s,
      marketProducts: (s.marketProducts || []).map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }))
  }, [persist])

  const value = useMemo(
    () => ({
      store,
      storeLoading,
      storeError,
      orderStatuses: ORDER_STATUSES,
      addFranchise,
      updateFranchise,
      removeFranchise,
      addClient,
      updateClient,
      removeClient,
      addPartner,
      updatePartner,
      removePartner,
      addService,
      updateService,
      removeService,
      addSubservice,
      updateSubservice,
      removeSubservice,
      addOrder,
      updateOrder,
      assignPartner,
      addDiscount,
      updateDiscount,
      removeDiscount,
      updateSettings,
      updateReviewStatus,
      updateShop,
      updateMarketProduct,
      resetDemoData: () => (apiMode ? refreshFromApi() : setStore(resetGlobalStore())),
      refreshFromApi,
      apiMode,
    }),
    [
      store,
      storeLoading,
      storeError,
      addFranchise,
      updateFranchise,
      removeFranchise,
      addClient,
      updateClient,
      removeClient,
      addPartner,
      updatePartner,
      removePartner,
      addService,
      updateService,
      removeService,
      addSubservice,
      updateSubservice,
      removeSubservice,
      addOrder,
      updateOrder,
      assignPartner,
      addDiscount,
      updateDiscount,
      removeDiscount,
      updateSettings,
      updateReviewStatus,
      updateShop,
      updateMarketProduct,
      refreshFromApi,
      apiMode,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useStore')
  return c
}
