import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, mapOrder } from '@gp/shared/api'
import { isDemoMode, subscribeGlobalStore, syncFromHub } from '@gp/shared/demo'
import {
  resolvePartnerRoleFromGroups,
  resolvePartnerTypeFromGroups,
  getPartnerAccess,
} from '@gp/shared/constants'
import { getStoreUiState } from '@gp/shared-core/storeUi'
import { buildTestPartnerCredentials } from '@gp/shared/utils'
import {
  activateTestMode,
  getTestMe,
  isBackendUnavailableError,
  isTestModeActive,
  isTestModeFallbackEnabled,
  loginTestPartner,
  logoutTestMode,
  registerTestPartner,
} from '@gp/shared/testMode'
import * as demoApi from '../lib/demoApi'
import { subscribeGlobalOrderStatus, resetTrackingSocket } from '@gp/shared/api/trackingSocket'
import { CATEGORY_TO_UI, ORDER_STATUS_TO_API } from '@gp/shared/api/mappers'

const KEYS = { activeOrder: 'gp-partner-active-order' }
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb } catch { return fb } }

function mapTestPartnerToSession(me) {
  const profile = me.partnerProfile || {}
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    phone: me.phone,
    company: profile.companyName || profile.company,
    directions: [],
    balance: Number(profile.balance ?? 10000),
    isOnline: false,
    partnerProfileId: profile.id,
    partnerStatus: profile.status || 'DRAFT',
    partnerType: profile.partnerType,
    partnerRole: profile.partnerRole,
    serviceOfferings: profile.serviceOfferings || [],
    serviceAccess: profile.serviceAccess || [],
    accountType: profile.accountType || 'INDIVIDUAL',
  }
}

async function loadPartnerSession() {
  if (!getToken()) return null
  if (isTestModeActive() && getToken().startsWith('gp_test_')) {
    const me = getTestMe()
    return me?.role === 'PARTNER' ? mapTestPartnerToSession(me) : null
  }
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
    partnerRole: profile.partnerRole,
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
    partnerRole: profile.partnerRole,
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
      const list = await api.getPartnerOrders()
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

  const refreshStores = useCallback(async () => {
    if (!getToken() || isDemoMode()) return
    try {
      const stores = await api.listPartnerStores()
      const { state } = getStoreUiState(stores)
      setUser((u) => (u ? { ...u, stores, storeUiState: state } : u))
    } catch {
      /* store optional until shop flow */
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshOrders(),
      refreshProducts(),
      refreshTransactions(),
      syncPartner(),
      refreshStores(),
    ])
  }, [refreshOrders, refreshProducts, refreshTransactions, syncPartner, refreshStores])

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
      const creds = buildTestPartnerCredentials(data)
      const mainGroupIds = data.mainGroupIds || []
      const partnerRole = data.partnerRole || resolvePartnerRoleFromGroups(mainGroupIds)
      if (!partnerRole) throw new Error('Выберите тип партнёра (категории услуг)')

      const partnerType = data.partnerType || resolvePartnerTypeFromGroups(mainGroupIds)
      const displayName = creds.name

      const runRegister = async () => {
        await api.registerPartner({
          name: displayName,
          company: data.company?.trim() || displayName,
          email: creds.email,
          phone: creds.phone,
          password: creds.password,
          referralCode: data.referralCode?.trim() || undefined,
          accountType: data.accountType || 'INDIVIDUAL',
          city: data.city?.trim() || 'Уральск',
          partnerRole,
          partnerType,
          bin: data.bin?.trim(),
          legalAddress: data.legalAddress?.trim(),
          idDocumentNumber: data.idDocumentNumber?.trim(),
          documents: data.documents,
        })

        await api.partnerApply({
          partnerType,
          partnerRole,
          companyName: data.company?.trim() || displayName,
          fullName: displayName,
          phone: creds.phone,
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
      }

      try {
        await runRegister()
      } catch (err) {
        if (!isTestModeFallbackEnabled() || !isBackendUnavailableError(err)) throw err
        activateTestMode()
        const { user } = registerTestPartner({ ...data, ...creds, partnerRole, partnerType })
        const session = mapTestPartnerToSession(user)
        setUser(session)
        notify('БД недоступна — партнёр сохранён локально (тестовый режим)')
        return session
      }

      const session = await loadPartnerSession()
      if (!session) {
        clearToken()
        throw new Error('Профиль партнёра не создан. Проверьте backend.')
      }
      setUser(session)
      notify('Регистрация успешна')
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
      if (isTestModeActive() && getToken().startsWith('gp_test_')) {
        const loginId = email.trim().toLowerCase()
        const apiEmail = loginId.includes('@') ? loginId : `${loginId}@gp.kz`
        const { user } = loginTestPartner(apiEmail, password)
        const session = mapTestPartnerToSession(user)
        setUser(session)
        notify('Вход (тестовый режим)')
        return session
      }
      const loginId = email.trim().toLowerCase()
      const apiEmail = loginId.includes('@') ? loginId : `${loginId}@gp.kz`
      const pwd = password || '123456'
      try {
        await api.login(apiEmail, pwd)
      } catch (err) {
        if (!isTestModeFallbackEnabled() || !isBackendUnavailableError(err)) throw err
        activateTestMode()
        const { user } = loginTestPartner(apiEmail, pwd)
        const session = mapTestPartnerToSession(user)
        setUser(session)
        notify('API недоступен — тестовый режим')
        return session
      }
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
    if (isTestModeActive() || getToken()?.startsWith('gp_test_')) {
      logoutTestMode()
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
      notify('Жаңа қызмет түрлері модерацияға жіберілді')
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
    await api.acceptPartnerOrder(orderId)
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
    await api.updatePartnerOrderStatus(orderId, body)
    if (location && activeOrderId === orderId) {
      await api.updateGeoLocation({ lat: location.lat, lng: location.lng, orderId })
    }
    await refreshAll()
    notify('Статус обновлён')
  }, [refreshAll, refreshOrders, notify, activeOrderId])

  const cancelOrder = useCallback(async (orderId) => {
    await api.rejectPartnerOrder(orderId)
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
    const access = getPartnerAccess(user || {})
    if (!access.shopProducts) {
      throw new Error('Добавление товаров доступно после одобрения магазина')
    }
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

  const isMyOrder = useCallback(
    (o) => (o.assignedPartnerId ?? o.partnerId) === user?.partnerProfileId,
    [user?.partnerProfileId],
  )
  const newOrders = useMemo(
    () => orders.filter((o) => isMyOrder(o) && o.status === 'new'),
    [orders, isMyOrder],
  )
  const myOrders = useMemo(
    () => orders.filter((o) => isMyOrder(o) && o.status !== 'new'),
    [orders, isMyOrder],
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
    topupBalance, addProduct, refreshAll, refreshStores, updateExecutorLocation, notify,
    clearToast: () => setToast(null),
  }

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
}

export function usePartner() {
  const c = useContext(PartnerContext)
  if (!c) throw new Error('usePartner')
  return c
}
