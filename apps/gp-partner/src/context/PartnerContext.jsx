import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, mapOrder } from '@gp/shared/api'
import { CATEGORY_TO_UI, ORDER_STATUS_TO_API } from '@gp/shared/api/mappers'

const KEYS = { activeOrder: 'gp-partner-active-order' }
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb } catch { return fb } }

async function loadPartnerSession() {
  if (!getToken()) return null
  const me = await api.me()
  const profile = me.partnerProfile
  if (!profile) return null
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    phone: me.phone,
    company: profile.company,
    directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
    balance: Number(profile.balance),
    isOnline: profile.isOnline,
    lat: profile.lat,
    lng: profile.lng,
    partnerProfileId: profile.id,
    serviceOfferings: profile.serviceOfferings || [],
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
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeOrderId, setActiveOrderId] = useState(() => load(KEYS.activeOrder, null))
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => setToast({ msg }), [])

  useEffect(() => {
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
    const profile = await api.getPartnerMe()
    setUser((u) => ({
      ...u,
      company: profile.company,
      directions: (profile.directions || []).map((d) => CATEGORY_TO_UI[d] || d.toLowerCase()),
      balance: Number(profile.balance),
      isOnline: profile.isOnline,
      lat: profile.lat,
      lng: profile.lng,
      partnerProfileId: profile.id,
      serviceOfferings: profile.serviceOfferings || [],
      accountType: profile.accountType,
      bin: profile.bin,
      legalAddress: profile.legalAddress,
      idDocumentNumber: profile.idDocumentNumber,
      documents: profile.documents,
    }))
  }, [user?.id])

  const refreshOrders = useCallback(async () => {
    if (!getToken()) return
    try {
      const list = await api.getOrders()
      setOrders(list)
    } catch (e) {
      notify(e.message || 'API недоступен')
    }
  }, [notify])

  const refreshProducts = useCallback(async () => {
    if (!user?.partnerProfileId) return
    try {
      setProducts(await api.getProducts({ partnerId: user.partnerProfileId }))
    } catch (e) {
      notify(e.message || 'Не удалось загрузить товары')
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
    const t = setInterval(refreshOrders, 5000)
    return () => clearInterval(t)
  }, [user?.id, refreshAll, refreshOrders])

  const register = useCallback(async (data) => {
    setLoading(true)
    try {
      await api.registerPartner({
        name: data.name.trim(),
        company: data.company?.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
        referralCode: data.referralCode?.trim() || undefined,
        subserviceIds: data.subserviceIds,
        accountType: data.accountType || 'INDIVIDUAL',
        city: data.city?.trim() || 'Уральск',
        bin: data.bin?.trim(),
        legalAddress: data.legalAddress?.trim(),
        idDocumentNumber: data.idDocumentNumber?.trim(),
        documents: data.documents,
      })
      const session = await loadPartnerSession()
      if (!session) {
        clearToken()
        throw new Error('Профиль партнёра не создан. Проверьте backend.')
      }
      setUser(session)
      notify('Регистрация успешна!')
      return session
    } finally {
      setLoading(false)
    }
  }, [notify])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      await api.login(email.trim().toLowerCase(), password)
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
  }, [notify])

  const logout = useCallback(() => {
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
          }
        : u))
      notify('Подуслуги отправлены на модерацию')
    },
    [notify],
  )

  const acceptOrder = useCallback(async (orderId) => {
    await api.updateOrderStatus(orderId, { status: ORDER_STATUS_TO_API.accepted })
    setActiveOrderId(orderId)
    await refreshAll()
    notify('Заявка принята')
  }, [refreshAll, notify])

  const advanceOrder = useCallback(async (orderId, uiStatus, location) => {
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
  }, [refreshAll, notify, activeOrderId])

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

  const newOrders = useMemo(() => orders.filter((o) => o.status === 'new'), [orders])
  const activeOrders = useMemo(
    () => orders.filter((o) => !['new', 'cancelled', 'client_confirmed'].includes(o.status)),
    [orders],
  )
  const activeOrder = useMemo(() => orders.find((o) => o.id === activeOrderId) || activeOrders[0], [orders, activeOrderId, activeOrders])

  const value = {
    user, authReady, orders, newOrders, activeOrders, activeOrder, products, transactions,
    loading, toast, activeOrderId, setActiveOrderId,
    register, login, logout, setOnline, addPartnerOfferings, acceptOrder, advanceOrder, cancelOrder,
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
