import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken } from '@gp/shared/api'
import { isDemoMode, subscribeGlobalStore, syncFromHub } from '@gp/shared/demo'
import * as demoApi from '../lib/demoApi'
import * as marketDemo from '../lib/marketDemoApi'
import { subscribeGlobalOrderStatus, resetTrackingSocket } from '@gp/shared/api/trackingSocket'
import { CATEGORY_TO_API, PAYMENT_TO_API } from '@gp/shared/api/mappers'
import { calcServiceTotal, computeShopDeliveryFee, LAWN_SERVICE_IDS } from '@gp/shared/constants'
import { buildTestClientCredentials } from '@gp/shared/utils'
import { SERVICE_CATALOG, getServiceOrderCategory } from '../data/services'

const KEYS = {
  cart: 'gp-service-cart',
  favorites: 'gp-service-favorites',
  objects: 'gp-service-objects',
  profile: 'gp-service-profile',
  checkout: 'gp-service-checkout-draft',
  partnerLeads: 'gp-service-partner-leads',
}

const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb } catch { return fb } }

const ServiceContext = createContext(null)

export function ServiceProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [cart, setCart] = useState(() => load(KEYS.cart, []))
  const [favorites, setFavorites] = useState(() => load(KEYS.favorites, []))
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [objects, setObjects] = useState(() => load(KEYS.objects, [
    { id: 'obj1', name: 'Дом, ул. Мухит 112', type: 'house', address: 'Уральск, Мухит 112', area: 6 },
    { id: 'obj2', name: 'Дача «Береке»', type: 'cottage', address: 'Уральск, дачный кооператив', area: 12 },
  ]))
  const [profile, setProfile] = useState(() => load(KEYS.profile, {
    name: '', phone: '', email: '', city: 'Уральск',
  }))
  const [checkoutDraft, setCheckoutDraft] = useState(() => load(KEYS.checkout, null))
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'success') => setToast({ message, type }), [])

  const syncAuth = useCallback(async () => {
    if (!getToken()) {
      setAuthUser(null)
      return
    }
    try {
      const me = await api.me()
      if (me.role !== 'CLIENT' || !me.clientProfile) {
        clearToken()
        setAuthUser(null)
        return
      }
      setAuthUser(me)
      setProfile((p) => ({
        ...p,
        name: me.name || p.name,
        phone: me.phone || p.phone,
        email: me.email || p.email,
      }))
    } catch {
      clearToken()
      setAuthUser(null)
    }
  }, [])

  useEffect(() => {
    if (isDemoMode()) {
      const session = demoApi.getDemoSession()
      if (session) {
        setAuthUser({ ...session, role: 'CLIENT', clientProfile: { id: session.clientId } })
        setProfile((p) => ({ ...p, name: session.name, city: session.city }))
      }
      setAuthReady(true)
      syncFromHub()
      return subscribeGlobalStore(() => {
        syncFromHub().then(() => {
          refreshProducts()
          if (demoApi.getDemoSession()) refreshOrders()
        })
      })
    }
    syncAuth().finally(() => setAuthReady(true))
  }, [syncAuth])

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      if (isDemoMode()) {
        const session = demoApi.getDemoSession()
        const list = session
          ? await marketDemo.demoGetMarketProducts({})
          : []
        setProducts(list)
        setProductsError(null)
      } else {
        const list = await api.getMarketProducts()
        setProducts(list)
        setProductsError(null)
      }
    } catch (e) {
      setProductsError(e?.message || 'Не удалось загрузить товары')
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const refreshOrders = useCallback(async () => {
    if (isDemoMode()) {
      if (!demoApi.getDemoSession()) {
        setOrders([])
        return
      }
      setOrdersLoading(true)
      try {
        const service = await demoApi.demoGetOrders()
        const market = await marketDemo.demoGetMarketOrders()
        setOrders([...service, ...market])
      } finally {
        setOrdersLoading(false)
      }
      return
    }
    if (!getToken()) {
      setOrders([])
      return
    }
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      setOrders(await api.getOrders())
    } catch (e) {
      setOrders([])
      setOrdersError(e?.message || 'Не удалось загрузить заказы')
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProducts()
    const t = setInterval(refreshProducts, 15000)
    return () => clearInterval(t)
  }, [refreshProducts])

  useEffect(() => {
    if (!authUser) return
    refreshOrders()
    if (isDemoMode()) {
      const t = setInterval(refreshOrders, 3000)
      return () => clearInterval(t)
    }
    const t = setInterval(refreshOrders, 8000)
    const unsubWs = subscribeGlobalOrderStatus(() => {
      refreshOrders()
    })
    return () => {
      clearInterval(t)
      unsubWs()
    }
  }, [authUser, refreshOrders])

  useEffect(() => {
    if (!authUser) resetTrackingSocket('logout')
  }, [authUser])

  useEffect(() => { localStorage.setItem(KEYS.cart, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(KEYS.favorites, JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem(KEYS.objects, JSON.stringify(objects)) }, [objects])
  useEffect(() => { localStorage.setItem(KEYS.profile, JSON.stringify(profile)) }, [profile])
  useEffect(() => {
    if (checkoutDraft) localStorage.setItem(KEYS.checkout, JSON.stringify(checkoutDraft))
    else localStorage.removeItem(KEYS.checkout)
  }, [checkoutDraft])

  const login = useCallback(async (email, password) => {
    if (isDemoMode()) {
      const session = await demoApi.demoLogin(email, password)
      setAuthUser({ ...session, role: 'CLIENT', clientProfile: { id: session.clientId } })
      setProfile((p) => ({ ...p, name: session.name, city: session.city, phone: session.phone }))
      await refreshOrders()
      notify('Вход выполнен')
      return true
    }
    await api.login(email, password)
    const me = await api.me()
    if (me.role !== 'CLIENT' || !me.clientProfile) {
      clearToken()
      throw new Error('Это аккаунт партнёра. Для услуг войдите как client@gp.kz или откройте GP Partner.')
    }
    setAuthUser(me)
    setProfile((p) => ({
      ...p,
      name: me.name || p.name,
      phone: me.phone || p.phone,
      email: me.email || p.email,
    }))
    notify('Вход выполнен')
    return true
  }, [notify, refreshOrders])

  const register = useCallback(async (data) => {
    const creds = buildTestClientCredentials(data)
    const accountType = data.accountType || 'INDIVIDUAL'
    const isLegal = accountType === 'LEGAL_ENTITY'
    const displayName = data.name?.trim() || data.companyName?.trim() || creds.name
    await api.registerClient({
      email: creds.email,
      password: creds.password,
      name: displayName,
      phone: creds.phone,
      accountType,
      companyName: isLegal ? (data.companyName?.trim() || displayName) : undefined,
      bin: data.bin,
      legalAddress: data.legalAddress,
      contactPerson: isLegal ? (data.contactPerson?.trim() || displayName) : undefined,
    })
    await syncAuth()
    notify('Регистрация успешна')
    return true
  }, [syncAuth, notify])

  const logout = useCallback(() => {
    if (isDemoMode()) {
      demoApi.demoLogout()
      setAuthUser(null)
      setOrders([])
      notify('Вы вышли', 'info')
      return
    }
    api.logout()
    setAuthUser(null)
    setOrders([])
    notify('Вы вышли', 'info')
  }, [notify])

  const requireAuth = useCallback(() => {
    if (isDemoMode()) {
      if (!demoApi.getDemoSession()) throw new Error('auth_required')
      return
    }
    if (!getToken()) throw new Error('Войдите как клиент: Профиль → Вход (demo: client@gp.kz)')
    if (authUser && authUser.role !== 'CLIENT') {
      throw new Error('Аккаунт партнёра не подходит для заказа услуг. Используйте client@gp.kz')
    }
  }, [authUser])

  const cartItems = useMemo(() => cart.map((i) => {
    const product = products.find((p) => p.id === i.productId)
    return product ? { ...i, product } : null
  }).filter(Boolean), [cart, products])

  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + Number(i.product.price) * i.qty, 0), [cartItems])
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])

  const getProductById = useCallback((id) => products.find((p) => p.id === id), [products])

  const addToCart = useCallback((productId, qty = 1) => {
    const p = products.find((x) => x.id === productId)
    if (!p?.inStock && !(p?.stock > 0)) { notify('Нет в наличии', 'info'); return false }
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === productId)
      if (ex) return prev.map((i) => i.productId === productId ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { productId, qty }]
    })
    notify(`«${p.name}» в корзине`)
    return true
  }, [products, notify])

  const updateCartQty = useCallback((productId, qty) => {
    if (qty < 1) setCart((p) => p.filter((i) => i.productId !== productId))
    else setCart((p) => p.map((i) => i.productId === productId ? { ...i, qty } : i))
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart((p) => p.filter((i) => i.productId !== productId))
    notify('Удалено из корзины', 'info')
  }, [notify])

  const clearCart = useCallback(() => setCart([]), [])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      if (prev.includes(id)) { notify('Убрано из избранного', 'info'); return prev.filter((x) => x !== id) }
      notify('Добавлено в избранное')
      return [...prev, id]
    })
  }, [notify])

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites])
  const favoriteProducts = useMemo(() => products.filter((p) => favorites.includes(p.id)), [products, favorites])

  const allOrders = useMemo(() => {
    return [...orders].map((o) => ({
      ...o,
      kind: o.kind === 'market' ? 'market' : o.category === 'shop' ? 'shop' : 'service',
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders])

  const placeShopOrder = useCallback(async (data) => {
    requireAuth()
    const mode = data.deliveryMode === 'pickup' ? 'pickup' : 'courier'
    const deliveryFee = computeShopDeliveryFee(cartTotal, mode)
    const orderTotal = cartTotal + deliveryFee

    if (isDemoMode()) {
      const payMap = { kaspi_partner: 'kaspi_qr', kaspi: 'kaspi_qr', cash: 'cash', card: 'card' }
      const order = await marketDemo.demoPlaceMarketOrder({
        items: cartItems.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: Number(i.product.price),
          qty: i.qty,
          unit: i.product.unit || 'шт',
        })),
        deliveryType: mode === 'pickup' ? 'PICKUP' : 'DELIVERY',
        deliveryAddress: data.address,
        paymentMethod: payMap[data.paymentMethod] || 'cash',
        deliveryPrice: deliveryFee,
      })
      await refreshOrders()
      clearCart()
      setCheckoutDraft(null)
      notify('Заказ GP Market оформлен')
      return order
    }

    const deliveryLine =
      mode === 'pickup'
        ? 'Доставка: самовывоз'
        : deliveryFee === 0
          ? 'Доставка: курьер (0 ₸, по сумме заказа)'
          : `Доставка: курьер (+${deliveryFee} ₸)`
    const commentParts = [data.comment, deliveryLine].filter(Boolean)

    const payload = {
      category: 'SHOP',
      serviceName: 'Заказ из GP Shop',
      address: data.address,
      clientLat: Number(data.lat) || 51.233,
      clientLng: Number(data.lng) || 51.367,
      total: orderTotal,
      paymentMethod: PAYMENT_TO_API[data.paymentMethod] || 'CASH_ON_DELIVERY',
      comment: commentParts.join('\n'),
      items: cartItems.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: Number(i.product.price),
        qty: i.qty,
      })),
    }
    const order = await api.createOrder(payload)
    await refreshOrders()
    clearCart()
    setCheckoutDraft(null)
    notify('Заказ оформлен! Оплата — партнёру напрямую.')
    return order
  }, [cartItems, cartTotal, clearCart, notify, refreshOrders, requireAuth])

  const placeServiceOrder = useCallback(async (data) => {
    requireAuth()
    if (isDemoMode()) {
      await demoApi.demoPlaceServiceOrder(data)
      await refreshOrders()
      notify('Заявка отправлена! Партнёр увидит её в GP Partner.')
      return { id: 'demo' }
    }
    const obj = objects.find((o) => o.id === data.objectId)
    const cat = getServiceOrderCategory(data.serviceId)
    const apiCategory = CATEGORY_TO_API[cat]
    if (!apiCategory) throw new Error('Неизвестная услуга')
    const isSeptic = data.serviceId === 'septic-pumping'
    if (isSeptic && !data.septicVolume) throw new Error('Укажите объём септика')
    if (!data.preferredDate && !data.flexibleTime) {
      throw new Error('Укажите дату визита или отметьте «любое свободное время»')
    }
    if (LAWN_SERVICE_IDS.includes(data.serviceId) && (!data.lawnAreaSqm || Number(data.lawnAreaSqm) < 1)) {
      throw new Error('Укажите площадь участка в м²')
    }
    const total =
      calcServiceTotal({
        serviceId: data.serviceId,
        septicVolume: isSeptic ? Number(data.septicVolume) : undefined,
        lawnAreaSqm: data.lawnAreaSqm ? Number(data.lawnAreaSqm) : undefined,
      }) || Number(data.total) || 0

    const payload = {
      category: apiCategory,
      serviceName: data.serviceName,
      serviceId: data.serviceId,
      address: data.address || obj?.address || 'Уральск',
      clientLat: Number(data.lat ?? data.clientLat) || 51.233,
      clientLng: Number(data.lng ?? data.clientLng) || 51.367,
      total,
      paymentMethod: PAYMENT_TO_API[data.paymentMethod] || 'CASH_ON_DELIVERY',
      comment: data.comment,
      septicVolume: isSeptic ? Number(data.septicVolume) : undefined,
      preferredDate: data.preferredDate || undefined,
      preferredTime: data.flexibleTime ? undefined : data.preferredTime,
      flexibleTime: !!data.flexibleTime,
      lawnAreaSqm: data.lawnAreaSqm ? Number(data.lawnAreaSqm) : undefined,
    }
    const order = await api.createOrder(payload)
    await refreshOrders()
    notify('Заявка отправлена! Партнёр увидит её в GP Partner.')
    return order
  }, [objects, notify, refreshOrders, requireAuth])

  const submitPartnerLead = useCallback((data) => {
    const leads = load(KEYS.partnerLeads, [])
    leads.push({ ...data, id: `lead-${Date.now()}`, createdAt: new Date().toISOString() })
    localStorage.setItem(KEYS.partnerLeads, JSON.stringify(leads))
    notify('Заявка отправлена!')
    return true
  }, [notify])

  const recommendations = useMemo(
    () => [...products].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 8),
    [products],
  )

  const value = {
    authUser, authReady, isLoggedIn: !!authUser,
    products, productsLoading, productsError, refreshProducts, cart, cartItems, cartTotal, cartCount, favorites, favoriteProducts,
    orders, ordersLoading, ordersError, allOrders, objects, profile, checkoutDraft,
    toast, SERVICE_CATALOG, recommendations,
    getProductById, addToCart, updateCartQty, removeFromCart, clearCart,
    toggleFavorite, isFavorite, placeShopOrder, placeServiceOrder,
    setCheckoutDraft, setProfile, setObjects, submitPartnerLead, notify,
    login, register, logout, refreshOrders,
    isDemoMode: isDemoMode(),
    demoFranchises: isDemoMode() ? demoApi.demoFranchises() : [],
    cancelOrder: async (orderId) => {
      requireAuth()
      if (isDemoMode()) {
        const o = orders.find((x) => x.id === orderId)
        if (o?.kind === 'market') await marketDemo.demoCancelMarketOrder(orderId)
        else await demoApi.demoCancelOrder(orderId)
        await refreshOrders()
        notify('Заявка отменена', 'info')
        return
      }
      throw new Error('API only')
    },
    updateClientOrder: async (orderId, patch) => {
      requireAuth()
      if (isDemoMode()) {
        await demoApi.demoUpdateOrder(orderId, patch)
        await refreshOrders()
        notify('Заявка обновлена')
        return
      }
      throw new Error('API only')
    },
    confirmOrder: async (orderId) => {
      requireAuth()
      const order = await api.confirmOrder(orderId)
      await refreshOrders()
      notify('Выполнение подтверждено')
      return order
    },
    clearToast: () => setToast(null),
  }

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
}

export function useService() {
  const ctx = useContext(ServiceContext)
  if (!ctx) throw new Error('useService requires ServiceProvider')
  return ctx
}
