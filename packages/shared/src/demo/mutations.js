import { uid, loadGlobalStore, saveGlobalStore } from './store.js'
import { SERVICE_ID_TO_TEMPLATE } from './seed.js'

function commissionForOrder(order, services, settings) {
  const svc = services.find((s) => s.id === order.serviceId)
  if (order.subserviceId && svc?.subservices) {
    const sub = svc.subservices.find((x) => x.id === order.subserviceId)
    if (sub?.gpCommission) return sub.gpCommission
  }
  if (svc?.gpCommission) return svc.gpCommission
  return Math.round((order.amount || 0) * ((settings.defaultCommissionPercent || 12) / 100))
}

export function createClientOrder({ franchiseId, clientId, clientName, clientPhone, city, serviceTemplateId, subserviceId, serviceName, address, scheduledAt, amount, note }) {
  const store = loadGlobalStore()
  const svc = store.services.find((s) => s.franchiseId === franchiseId && s.templateId === serviceTemplateId)
  const sub = subserviceId ? svc?.subservices?.find((x) => x.id === subserviceId) : null
  const order = {
    id: uid('ord'),
    franchiseId,
    clientId,
    clientName,
    clientPhone,
    address,
    city,
    serviceId: svc?.id || `${serviceTemplateId}_${franchiseId}`,
    serviceName: serviceName || svc?.name,
    subserviceId: sub?.id || null,
    subserviceName: sub?.name || null,
    scheduledAt: scheduledAt || new Date().toISOString().slice(0, 10),
    status: 'new',
    partnerId: null,
    partnerName: null,
    amount: amount ?? sub?.price ?? svc?.basePrice ?? 0,
    gpCommission: 0,
    note: note || '',
    createdAt: Date.now(),
  }
  return saveGlobalStore({ ...store, orders: [...store.orders, order] })
}

export function updateGlobalOrder(orderId, patch) {
  const store = loadGlobalStore()
  const next = {
    ...store,
    orders: store.orders.map((o) => {
      if (o.id !== orderId) return o
      let updated = { ...o, ...patch }
      if (patch.status === 'completed' && o.status !== 'completed') {
        updated.gpCommission = commissionForOrder(updated, store.services, store.settings)
      }
      if (patch.status === 'cancelled') updated.gpCommission = 0
      return updated
    }),
  }
  return saveGlobalStore(next)
}

export function assignGlobalPartner(orderId, partnerId) {
  const store = loadGlobalStore()
  const partner = store.partners.find((p) => p.id === partnerId)
  return saveGlobalStore({
    ...store,
    orders: store.orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            partnerId,
            partnerName: partner?.company || partner?.name || null,
            status: o.status === 'new' ? 'assigned' : o.status,
          }
        : o,
    ),
  })
}

export function mapServiceOrderPayload(data, session) {
  const template = SERVICE_ID_TO_TEMPLATE[data.serviceId] || 'lawn'
  const franchiseId = session.franchiseId
  const store = loadGlobalStore()
  const svc = store.services.find((s) => s.franchiseId === franchiseId && s.templateId === template)
  let subserviceId = null
  if (data.lawnAreaSqm && svc?.subservices?.length) {
    const sqm = Number(data.lawnAreaSqm)
    if (sqm <= 100) subserviceId = svc.subservices.find((s) => s.name.includes('100'))?.id
    else if (sqm <= 500) subserviceId = svc.subservices.find((s) => s.name.includes('500'))?.id
    else subserviceId = svc.subservices.find((s) => s.name.includes('1000'))?.id
  }
  if (data.septicVolume && svc?.subservices?.length) {
    const v = Number(data.septicVolume)
    if (v <= 4) subserviceId = svc.subservices.find((s) => s.name.includes('3'))?.id
    else if (v <= 6) subserviceId = svc.subservices.find((s) => s.name.includes('5'))?.id
    else subserviceId = svc.subservices.find((s) => s.name.includes('10'))?.id
  }
  const sub = subserviceId ? svc?.subservices?.find((x) => x.id === subserviceId) : null
  const amount = Number(data.total) || sub?.price || svc?.basePrice || 0
  return {
    franchiseId,
    clientId: session.clientId,
    clientName: session.name,
    clientPhone: session.phone || store.clients.find((c) => c.id === session.clientId)?.phone,
    city: session.city || store.franchises.find((f) => f.id === franchiseId)?.city,
    serviceTemplateId: template,
    subserviceId,
    serviceName: data.serviceName,
    address: data.address,
    scheduledAt: data.preferredDate,
    amount,
    note: data.comment,
  }
}

/** Статусы партнёра → store */
export const PARTNER_STATUS_MAP = {
  accepted: 'assigned',
  en_route: 'in_progress',
  in_work: 'in_work',
  completed: 'completed',
}
