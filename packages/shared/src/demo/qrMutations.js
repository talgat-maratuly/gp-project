import { uid, loadGlobalStore, saveGlobalStore } from './store.js'
import { QR_SERVICE_TO_TEMPLATE } from '../constants/qrService.js'
import { createClientOrder } from './mutations.js'

function defaultPrice(serviceType, store, franchiseId) {
  const template = QR_SERVICE_TO_TEMPLATE[serviceType] || 'cleaning'
  const svc = store.services.find((s) => s.franchiseId === franchiseId && s.templateId === template)
  return svc?.basePrice ?? 8000
}

function defaultCommission(total, store) {
  const pct = store.settings?.defaultCommissionPercent ?? 12
  return Math.round(total * (pct / 100))
}

export function findQrObjectByCode(qrCode) {
  const code = String(qrCode || '').trim().toUpperCase()
  return loadGlobalStore().qrCodeObjects?.find((o) => o.qrCode.toUpperCase() === code && o.status === 'active') || null
}

export function getQrObjectPublic(qrCode) {
  const obj = findQrObjectByCode(qrCode)
  if (!obj) return null
  const store = loadGlobalStore()
  const product = obj.productId ? store.marketProducts?.find((p) => p.id === obj.productId) : null
  const orders = (store.qrServiceOrders || []).filter((o) => o.qrCode === obj.qrCode)
  const scans = (store.qrScanLogs || []).filter((s) => s.qrCode === obj.qrCode)
  return {
    id: obj.id,
    qrCode: obj.qrCode,
    title: obj.title,
    type: obj.type,
    serviceType: obj.serviceType,
    address: obj.address,
    city: obj.city,
    description: obj.description,
    photo: obj.photo,
    lastServiceDate: obj.lastServiceDate,
    nextServiceDate: obj.nextServiceDate,
    product: product
      ? {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          unit: product.unit,
          shopId: product.shopId,
        }
      : null,
    ordersCount: orders.length,
    scansCount: scans.length,
  }
}

export function logQrScan(qrCode, meta = {}) {
  const obj = findQrObjectByCode(qrCode)
  if (!obj) return null
  const store = loadGlobalStore()
  const log = {
    id: uid('scan'),
    qrCodeObjectId: obj.id,
    qrCode: obj.qrCode,
    scannedAt: Date.now(),
    userAgent: meta.userAgent || '',
    ipAddress: meta.ipAddress || 'demo',
    deviceType: meta.deviceType || 'unknown',
    action: meta.action || 'view',
  }
  return saveGlobalStore({
    ...store,
    qrScanLogs: [...(store.qrScanLogs || []), log],
  }).qrScanLogs.slice(-1)[0]
}

export function createQrServiceOrder({ qrCode, clientName, phone, address, comment, photo }) {
  const obj = findQrObjectByCode(qrCode)
  if (!obj) throw new Error('QR не найден или неактивен')
  const store = loadGlobalStore()
  const totalPrice = defaultPrice(obj.serviceType, store, obj.franchiseId)
  const gpCommission = defaultCommission(totalPrice, store)
  const order = {
    id: uid('qro'),
    qrCodeObjectId: obj.id,
    qrCode: obj.qrCode,
    franchiseId: obj.franchiseId,
    serviceType: obj.serviceType,
    clientName: clientName?.trim() || 'Клиент',
    phone: phone?.trim() || '',
    address: address?.trim() || obj.address,
    comment: comment?.trim() || '',
    photo: photo || null,
    status: obj.partnerId ? 'assigned' : 'new',
    assignedPartnerId: obj.partnerId || null,
    totalPrice,
    gpCommission,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const template = QR_SERVICE_TO_TEMPLATE[obj.serviceType] || 'filter'
  createClientOrder({
    franchiseId: obj.franchiseId,
    clientId: obj.clientId || 'c1',
    clientName: order.clientName,
    clientPhone: order.phone,
    city: obj.city,
    serviceTemplateId: template,
    serviceName: obj.title,
    address: order.address,
    scheduledAt: new Date().toISOString().slice(0, 10),
    amount: totalPrice,
    note: `[QR ${obj.qrCode}] ${comment || ''}`.trim(),
  })

  const next = loadGlobalStore()
  saveGlobalStore({
    ...next,
    qrServiceOrders: [...(next.qrServiceOrders || []), order],
  })

  logQrScan(qrCode, { action: 'order_created', deviceType: metaDevice() })

  return order
}

function metaDevice() {
  if (typeof navigator === 'undefined') return 'unknown'
  return /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

export function createQrCodeObject(data) {
  const store = loadGlobalStore()
  const qrCode = (data.qrCode || `QR-${data.type?.toUpperCase().slice(0, 4) || 'OBJ'}-${String(store.qrCodeObjects?.length + 1).padStart(3, '0')}`).toUpperCase()
  const obj = {
    id: uid('qr'),
    qrCode,
    title: data.title,
    type: data.type,
    serviceType: data.serviceType,
    objectId: data.objectId || null,
    productId: data.productId || null,
    clientId: data.clientId || null,
    partnerId: data.partnerId || null,
    franchiseId: data.franchiseId || 'fr-uralsk',
    address: data.address || '',
    city: data.city || 'Уральск',
    description: data.description || '',
    photo: data.photo || null,
    lastServiceDate: data.lastServiceDate || null,
    nextServiceDate: data.nextServiceDate || null,
    status: data.status || 'active',
    phone: data.phone || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveGlobalStore({
    ...store,
    qrCodeObjects: [...(store.qrCodeObjects || []), obj],
  }).qrCodeObjects.slice(-1)[0]
}

export function updateQrCodeObject(id, patch) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    qrCodeObjects: (store.qrCodeObjects || []).map((o) =>
      o.id === id ? { ...o, ...patch, updatedAt: Date.now() } : o,
    ),
  })
}

export function updateQrServiceOrder(orderId, patch) {
  const store = loadGlobalStore()
  const next = {
    ...store,
    qrServiceOrders: (store.qrServiceOrders || []).map((o) => {
      if (o.id !== orderId) return o
      const updated = { ...o, ...patch, updatedAt: Date.now() }
      if (patch.status === 'completed' && o.status !== 'completed') {
        updated.gpCommission = updated.gpCommission || defaultCommission(updated.totalPrice, store)
      }
      return updated
    }),
  }
  return saveGlobalStore(next)
}

export function qrOrdersForPartner(partnerId, franchiseId) {
  const store = loadGlobalStore()
  return (store.qrServiceOrders || []).filter(
    (o) =>
      o.assignedPartnerId === partnerId &&
      (!franchiseId || o.franchiseId === franchiseId),
  )
}

export function qrStats(store) {
  const s = store || loadGlobalStore()
  const objects = s.qrCodeObjects || []
  const orders = s.qrServiceOrders || []
  const scans = s.qrScanLogs || []
  const conversion = scans.length ? Math.round((orders.length / scans.length) * 100) : 0
  return {
    objectsTotal: objects.length,
    objectsActive: objects.filter((o) => o.status === 'active').length,
    scansTotal: scans.length,
    ordersTotal: orders.length,
    ordersNew: orders.filter((o) => o.status === 'new').length,
    conversionPercent: Math.min(100, conversion),
  }
}
