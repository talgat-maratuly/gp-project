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
import { subscribeGlobalOrderStatus, subscribeSpecialistFeed, resetTrackingSocket } from '@gp/shared/api/trackingSocket'
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

function partnerIsOnline(profile) {
  if (!profile) return false
  if (profile.workStatus) return profile.workStatus === 'ONLINE'
  return !!profile.isOnline
}

async function loadPartnerSession() {
  if (!getToken()) return null
  if (isTestModeActive() && getToken().startsWith('gp_test_')) {
    const me = getTestMe()
    return me?.partnerProfile ? mapTestPartnerToSession(me) : null
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
    isOnline: partnerIsOnline(profile),
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
  const [feed, setFeed] = useState([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState(null)
  const [marketOrders, setMarketOrders] = useState([])
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
      isOnline: partnerIsOnline(profile),
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
    if (user?.partnerStatus && user.partnerStatus !== 'APPROVED') {
      setOrders([])
      return
    }
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
  }, [notify, user?.partnerStatus])

  // Лента пула: только ONLINE-специалист видит matching-заказы (видимость решает бэкенд)
  const refreshFeed = useCallback(async () => {
    if (isDemoMode() || demoApi.getDemoSession()) return
    if (!getToken()) return
    if (!user?.isOnline) {
      setFeed([])
      return
    }
    setFeedLoading(true)
    try {
      setFeed(await api.getSpecialistFeed())
    } catch (e) {
      console.warn('[feed]', e?.message || e)
      setFeed([])
    } finally {
      setFeedLoading(false)
    }
  }, [user?.isOnline])

  const refreshProducts = useCallback(async () => {
    if (!user?.partnerProfileId) return
    setProductsLoading(true)
    setProductsError(null)
    try {
      const access = getPartnerAccess(user || {})
      setProducts(
        access.shopProducts
          ? await api.getPartnerMarketProducts()
          : await api.getProducts({ partnerId: user.partnerProfileId }),
      )
    } catch (e) {
      setProductsError(e?.message || 'Не удалось загрузить товары')
      notify(e?.message || 'Не удалось загрузить товары')
    } finally {
      setProductsLoading(false)
    }
  }, [user, notify])

  const refreshMarketOrders = useCallback(async () => {
    if (!getToken() || isDemoMode()) return
    const access = getPartnerAccess(user || {})
    if (!access.shop) {
      setMarketOrders([])
      return
    }
    try {
      setMarketOrders(await api.getPartnerMarketOrders())
    } catch {
      setMarketOrders([])
    }
  }, [user])

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
      refreshFeed(),
      refreshProducts(),
      refreshTransactions(),
      syncPartner(),
      refreshStores(),
      refreshMarketOrders(),
    ])
  }, [refreshOrders, refreshFeed, refreshProducts, refreshTransactions, syncPartner, refreshStores, refreshMarketOrders])

  useEffect(() => {
    if (!user?.id) return
    refreshAll()
    if (isDemoMode()) {
      const t = setInterval(refreshOrders, 3000)
      return () => clearInterval(t)
    }
    const t = setInterval(() => {
      refreshOrders()
      refreshFeed()
    }, 5000)
    const unsubWs = subscribeGlobalOrderStatus(() => {
      refreshOrders()
    })
    const unsubFeed = subscribeSpecialistFeed(() => {
      refreshFeed()
    }, user?.partnerProfileId)
    return () => {
      clearInterval(t)
      unsubWs()
      unsubFeed()
    }
  }, [user?.id, user?.partnerProfileId, refreshAll, refreshOrders, refreshFeed])

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

  const loginViaWhatsappOtp = useCallback(async () => {
    setLoading(true)
    try {
      const session = await loadPartnerSession()
      if (!session) {
        clearToken()
        throw new Error('Это не аккаунт партнёра. Зарегистрируйтесь или войдите по email.')
      }
      setUser(session)
      await refreshOrders()
      notify('Добро пожаловать!')
      return session
    } finally {
      setLoading(false)
    }
  }, [notify, refreshOrders])

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

  const logout = useCallback(async () => {
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
    await api.logout()
    setUser(null)
    setActiveOrderId(null)
    setOrders([])
  }, [])

  const setOnline = useCallback(async (isOnline) => {
    const profile = await api.patchPartnerMe({ isOnline })
    setUser((u) => (u ? { ...u, isOnline: partnerIsOnline(profile), workStatus: profile.workStatus } : u))
    if (partnerIsOnline(profile)) refreshFeed()
    else setFeed([])
  }, [refreshFeed])

  const addPartnerOfferings = useCallback(
    async (subserviceIds) => {
      if (!subserviceIds?.length) throw new Error('Выберите хотя бы одну подуслугу')
      if (isDemoMode()) {
        const offerings = await demoApi.demoAddPartnerOfferings(user.partnerProfileId, subserviceIds)
        setUser((u) => (u ? { ...u, serviceOfferings: offerings } : u))
        notify('Новые услуги отправлены на модерацию')
        return offerings
      }
      const profile = await api.addPartnerOfferings(subserviceIds)
      setUser((u) => (u
        ? {
            ...u,
            company: profile.company,
            directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
            balance: Number(profile.balance),
            isOnline: partnerIsOnline(profile),
            lat: profile.lat,
            lng: profile.lng,
            partnerProfileId: profile.id,
            serviceOfferings: profile.serviceOfferings || [],
    serviceAccess: profile.serviceAccess || [],
          }
        : u))
      notify('Новые услуги отправлены на модерацию')
    },
    [notify, user?.partnerProfileId],
  )

  const saveCustomOffering = useCallback(
    async (data) => {
      if (!user?.partnerProfileId) throw new Error('auth_required')
      if (isDemoMode()) {
        const offering = await demoApi.demoSaveCustomOffering(user.partnerProfileId, data)
        const offerings = demoApi.demoGetPartnerOfferings(user.partnerProfileId)
        setUser((u) => (u ? { ...u, serviceOfferings: offerings } : u))
        notify(data.id ? 'Услуга обновлена' : 'Услуга отправлена на модерацию')
        return offering
      }
      throw new Error('custom_offering_api_unavailable')
    },
    [notify, user?.partnerProfileId],
  )

  const acceptOrder = useCallback(async (orderId) => {
    if (isDemoMode()) {
      await demoApi.demoUpdateStatus(orderId, 'accepted', { partnerId: user?.partnerProfileId, assignedPartnerId: user?.partnerProfileId })
      setActiveOrderId(orderId)
      await refreshOrders()
      return orderId
    }
    const accepted = await api.acceptPartnerOrder(orderId)
    setOrders((prev) => [accepted, ...prev.filter((o) => o.id !== accepted.id)])
    setActiveOrderId(orderId)
    await refreshAll()
    return orderId
  }, [refreshAll, refreshOrders, user?.partnerProfileId])

  // Приём заказа из общей ленты (пула). Race-protection — на бэкенде.
  const acceptFromFeed = useCallback(async (orderId) => {
    try {
      if (isDemoMode()) {
        await demoApi.demoPatchOrder(orderId, {
          status: 'assigned',
          partnerId: user?.partnerProfileId,
          assignedPartnerId: user?.partnerProfileId,
          partnerName: user?.company || user?.name,
        })
        setActiveOrderId(orderId)
        await Promise.all([refreshOrders(), refreshFeed()])
        return orderId
      }
      const accepted = await api.acceptOrderFromPool(orderId)
      setOrders((prev) => [accepted, ...prev.filter((o) => o.id !== accepted.id)])
      setFeed((prev) => prev.filter((o) => o.id !== orderId))
      setActiveOrderId(orderId)
      await Promise.all([refreshAll(), refreshFeed()])
      return orderId
    } catch (e) {
      await refreshFeed()
      notify(e?.message || 'Не удалось принять заказ')
      throw e
    }
  }, [refreshAll, refreshFeed, refreshOrders, notify, user?.partnerProfileId, user?.company, user?.name])

  const advanceOrder = useCallback(async (orderId, uiStatus, location) => {
    if (isDemoMode()) {
      const map = { on_way: 'en_route', in_process: 'in_work', started: 'in_work', done: 'completed', completed: 'completed' }
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

  const cancelOrder = useCallback(async (orderId, cancelReason) => {
    if (isDemoMode()) {
      await demoApi.demoUpdateStatus(orderId, 'cancelled')
      if (activeOrderId === orderId) setActiveOrderId(null)
      await refreshAll()
      notify('Заказ отменён', 'info')
      return
    }
    const reason = (cancelReason || '').trim()
    if (reason.length < 3) throw new Error('Укажите причину отмены')
    await api.rejectPartnerOrder(orderId, reason)
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
    const store = (user.stores || []).find((s) => s.status === 'APPROVED' || s.status === 'ACTIVE')
    if (!store) throw new Error('Сначала дождитесь одобрения магазина')
    const item = await api.createPartnerMarketProduct({
      storeId: store.id,
      name,
      price,
      quantity: stock,
      categoryId: p.categoryId || p.category || 'irrigation',
      description: p.description || '',
      images: p.images || [],
      isActive: true,
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
    () => orders.filter((o) => isMyOrder(o) && !['new', 'cancelled', 'client_confirmed', 'done', 'completed'].includes(o.status)),
    [orders, isMyOrder],
  )
  const activeOrder = useMemo(() => orders.find((o) => o.id === activeOrderId) || activeOrders[0], [orders, activeOrderId, activeOrders])

  const value = {
    user, authReady, orders, ordersLoading, ordersError, newOrders, myOrders, activeOrders, activeOrder,
    feed, feedLoading, refreshFeed, acceptFromFeed,
    products, productsLoading, productsError, marketOrders, transactions,
    loading, toast, activeOrderId, setActiveOrderId,
    register, login, loginViaWhatsappOtp, logout, setOnline, addPartnerOfferings, saveCustomOffering, acceptOrder, advanceOrder, cancelOrder,
    updateOrderStatus: (orderId, status) => advanceOrder(orderId, status),
    isDemoMode: isDemoMode(),
    refreshMarket: refreshMarketOrders,
    topupBalance, addProduct, refreshAll, refreshStores, updateExecutorLocation, notify,
    syncPartner,
    clearToast: () => setToast(null),
  }

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
}

export function usePartner() {
  const c = useContext(PartnerContext)
  if (!c) throw new Error('usePartner')
  return c
}
