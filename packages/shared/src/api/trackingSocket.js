import { io } from 'socket.io-client'
import { getApiRootUrl } from './apiClient.js'

const MAX_ATTEMPTS = 12
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 15000

let socket = null
let reconnectAttempts = 0
let reconnectTimer = null
let manualClose = false

/** orderId → Set<handler> */
const trackingHandlers = new Map()
/** orderId → Set<handler> */
const statusHandlers = new Map()
const globalStatusHandlers = new Set()

function log(...args) {
  if (import.meta.env?.DEV) console.log('[GP WS]', ...args)
}

function trackingUrl() {
  return `${getApiRootUrl()}/tracking`
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function resubscribeAll() {
  if (!socket?.connected) return
  for (const orderId of trackingHandlers.keys()) {
    socket.emit('subscribe', { orderId })
  }
  for (const orderId of statusHandlers.keys()) {
    socket.emit('subscribe', { orderId })
  }
}

function scheduleReconnect(reason) {
  if (manualClose || reconnectTimer) return
  if (reconnectAttempts >= MAX_ATTEMPTS) {
    log('reconnect stopped after', MAX_ATTEMPTS, 'attempts. Last reason:', reason)
    return
  }
  const delay = Math.min(BASE_DELAY_MS * 2 ** reconnectAttempts, MAX_DELAY_MS)
  reconnectAttempts += 1
  log(`reconnect in ${delay}ms (attempt ${reconnectAttempts}/${MAX_ATTEMPTS})`, reason)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (manualClose) return
    if (socket) {
      socket.connect()
    } else {
      ensureSocket()
    }
  }, delay)
}

function attachSocketListeners(s) {
  s.on('connect', () => {
    reconnectAttempts = 0
    clearReconnectTimer()
    log('connected', s.id)
    resubscribeAll()
  })

  s.on('disconnect', (reason) => {
    log('disconnected', reason)
    if (!manualClose) scheduleReconnect(reason)
  })

  s.on('connect_error', (err) => {
    log('connect_error', err?.message || err)
    scheduleReconnect(err?.message)
  })

  s.on('tracking:update', (data) => {
    const orderId = data?.orderId
    if (!orderId) return
    trackingHandlers.get(orderId)?.forEach((fn) => {
      try {
        fn(data)
      } catch (e) {
        console.warn('[GP WS] tracking handler error', e)
      }
    })
  })

  s.on('order:status', (data) => {
    const orderId = data?.orderId
    if (orderId) {
      statusHandlers.get(orderId)?.forEach((fn) => {
        try {
          fn(data)
        } catch (e) {
          console.warn('[GP WS] status handler error', e)
        }
      })
    }
    globalStatusHandlers.forEach((fn) => {
      try {
        fn(data)
      } catch (e) {
        console.warn('[GP WS] global status handler error', e)
      }
    })
  })
}

export function ensureSocket() {
  manualClose = false
  if (socket?.connected) return socket
  if (socket) {
    socket.connect()
    return socket
  }
  socket = io(trackingUrl(), {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: false,
  })
  attachSocketListeners(socket)
  return socket
}

/** @deprecated use ensureSocket */
export function getTrackingSocket() {
  return ensureSocket()
}

export function subscribeOrderTracking(orderId, onTracking, onStatus) {
  if (!orderId) return () => {}
  ensureSocket()

  if (onTracking) {
    if (!trackingHandlers.has(orderId)) trackingHandlers.set(orderId, new Set())
    trackingHandlers.get(orderId).add(onTracking)
  }
  if (onStatus) {
    if (!statusHandlers.has(orderId)) statusHandlers.set(orderId, new Set())
    statusHandlers.get(orderId).add(onStatus)
  }

  const subscribe = () => socket?.emit('subscribe', { orderId })
  if (socket?.connected) subscribe()
  else socket?.once('connect', subscribe)

  return () => {
    if (onTracking) {
      trackingHandlers.get(orderId)?.delete(onTracking)
      if (trackingHandlers.get(orderId)?.size === 0) trackingHandlers.delete(orderId)
    }
    if (onStatus) {
      statusHandlers.get(orderId)?.delete(onStatus)
      if (statusHandlers.get(orderId)?.size === 0) statusHandlers.delete(orderId)
    }
  }
}

/** Обновление списка заказов при любом order:status */
export function subscribeGlobalOrderStatus(onStatus) {
  if (!onStatus) return () => {}
  ensureSocket()
  globalStatusHandlers.add(onStatus)
  return () => globalStatusHandlers.delete(onStatus)
}

export function subscribeAdminFleet(onUpdate) {
  const s = ensureSocket()
  const handler = (data) => onUpdate(data)
  s.emit('subscribe', { role: 'admin' })
  s.on('fleet:update', handler)
  s.on('tracking:update', handler)
  return () => {
    s.off('fleet:update', handler)
    s.off('tracking:update', handler)
  }
}

/**
 * Подписка специалиста на ленту пула: новый заказ (feed:new) и принятый другим (feed:taken).
 * Бэкенд фильтрует видимость — здесь только триггер на обновление ленты.
 */
export function subscribeSpecialistFeed(onChange, partnerProfileId) {
  if (!onChange) return () => {}
  const s = ensureSocket()
  const onNew = (data) => onChange({ type: 'new', ...data })
  const onTaken = (data) => onChange({ type: 'taken', ...data })
  const sub = () => s.emit('subscribe', { role: 'specialist', partnerProfileId })
  if (s.connected) sub()
  else s.once('connect', sub)
  s.on('feed:new', onNew)
  s.on('feed:taken', onTaken)
  return () => {
    s.off('feed:new', onNew)
    s.off('feed:taken', onTaken)
  }
}

export function resetTrackingSocket(reason = 'manual') {
  log('reset socket', reason)
  manualClose = true
  clearReconnectTimer()
  reconnectAttempts = 0
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
  manualClose = false
}

export function disconnectTrackingSocket() {
  resetTrackingSocket('disconnect')
}

export function getTrackingSocketState() {
  return {
    connected: !!socket?.connected,
    reconnectAttempts,
    url: trackingUrl(),
  }
}
