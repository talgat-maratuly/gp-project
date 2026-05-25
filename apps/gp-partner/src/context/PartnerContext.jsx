import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, mapOrder } from '@gp/shared/api'
import { isDemoMode, subscribeGlobalStore, syncFromHub } from '@gp/shared/demo'
import * as demoApi from '../lib/demoApi'
import { subscribeGlobalOrderStatus, resetTrackingSocket } from '@gp/shared/api/trackingSocket'
import { CATEGORY_TO_UI, ORDER_STATUS_TO_API } from '@gp/shared/api/mappers'

const KEYS = { activeOrder: 'gp-partner-active-order' }
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb } catch { return fb } }

async function loadPartnerSession() {
  if (!getToken()) return null
  const me = await api.me()
  let profile = me.partnerProfile
  if (!profile) return null
  try {
    const full = await api.getPartnerApplication()
    profile = { ...profile, ...full }
  } catch {
    /* fallback to /auth/me profile */
  }
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    phone: me.phone,
    company: profile.companyName || profile.company,
    directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
    balance: Number(profile.balance),
    isOnline: profile.isOnline,
    lat: profile.lat,
    lng: profile.lng,
    partnerProfileId: profile.id,
    partnerStatus: profile.status || 'DRAFT',
    partnerType: profile.partnerType,
    rejectionReason: profile.rejectionReason,
    revisionComment: profile.revisionComment,
    serviceOfferings: profile.serviceOfferings || [],
    serviceAccess: profile.serviceAccess || [],
    accountType: profile.accountType || 'INDIVIDUAL',
    bin: profile.bin,
    legalAddress: profile.legalAddress,
    idDocumentNumber: profile.idDocumentNumber,
    documents: profile.documents,
  }
}

const PartnerContext = createContext(null)

