import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ORDER_STATUSES, recalcAggregates } from '../data/seedData'
import { uid } from '../lib/id'
import { loadStore, saveStore, resetStore } from '../lib/storage'

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
  const [store, setStore] = useState(() => loadStore())

  const persist = useCallback((updater) => {
    setStore((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const aggregated = recalcAggregates(next)
      saveStore(aggregated)
      return aggregated
    })
  }, [])

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

  const updateOrder = useCallback((orderId, patch) => {
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
  }, [persist])

  const assignPartner = useCallback((orderId, partnerId) => {
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
  }, [persist])

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

  const value = useMemo(
    () => ({
      store,
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
      resetDemoData: () => setStore(resetStore()),
    }),
    [
      store,
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
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useStore')
  return c
}
