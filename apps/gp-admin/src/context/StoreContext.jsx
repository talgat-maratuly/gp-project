import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken } from '@gp/shared/api'
import { ADMIN_ORDER_UI_TO_PRISMA } from '@gp/shared-core/statuses'
import { ORDER_STATUSES, recalcAggregates } from '../data/seedData'
import { uid } from '../lib/id'
import { fetchAdminStore } from '../lib/adminApiStore'
import { withLocalizedName, resolveLocalizedName, DEFAULT_LANG } from '@gp/shared/i18n'
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
  const partner = state.partners.find((p) => p.id === (order.assignedPartnerId ?? order.partnerId))
  return {
    ...order,
    franchiseId: order.franchiseId || client?.franchiseId || svc?.franchiseId,
    clientName: client?.name ?? order.clientName,
    clientPhone: client?.phone ?? order.clientPhone,
    city: order.city || client?.city,
    serviceName: resolveLocalizedName(svc, DEFAULT_LANG) || order.serviceName,
    subserviceName: (resolveLocalizedName(sub, DEFAULT_LANG) || order.subserviceName) ?? null,
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

  const addOblast = useCallback((data) => {
    const payload = withLocalizedName(data)
    persist((s) => ({
      ...s,
      oblasts: [...(s.oblasts || []), { ...payload, id: uid('obl'), active: payload.active !== false }],
    }))
  }, [persist])

  const updateOblast = useCallback((id, patch) => {
    const payload = withLocalizedName(patch)
    persist((s) => ({
      ...s,
      oblasts: (s.oblasts || []).map((o) => (o.id === id ? { ...o, ...payload } : o)),
    }))
  }, [persist])

  const removeOblast = useCallback((id) => {
    persist((s) => ({
      ...s,
      oblasts: (s.oblasts || []).filter((o) => o.id !== id),
      cities: (s.cities || []).filter((c) => c.oblastId !== id),
    }))
  }, [persist])

  const addCity = useCallback((data) => {
    const payload = withLocalizedName(data)
    persist((s) => {
      const city = { ...payload, id: uid('city'), active: payload.active !== false }
      let franchises = s.franchises
      if (city.franchiseId) {
        franchises = franchises.map((f) =>
          f.id === city.franchiseId ? { ...f, cityId: city.id, city: city.name } : f,
        )
      }
      return { ...s, cities: [...(s.cities || []), city], franchises }
    })
  }, [persist])

  const updateCity = useCallback((id, patch) => {
    const payload = withLocalizedName(patch)
    persist((s) => {
      const cities = (s.cities || []).map((c) => (c.id === id ? { ...c, ...payload } : c))
      const updated = cities.find((c) => c.id === id)
      let franchises = s.franchises
      if (updated?.franchiseId) {
        franchises = franchises.map((f) =>
          f.id === updated.franchiseId ? { ...f, cityId: updated.id, city: updated.name } : f,
        )
      }
      return { ...s, cities, franchises }
    })
  }, [persist])

  const removeCity = useCallback((id) => {
    persist((s) => ({
      ...s,
      cities: (s.cities || []).filter((c) => c.id !== id),
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

  const addService = useCallback(async (data) => {
    const payload = withLocalizedName(data)
    if (apiMode) {
      await api.adminCreateService({
        franchiseId: data.franchiseId,
        templateId: payload.templateId,
        cityId: data.cityId,
        names: payload.names,
        basePrice: payload.basePrice,
        gpCommission: payload.gpCommission,
        active: payload.active !== false,
      })
      await refreshFromApi()
      return
    }
    persist((s) => ({
      ...s,
      services: [...s.services, { ...payload, id: uid('svc'), templateId: payload.templateId || uid('tpl'), subservices: payload.subservices || [] }],
    }))
  }, [apiMode, persist, refreshFromApi])

  const updateService = useCallback(async (serviceId, patch) => {
    const payload = withLocalizedName(patch)
    if (apiMode) {
      await api.adminUpdateService(serviceId, {
        names: payload.names,
        basePrice: payload.basePrice,
        gpCommission: payload.gpCommission,
        active: payload.active,
      })
      await refreshFromApi()
      return
    }
    persist((s) => ({
      ...s,
      services: s.services.map((x) => (x.id === serviceId ? { ...x, ...payload } : x)),
    }))
  }, [apiMode, persist, refreshFromApi])

  const removeService = useCallback(async (serviceId) => {
    if (apiMode) {
      await api.adminRemoveService(serviceId)
      await refreshFromApi()
      return
    }
    persist((s) => ({ ...s, services: s.services.filter((x) => x.id !== serviceId) }))
  }, [apiMode, persist, refreshFromApi])

  const addSubservice = useCallback(async (serviceId, data) => {
    const payload = withLocalizedName(data)
    if (apiMode) {
      await api.adminAddSubservice(serviceId, {
        names: payload.names,
        price: payload.price,
        gpCommission: payload.gpCommission,
        active: payload.active !== false,
      })
      await refreshFromApi()
      return
    }
    persist((s) => ({
      ...s,
      services: s.services.map((svc) =>
        svc.id === serviceId
          ? { ...svc, subservices: [...(svc.subservices || []), { ...payload, id: payload.id || uid('sub'), active: payload.active !== false }] }
          : svc,
      ),
    }))
  }, [apiMode, persist, refreshFromApi])

  const updateSubservice = useCallback(async (serviceId, subId, patch) => {
    const payload = withLocalizedName(patch)
    if (apiMode) {
      await api.adminUpdateSubservice(serviceId, subId, {
        names: payload.names,
        price: payload.price,
        gpCommission: payload.gpCommission,
        active: payload.active,
      })
      await refreshFromApi()
      return
    }
    persist((s) => ({
      ...s,
      services: s.services.map((svc) =>
        svc.id === serviceId
          ? { ...svc, subservices: (svc.subservices || []).map((sub) => (sub.id === subId ? { ...sub, ...payload } : sub)) }
          : svc,
      ),
    }))
  }, [apiMode, persist, refreshFromApi])

  const removeSubservice = useCallback(async (serviceId, subId) => {
    if (apiMode) {
      await api.adminRemoveSubservice(serviceId, subId)
      await refreshFromApi()
      return
    }
    persist((s) => ({
      ...s,
      services: s.services.map((svc) =>
        svc.id === serviceId ? { ...svc, subservices: (svc.subservices || []).filter((sub) => sub.id !== subId) } : svc,
      ),
    }))
  }, [apiMode, persist, refreshFromApi])

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
      const body = { status: prismaStatus }
      if (['CANCELED_BY_CLIENT', 'CANCELED_BY_SPEC'].includes(prismaStatus)) {
        body.cancelReason = patch.cancelReason || 'Отменено администратором'
      }
      await api.adminUpdateOrderStatus(orderId, body)
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

  const assignPartner = useCallback(async (orderId, assignedPartnerId) => {
    if (apiMode) {
      await api.adminAssignOrder(orderId, assignedPartnerId)
      await refreshFromApi()
      return
    }
    persist((s) => {
      const partner = s.partners.find((p) => p.id === assignedPartnerId)
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                assignedPartnerId,
                partnerId: assignedPartnerId,
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

  const updateMarketProduct = useCallback(async (id, patch) => {
    if (apiMode) {
      if (patch.status === 'ACTIVE' || patch.status === 'INACTIVE') {
        await api.adminModerateMarketProduct(id, { isActive: patch.status === 'ACTIVE' })
        await refreshFromApi()
        return
      }
    }
    persist((s) => ({
      ...s,
      marketProducts: (s.marketProducts || []).map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)),
    }))
  }, [apiMode, persist, refreshFromApi])

  const value = useMemo(
    () => ({
      store,
      storeLoading,
      storeError,
      orderStatuses: ORDER_STATUSES,
      addFranchise,
      updateFranchise,
      removeFranchise,
      addOblast,
      updateOblast,
      removeOblast,
      addCity,
      updateCity,
      removeCity,
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
      addOblast,
      updateOblast,
      removeOblast,
      addCity,
      updateCity,
      removeCity,
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
