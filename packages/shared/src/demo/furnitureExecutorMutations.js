import { uid, loadGlobalStore, saveGlobalStore } from './store.js'
import {
  FURNITURE_EXECUTOR_TYPES,
  GP_INTERNAL_EXECUTOR_ID,
  GP_INTERNAL_EXECUTOR_NAME,
  partnerHasFurnitureAccess,
} from '../constants/furnitureExecutor.js'

const FLOW = {
  new: 'accepted',
  assigned: 'accepted',
  accepted: 'on_the_way',
  on_the_way: 'in_progress',
  in_progress: 'completed',
}

export function createFurnitureExecutorOrder(input) {
  const store = loadGlobalStore()
  const serviceType = input.serviceType
  if (!FURNITURE_EXECUTOR_TYPES.includes(serviceType)) {
    throw new Error('unknown_furniture_service_type')
  }
  const order = {
    id: uid('feo'),
    serviceType,
    serviceProjectId: input.serviceProjectId || null,
    clientName: input.clientName?.trim() || 'Клиент',
    phone: input.phone?.trim() || '',
    address: input.address?.trim() || 'Уральск',
    comment: input.comment?.trim() || '',
    city: input.city || 'Уральск',
    status: input.assignedPartnerId ? 'assigned' : 'new',
    assignedPartnerId: input.assignedPartnerId || null,
    executorInternal: !input.assignedPartnerId,
    executorLabel: input.assignedPartnerId ? null : GP_INTERNAL_EXECUTOR_NAME,
    internalExecutorId: input.assignedPartnerId ? null : GP_INTERNAL_EXECUTOR_ID,
    totalPrice: input.totalPrice ?? 0,
    gpCommission: input.gpCommission ?? 0,
    franchiseId: input.franchiseId || 'fr-uralsk',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGlobalStore({
    ...store,
    furnitureExecutorOrders: [...(store.furnitureExecutorOrders || []), order],
  }).furnitureExecutorOrders.slice(-1)[0]
}

export function updateFurnitureExecutorOrder(orderId, patch) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    furnitureExecutorOrders: (store.furnitureExecutorOrders || []).map((o) =>
      o.id === orderId ? { ...o, ...patch, updatedAt: Date.now() } : o,
    ),
  })
}

export function acceptFurnitureExecutorOrder(orderId, partnerId) {
  const store = loadGlobalStore()
  const order = (store.furnitureExecutorOrders || []).find((o) => o.id === orderId)
  if (!order) throw new Error('order_not_found')
  if (order.assignedPartnerId && order.assignedPartnerId !== partnerId) {
    throw new Error('forbidden')
  }
  return updateFurnitureExecutorOrder(orderId, {
    assignedPartnerId: partnerId,
    status: 'accepted',
    executorInternal: false,
    executorLabel: null,
    internalExecutorId: null,
  })
}

export function advanceFurnitureExecutorOrder(orderId, currentStatus) {
  const next = FLOW[currentStatus]
  if (!next) throw new Error('invalid_status_transition')
  return updateFurnitureExecutorOrder(orderId, { status: next })
}

export function cancelFurnitureExecutorOrder(orderId) {
  return updateFurnitureExecutorOrder(orderId, { status: 'cancelled' })
}

export function furnitureExecutorOrdersForPartner(partnerId, franchiseId, serviceAccess) {
  const store = loadGlobalStore()
  return (store.furnitureExecutorOrders || []).filter((o) => {
    if (franchiseId && o.franchiseId !== franchiseId) return false
    if (o.assignedPartnerId === partnerId) return true
    if (o.status === 'new' && o.executorInternal && partnerHasFurnitureAccess(serviceAccess, o.serviceType)) {
      return true
    }
    if (o.status === 'assigned' && o.executorInternal && partnerHasFurnitureAccess(serviceAccess, o.serviceType)) {
      return true
    }
    return false
  })
}