export function PartnerProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [activeOrderId, setActiveOrderId] = useState(() => load(KEYS.activeOrder, null))
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => setToast({ msg }), [])

  useEffect(() => {
    if (isDemoMode()) {
      const session = demoApi.getDemoSession()
      if (session) setUser(session)
      setAuthReady(true)
      syncFromHub()
      return subscribeGlobalStore(() => syncFromHub())
    }
    loadPartnerSession()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    if (activeOrderId) localStorage.setItem(KEYS.activeOrder, JSON.stringify(activeOrderId))
    else localStorage.removeItem(KEYS.activeOrder)
  }, [activeOrderId])

  const syncPartner = useCallback(async () => {
    if (!user?.id) return
    const profile = await api.getPartnerApplication()
    setUser((u) => ({
      ...u,
      company: profile.companyName || profile.company,
      directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
      balance: Number(profile.balance),
      isOnline: profile.isOnline,
      lat: profile.lat,
      lng: profile.lng,
      partnerProfileId: profile.id,
      partnerStatus: profile.status,
      partnerType: profile.partnerType,
      rejectionReason: profile.rejectionReason,
      revisionComment: profile.revisionComment,
      serviceOfferings: profile.serviceOfferings || [],
      serviceAccess: profile.serviceAccess || [],
      accountType: profile.accountType,
      bin: profile.bin,
      legalAddress: profile.legalAddress,
      idDocumentNumber: profile.idDocumentNumber,
      documents: profile.documents,
    }))
  }, [user?.id])

  const refreshOrders = useCallback(async () => {
    if (isDemoMode() || demoApi.getDemoSession()) {
      if (!demoApi.getDemoSession()) return
      try {
        setOrders(await demoApi.demoGetOrders())
      } catch (e) {
        notify(e.message || 'orders_load_error')
      }
      return
    }
    if (!getToken()) return
    try {
      const list = await api.getOrders()
      setOrders(list)
    } catch (e) {
      notify(e.message || 'Не удалось загрузить заказы')
    }
  }, [notify])

  const refreshProducts = useCallback(async () => {
    if (!user?.partnerProfileId) return
    setProductsLoading(true)
    setProductsError(null)
    try {
      setProducts(await api.getProducts({ partnerId: user.partnerProfileId }))
    } catch (e) {
      setProductsError(e?.message || 'Не удалось загрузить товары')
      notify(e?.message || 'Не удалось загрузить товары')
    } finally {
      setProductsLoading(false)
    }
  }, [user?.partnerProfileId, notify])

  const refreshTransactions = useCallback(async () => {
    if (!getToken()) return
    try {
      setTransactions(await api.getTransactions())
    } catch {
      setTransactions([])
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshOrders(), refreshProducts(), refreshTransactions(), syncPartner()])
  }, [refreshOrders, refreshProducts, refreshTransactions, syncPartner])

  useEffect(() => {
    if (!user?.id) return
    refreshAll()
    if (isDemoMode()) {
      const t = setInterval(refreshOrders, 3000)
      return () => clearInterval(t)
    }
    const t = setInterval(refreshOrders, 5000)
    const unsubWs = subscribeGlobalOrderStatus(() => {
      refreshOrders()
    })
    return () => {
      clearInterval(t)
      unsubWs()
    }
  }, [user?.id, refreshAll, refreshOrders])

  useEffect(() => {
    if (!user?.id) resetTrackingSocket('logout')
  }, [user?.id])

  const register = useCallback(async (data) => {
    setLoading(true)
    try {
      let regionId = data.regionId
      if (!regionId) {
        const regions = await api.getRegions()
        regionId = regions.find((r) => r.code === 'uralsk')?.id || regions[0]?.id
      }
      if (!regionId) throw new Error('Выберите регион')

      await api.registerPartner({
        name: data.name.trim(),
        company: data.company?.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
        referralCode: data.referralCode?.trim() || undefined,
        regionId,
        accountType: data.accountType || 'INDIVIDUAL',
        city: data.city?.trim() || 'Уральск',
        bin: data.bin?.trim(),
        legalAddress: data.legalAddress?.trim(),
        idDocumentNumber: data.idDocumentNumber?.trim(),
        documents: data.documents,
      })

      const { resolvePartnerTypeFromGroups } = await import('@gp/shared/constants')
      const partnerType = data.partnerType || resolvePartnerTypeFromGroups(data.mainGroupIds || [])
      await api.partnerApply({
        partnerType,
        regionId,
        companyName: (data.company || data.name).trim(),
        fullName: data.name.trim(),
        phone: data.phone?.trim() || '',
        city: data.city?.trim() || 'Уральск',
        address: data.address?.trim(),
        description: data.description?.trim(),
        accountType: data.accountType || 'INDIVIDUAL',
        bin: data.bin?.trim(),
        legalAddress: data.legalAddress?.trim(),
        idDocumentNumber: data.idDocumentNumber?.trim(),
        documents: data.documents,
        vehiclePhotos: data.vehiclePhotos || [],
        equipmentPhotos: data.equipmentPhotos || [],
        subserviceIds: data.subserviceIds?.length ? data.subserviceIds : undefined,
      })

      const session = await loadPartnerSession()
      if (!session) {
        clearToken()
        throw new Error('Профиль партнёра не создан. Проверьте backend.')
      }
      setUser(session)
      notify('Заявка отправлена на модерацию GP')
      return session
    } finally {
      setLoading(false)
    }
  }, [notify])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      if (isDemoMode()) {
        const session = await demoApi.demoLogin(email, password)
        setUser(session)
        await refreshOrders()
        notify('Добро пожаловать!')
        return session
      }
      const loginId = email.trim().toLowerCase()
      const apiEmail = loginId.includes('@') ? loginId : `${loginId}@gp.kz`
      await api.login(apiEmail, password)
      const session = await loadPartnerSession()
      if (!session) {
        clearToken()
        throw new Error('Это не аккаунт партнёра. Войдите в GP Service или зарегистрируйтесь здесь.')
      }
      setUser(session)
      notify('Добро пожаловать!')
      return session
    } finally {
      setLoading(false)
    }
  }, [notify, refreshOrders])

  const logout = useCallback(() => {
    if (isDemoMode()) {
      demoApi.demoLogout()
      setUser(null)
      setActiveOrderId(null)
      setOrders([])
      return
    }
    api.logout()
    setUser(null)
    setActiveOrderId(null)
    setOrders([])
  }, [])

  const setOnline = useCallback(async (isOnline) => {
    await api.patchPartnerMe({ isOnline })
    setUser((u) => (u ? { ...u, isOnline } : u))
  }, [])

  const addPartnerOfferings = useCallback(
    async (subserviceIds) => {
      if (!subserviceIds?.length) throw new Error('Выберите хотя бы одну подуслугу')
      const profile = await api.addPartnerOfferings(subserviceIds)
      setUser((u) => (u
        ? {
            ...u,
            company: profile.company,
            directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
            balance: Number(profile.balance),
            isOnline: profile.isOnline,
            lat: profile.lat,
            lng: profile.lng,
            partnerProfileId: profile.id,
            serviceOfferings: profile.serviceOfferings || [],
    serviceAccess: profile.serviceAccess || [],
          }
        : u))
      notify('Подуслуги отправлены на модерацию')
    },
    [notify],
  )

  const acceptOrder = useCallback(async (orderId) => {
    if (isDemoMode()) {
      await demoApi.demoUpdateStatus(orderId, 'accepted')
      setActiveOrderId(orderId)
      await refreshOrders()
      notify('Заявка принята')
      return
    }
    await api.updateOrderStatus(orderId, { status: ORDER_STATUS_TO_API.accepted })
    setActiveOrderId(orderId)
    await refreshAll()
    notify('Заявка принята')
  }, [refreshAll, refreshOrders, notify])

  const advanceOrder = useCallback(async (orderId, uiStatus, location) => {
    if (isDemoMode()) {
      const map = { on_way: 'en_route', started: 'in_work', done: 'completed', completed: 'completed' }
      await demoApi.demoUpdateStatus(orderId, map[uiStatus] || uiStatus)
      await refreshOrders()
      notify('Статус обновлён')
      return
    }
    const apiStatus = ORDER_STATUS_TO_API[uiStatus] || uiStatus
    const body = { status: apiStatus }
    if (location) {
      body.executorLat = location.lat
      body.executorLng = location.lng
    }
    await api.updateOrderStatus(orderId, body)
    if (location && activeOrderId === orderId) {
      await api.updateGeoLocation({ lat: location.lat, lng: location.lng, orderId })
    }
    await refreshAll()
    notify('Статус обновлён')
  }, [refreshAll, refreshOrders, notify, activeOrderId])

  const cancelOrder = useCallback(async (orderId) => {
    await api.updateOrderStatus(orderId, { status: ORDER_STATUS_TO_API.cancelled })
    if (activeOrderId === orderId) setActiveOrderId(null)
    await refreshAll()
    notify('Заявка отменена')
  }, [activeOrderId, refreshAll, notify])

  const topupBalance = useCallback(async (amount) => {
    await api.topupBalance(amount)
    await syncPartner()
    await refreshTransactions()
    notify('Баланс пополнен')
  }, [syncPartner, refreshTransactions, notify])

  const addProduct = useCallback(async (p) => {
    if (!getToken()) throw new Error('Сессия истекла. Войдите снова.')
    if (!user?.partnerProfileId) throw new Error('Профиль партнёра не найден')
    const name = String(p.name || '').trim()
    if (!name) throw new Error('Укажите название товара')
    const price = Number(p.price)
    const stock = Number(p.stock)
    if (!Number.isFinite(price) || price < 0) throw new Error('Укажите корректную цену')
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      throw new Error('Остаток должен быть целым числом ≥ 0')
    }
    const item = await api.createProduct({
      name,
      price,
      stock,
      category: p.categoryId || p.category || 'irrigation',
      brand: user.company || 'Partner',
      description: p.description || '',
      specifications: p.specifications || '',
    })
    await refreshProducts()
    await syncPartner()
    notify('Товар добавлен в GP Shop')
    return item
  }, [user, refreshProducts, syncPartner, notify])

  const updateExecutorLocation = useCallback(async (lat, lng) => {
    await api.patchPartnerMe({ lat, lng })
    if (activeOrderId) await api.updateGeoLocation({ lat, lng, orderId: activeOrderId })
    setUser((u) => (u ? { ...u, lat, lng } : u))
  }, [activeOrderId])

  const newOrders = useMemo(
    () => (isDemoMode() ? [] : orders.filter((o) => o.status === 'new')),
    [orders],
  )
  const myOrders = useMemo(
    () =>
      isDemoMode()
        ? orders.filter((o) => o.partnerId === user?.partnerId)
        : orders.filter((o) => o.partnerId && o.status !== 'new'),
    [orders, user?.partnerId],
  )
  const activeOrders = useMemo(
    () => orders.filter((o) => !['new', 'cancelled', 'client_confirmed', 'done'].includes(o.status)),
    [orders],
  )
  const activeOrder = useMemo(() => orders.find((o) => o.id === activeOrderId) || activeOrders[0], [orders, activeOrderId, activeOrders])

  const value = {
    user, authReady, orders, ordersLoading, ordersError, newOrders, myOrders, activeOrders, activeOrder,
    products, productsLoading, productsError, transactions,
    loading, toast, activeOrderId, setActiveOrderId,
    register, login, logout, setOnline, addPartnerOfferings, acceptOrder, advanceOrder, cancelOrder,
    updateOrderStatus: (orderId, status) => advanceOrder(orderId, status),
    isDemoMode: isDemoMode(),
    refreshMarket: () => {},
    topupBalance, addProduct, refreshAll, updateExecutorLocation, notify,
    clearToast: () => setToast(null),
  }

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
}

export function usePartner() {
  const c = useContext(PartnerContext)
  if (!c) throw new Error('usePartner')
  return c
}
