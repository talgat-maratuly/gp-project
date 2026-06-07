import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, clearToken, getToken } from '@gp/shared/api'
import { isDemoMode, subscribeGlobalStore, syncFromHub, loadGlobalStore } from '@gp/shared/demo'
import * as demoApi from '../lib/demoApi'
import * as marketDemo from '../lib/marketDemoApi'
import { subscribeGlobalOrderStatus, resetTrackingSocket } from '@gp/shared/api/trackingSocket'
import { CATEGORY_TO_API, PAYMENT_TO_API } from '@gp/shared/api/mappers'
import { computeShopDeliveryFee, LAWN_SERVICE_IDS } from '@gp/shared/constants'
import { buildTestClientCredentials } from '@gp/shared/utils'
import {
  activateTestMode,
  getTestMe,
  isBackendUnavailableError,
  isTestModeActive,
  isTestModeFallbackEnabled,
  loginTestClient,
  logoutTestMode,
  registerTestClient,
} from '@gp/shared/testMode'
import { STATIC_GEO_STORE } from '@gp/shared/geography'
import {
  buildSepticServiceFromStore,
  calcServiceTotalWithCity,
  filterCatalogForCity,
  getSepticVolumeOptionsForCity,
  isServiceActiveInCity,
} from '@gp/shared/services/cityCatalog'
import { SERVICE_CATALOG, getServiceOrderCategory } from '../data/services'

const KEYS = {
  cart: 'gp-service-cart',
  favorites: 'gp-service-favorites',
  objects: 'gp-service-objects',
  profile: 'gp-service-profile',
  checkout: 'gp-service-checkout-draft',
  partnerLeads: 'gp-service-partner-leads',
}

const CITY_TO_REGION_CODE = {
  'city-uralsk': 'uralsk',
  'city-aktobe': 'aktobe',
  'city-atyrau': 'atyrau',
  'city-almaty': 'almaty',
  'city-astana': 'astana',
}

const FRANCHISE_TO_REGION_CODE = {
  'fr-uralsk': 'uralsk',
  'fr-aktobe': 'aktobe',
  'fr-atyrau': 'atyrau',
  'fr-almaty': 'almaty',
  'fr-astana': 'astana',
}

function regionCodeForProfile(profile = {}) {
  return CITY_TO_REGION_CODE[profile.cityId] || FRANCHISE_TO_REGION_CODE[profile.franchiseId] || 'uralsk'
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
    oblastId: 'obl-batys', cityId: 'city-uralsk', franchiseId: 'fr-uralsk',
  }))
  const [checkoutDraft, setCheckoutDraft] = useState(() => load(KEYS.checkout, null))
  const [toast, setToast] = useState(null)
  const [geoStore, setGeoStore] = useState(() => (isDemoMode() ? loadGlobalStore() : null))
  const [catalogByFranchise, setCatalogByFranchise] = useState({})
  const [catalogLoadingFranchise, setCatalogLoadingFranchise] = useState(null)
  const [catalogFetchedKeys, setCatalogFetchedKeys] = useState(() => new Set())
  const catalogByFranchiseRef = useRef(catalogByFranchise)
  catalogByFranchiseRef.current = catalogByFranchise

  const catalogCacheKey = useCallback((franchiseId, cityId) => {
    const fid = franchiseId?.trim()
    const cid = cityId?.trim()
    return fid || (cid ? `city:${cid}` : '')
  }, [])

  const resolveCatalogStore = useCallback((franchiseId, cityId) => {
    if (isDemoMode()) return geoStore
    const fid = franchiseId || profile.franchiseId
    const cid = cityId || profile.cityId
    const services =
      (fid && catalogByFranchise[fid]) ||
      (cid && catalogByFranchise[`city:${cid}`]) ||
      null
    if (!services?.length) return null
    return { services }
  }, [geoStore, catalogByFranchise, profile.franchiseId, profile.cityId])

  useEffect(() => {
    if (!isDemoMode()) return undefined
    return subscribeGlobalStore(setGeoStore)
  }, [])

  const ensureCatalog = useCallback(async (franchiseIdOrOpts, cityIdArg) => {
    if (isDemoMode()) return geoStore
    let franchiseId = franchiseIdOrOpts
    let cityId = cityIdArg
    if (franchiseIdOrOpts && typeof franchiseIdOrOpts === 'object') {
      franchiseId = franchiseIdOrOpts.franchiseId
      cityId = franchiseIdOrOpts.cityId
    }
    const fid = franchiseId?.trim()
    const cid = cityId?.trim()
    const cacheKey = fid || (cid ? `city:${cid}` : '')
    if (!cacheKey) return null
    const cached = (fid && catalogByFranchiseRef.current[fid])
      || catalogByFranchiseRef.current[cacheKey]
    if (cached?.length) {
      return { services: cached }
    }
    setCatalogLoadingFranchise(cacheKey)
    try {
      const list = await api.getServiceCatalog({ franchiseId: fid, cityId: cid })
      const services = Array.isArray(list) ? list : []
      const resolvedFr = services[0]?.franchiseId
      setCatalogByFranchise((prev) => {
        const next = { ...prev, [cacheKey]: services }
        if (fid) next[fid] = services
        if (resolvedFr) next[resolvedFr] = services
        if (cid) next[`city:${cid}`] = services
        return next
      })
      return services.length ? { services } : null
    } catch {
      return null
    } finally {
      setCatalogFetchedKeys((prev) => new Set(prev).add(cacheKey))
      setCatalogLoadingFranchise((cur) => (cur === cacheKey ? null : cur))
    }
  }, [geoStore])

  const isCatalogLoading = useCallback((franchiseId, cityId) => {
    const key = catalogCacheKey(franchiseId, cityId)
    return Boolean(key && catalogLoadingFranchise === key)
  }, [catalogCacheKey, catalogLoadingFranchise])

  const isCatalogFetched = useCallback((franchiseId, cityId) => {
    const key = catalogCacheKey(franchiseId, cityId)
    return Boolean(key && catalogFetchedKeys.has(key))
  }, [catalogCacheKey, catalogFetchedKeys])

  useEffect(() => {
    if (isDemoMode()) return undefined
    if (!profile.franchiseId && !profile.cityId) return undefined
    ensureCatalog({ franchiseId: profile.franchiseId, cityId: profile.cityId })
    return undefined
  }, [profile.franchiseId, profile.cityId, ensureCatalog])

  const notify = useCallback((message, type = 'success') => setToast({ message, type }), [])

  const applyTestSession = useCallback((me) => {
    setAuthUser(me)
    setProfile((p) => ({
      ...p,
      name: me.name || p.name,
      phone: me.phone || p.phone,
      email: me.email || p.email,
      city: me.clientProfile?.city || p.city,
    }))
  }, [])

  const syncAuth = useCallback(async () => {
    if (isTestModeActive()) {
      const me = getTestMe()
      if (me?.role === 'CLIENT') {
        applyTestSession(me)
        return
      }
      if (!getToken()) {
        setAuthUser(null)
        return
      }
    }
    if (!getToken()) {
      setAuthUser(null)
      return
    }
    if (getToken().startsWith('gp_test_')) {
      const me = getTestMe()
      if (me) {
        applyTestSession(me)
        return
      }
    }
    try {
      const me = await api.me()
      const roles = me.roles || []
      const canUseService =
        me.clientProfile &&
        (me.role === 'CLIENT' || roles.includes('CLIENT') || roles.includes('SPECIALIST'))
      if (!canUseService) {
        clearToken()
        setAuthUser(null)
        return
      }
      applyTestSession(me)
    } catch (err) {
      if (isBackendUnavailableError(err) && getTestMe()) {
        applyTestSession(getTestMe())
        return
      }
      clearToken()
      setAuthUser(null)
    }
  }, [applyTestSession])

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
        const list = await api.getMarketProducts({ regionCode: regionCodeForProfile(profile) })
        setProducts(list)
        setProductsError(null)
      }
    } catch (e) {
      setProductsError(e?.message || 'Не удалось загрузить товары')
    } finally {
      setProductsLoading(false)
    }
  }, [profile.cityId, profile.franchiseId])

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
      const [serviceOrders, marketOrders] = await Promise.all([
        api.getOrders(),
        api.getMarketOrders().catch(() => []),
      ])
      setOrders([...serviceOrders, ...marketOrders])
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
    if (isTestModeActive() && getToken().startsWith('gp_test_')) {
      const { user } = loginTestClient(email, password)
      applyTestSession(user)
      notify('Вход (тестовый режим)')
      return true
    }
    try {
      await api.login(email, password)
      const me = await api.me()
      if (!me.clientProfile) {
        clearToken()
        throw new Error('Клиент профилі жоқ. Телефон OTP арқылы кіріңіз немесе client@gp.kz')
      }
      applyTestSession(me)
      notify('Вход выполнен')
      return true
    } catch (err) {
      if (!isTestModeFallbackEnabled() || !isBackendUnavailableError(err)) throw err
      activateTestMode()
      const { user } = loginTestClient(email, password)
      applyTestSession(user)
      notify('API недоступен — тестовый режим (LocalStorage)', 'info')
      return true
    }
  }, [notify, refreshOrders, applyTestSession])

  const register = useCallback(async (data) => {
    const creds = buildTestClientCredentials(data)
    const accountType = data.accountType || 'INDIVIDUAL'
    const isLegal = accountType === 'LEGAL_ENTITY'
    const displayName = data.name?.trim() || data.companyName?.trim() || creds.name
    const payload = {
      email: creds.email,
      password: creds.password,
      name: displayName,
      phone: creds.phone,
      accountType,
      companyName: isLegal ? (data.companyName?.trim() || displayName) : undefined,
      bin: data.bin,
      legalAddress: data.legalAddress,
      contactPerson: isLegal ? (data.contactPerson?.trim() || displayName) : undefined,
    }
    try {
      await api.registerClient(payload)
      await syncAuth()
      notify('Регистрация успешна')
      return true
    } catch (err) {
      if (!isTestModeFallbackEnabled() || !isBackendUnavailableError(err)) throw err
      activateTestMode()
      const { user } = registerTestClient({ ...data, ...payload })
      applyTestSession(user)
      notify('БД недоступна — аккаунт сохранён локально (тестовый режим)', 'info')
      return true
    }
  }, [syncAuth, notify, applyTestSession])

  const sendOtp = useCallback(async (phone, channel = 'sms') => {
    if (!phone?.trim()) throw new Error('Телефон нөмірін енгізіңіз')
    return api.sendOtp(phone.trim(), channel)
  }, [])

  const verifyOtp = useCallback(async (payload) => {
    const session = await api.verifyOtp(payload)
    const me = await api.me()
    if (me.clientProfile) {
      applyTestSession(me)
    }
    return { session, me }
  }, [applyTestSession])

  const checkLegalCompany = useCallback((payload) => api.checkLegalCompany(payload), [])

  const loginTrustedDevice = useCallback(async () => {
    const session = await api.refreshSession()
    const me = await api.me()
    if (me.clientProfile) {
      applyTestSession(me)
      notify('Вход выполнен с доверенного устройства')
    }
    return { session, me }
  }, [applyTestSession, notify])

  const submitPartnerApplication = useCallback(async () => {
    notify('Маман өтінімін GP Partner қолданбасында толтырыңыз (specialist onboarding).', 'info')
    throw new Error('Use GP Partner app: /apply/specialist')
  }, [notify])

  const logout = useCallback(async () => {
    if (isDemoMode()) {
      demoApi.demoLogout()
      setAuthUser(null)
      setOrders([])
      notify('Вы вышли', 'info')
      return
    }
    if (isTestModeActive() || getToken()?.startsWith('gp_test_')) {
      logoutTestMode()
      setAuthUser(null)
      setOrders([])
      notify('Вы вышли', 'info')
      return
    }
    await api.logout()
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
    if (authUser && !authUser.clientProfile) {
      throw new Error('Клиент профилі жоқ. Кіріңіз немесе client@gp.kz пайдаланыңыз')
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

    const storeIds = [...new Set(cartItems.map((i) => i.product.storeId).filter(Boolean))]
    if (storeIds.length !== 1) {
      throw new Error(storeIds.length ? 'Оформите товары разных магазинов отдельными заказами' : 'У товара не указан магазин')
    }
    const order = await api.createMarketOrder({
      storeId: storeIds[0],
      items: cartItems.map((i) => ({
        productId: i.product.id,
        qty: i.qty,
      })),
      deliveryType: mode === 'pickup' ? 'PICKUP' : 'DELIVERY',
      address: mode === 'pickup' ? undefined : data.address,
    })
    setOrders((prev) => {
      return [order, ...prev.filter((o) => o.id !== order.id)]
    })
    await refreshOrders()
    clearCart()
    setCheckoutDraft(null)
    notify('Заказ оформлен! Оплата — партнёру напрямую.')
    return order
  }, [cartItems, cartTotal, clearCart, notify, refreshOrders, requireAuth, profile])

  const catalogStoreFor = useCallback((franchiseId, cityId) => {
    return resolveCatalogStore(franchiseId, cityId)
  }, [resolveCatalogStore])

  const catalogStore = useMemo(
    () => catalogStoreFor(profile.franchiseId, profile.cityId),
    [catalogStoreFor, profile.franchiseId, profile.cityId],
  )

  const getCityCatalog = useCallback((items, lang = 'ru', franchiseId, cityId) => {
    const store = resolveCatalogStore(franchiseId, cityId)
    const fid = franchiseId || profile.franchiseId || store?.services?.[0]?.franchiseId
    if (!isDemoMode()) {
      if (!store?.services?.length || !fid) return []
      return filterCatalogForCity(items, store, fid, lang)
    }
    if (!store?.services?.length || !fid) return items
    return filterCatalogForCity(items, store, fid, lang)
  }, [resolveCatalogStore, profile.franchiseId, profile.cityId])

  const getSepticOptions = useCallback((lang = 'ru', franchiseId, cityId) => {
    const store = resolveCatalogStore(franchiseId, cityId)
    const fid = franchiseId || profile.franchiseId || store?.services?.[0]?.franchiseId
    if (!store?.services?.length || !fid) return isDemoMode() ? null : []
    return getSepticVolumeOptionsForCity(store, fid, lang)
  }, [resolveCatalogStore, profile.franchiseId, profile.cityId])

  const getApiSepticService = useCallback((lang = 'ru', franchiseId, cityId) => {
    const store = resolveCatalogStore(franchiseId, cityId)
    const fid = franchiseId || profile.franchiseId || store?.services?.[0]?.franchiseId
    if (!store?.services?.length || !fid) return null
    return buildSepticServiceFromStore(store, fid, lang)
  }, [resolveCatalogStore, profile.franchiseId, profile.cityId])

  const isServiceAvailable = useCallback((serviceId, franchiseId, cityId) => {
    const store = resolveCatalogStore(franchiseId, cityId)
    const fid = franchiseId || profile.franchiseId || store?.services?.[0]?.franchiseId
    if (isDemoMode()) {
      if (!store?.services?.length || !fid) return true
      return isServiceActiveInCity(store, fid, serviceId)
    }
    if (!store?.services?.length || !fid) return false
    return isServiceActiveInCity(store, fid, serviceId)
  }, [resolveCatalogStore, profile.franchiseId, profile.cityId])

  const calcOrderTotal = useCallback((params, lang = 'ru', franchiseId, cityId) => {
    const store = resolveCatalogStore(franchiseId, cityId)
    const fid = franchiseId || profile.franchiseId || store?.services?.[0]?.franchiseId
    return calcServiceTotalWithCity({
      store,
      franchiseId: fid,
      lang,
      ...params,
    })
  }, [resolveCatalogStore, profile.franchiseId, profile.cityId])

  const placeServiceOrder = useCallback(async (data) => {
    requireAuth()
    const geo = {
      city: data.city || profile.city,
      cityId: data.cityId || profile.cityId,
      oblastId: data.oblastId || profile.oblastId,
      franchiseId: data.franchiseId || profile.franchiseId,
    }
    const orderData = { ...data, ...geo }
    if (isDemoMode()) {
      demoApi.updateDemoSession({ city: geo.city, franchiseId: geo.franchiseId })
      setProfile((p) => ({ ...p, ...geo }))
      await demoApi.demoPlaceServiceOrder(orderData)
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
    const store = catalogStoreFor(data.franchiseId, data.cityId)
    const orderFranchiseId = data.franchiseId || profile.franchiseId || store?.services?.[0]?.franchiseId
    const totalFromApi = calcServiceTotalWithCity({
      store,
      franchiseId: orderFranchiseId,
      serviceId: data.serviceId,
      septicVolume: isSeptic ? Number(data.septicVolume) : undefined,
      lawnAreaSqm: data.lawnAreaSqm ? Number(data.lawnAreaSqm) : undefined,
      lang: 'ru',
    })
    const total = totalFromApi ?? Number(data.total) ?? 0
    if (isSeptic && total <= 0) {
      throw new Error('Септик бағасы табылмады — қала каталогын тексеріңіз')
    }

    const commentParts = [data.comment]
    if (data.subserviceCode) commentParts.push(`Подуслуга: ${data.subserviceCode}`)

    const payload = {
      category: apiCategory,
      serviceName: data.serviceName,
      serviceId: data.serviceId,
      address: data.address || obj?.address || geo.city || 'Уральск',
      clientLat: Number(data.lat ?? data.clientLat) || 51.233,
      clientLng: Number(data.lng ?? data.clientLng) || 51.367,
      total,
      paymentMethod: PAYMENT_TO_API[data.paymentMethod] || 'CASH_ON_DELIVERY',
      comment: commentParts.filter(Boolean).join('\n'),
      onBehalfCity: geo.city,
      septicVolume: isSeptic ? Number(data.septicVolume) : undefined,
      preferredDate: data.preferredDate || undefined,
      preferredTime: data.flexibleTime ? undefined : data.preferredTime,
      flexibleTime: !!data.flexibleTime,
      lawnAreaSqm: data.lawnAreaSqm ? Number(data.lawnAreaSqm) : undefined,
    }
    const order = await api.createOrder(payload)
    setOrders((prev) => {
      const mapped = { ...order, kind: order.category === 'shop' ? 'shop' : 'service' }
      return [mapped, ...prev.filter((o) => o.id !== order.id)]
    })
    await refreshOrders()
    notify('Заявка отправлена! Партнёр увидит её в GP Partner.')
    return order
  }, [objects, notify, refreshOrders, requireAuth, profile, catalogStoreFor])

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
    sendOtp, verifyOtp, checkLegalCompany, loginTrustedDevice, submitPartnerApplication,
    isDemoMode: isDemoMode(),
    isTestMode: isTestModeActive(),
    geoStore: isDemoMode() && geoStore?.cities?.length ? geoStore : STATIC_GEO_STORE,
    catalogStore,
    ensureCatalog,
    catalogLoadingFranchise,
    isCatalogLoading,
    isCatalogFetched,
    getCityCatalog,
    getSepticOptions,
    getApiSepticService,
    isServiceAvailable,
    calcOrderTotal,
    demoFranchises: isDemoMode() ? demoApi.demoFranchises() : [],
    cancelOrder: async (orderId, cancelReason) => {
      requireAuth()
      if (isDemoMode()) {
        const o = orders.find((x) => x.id === orderId)
        if (o?.kind === 'market') await marketDemo.demoCancelMarketOrder(orderId)
        else await demoApi.demoCancelOrder(orderId)
        await refreshOrders()
        notify('Заявка отменена', 'info')
        return
      }
      const reason = (cancelReason || '').trim()
      if (reason.length < 3) throw new Error('Укажите причину отмены')
      const order = await api.cancelOrder(orderId, reason)
      await refreshOrders()
      notify('Заявка отменена', 'info')
      return order
    },
    recreateOrder: async (orderId) => {
      requireAuth()
      const order = await api.recreateOrder(orderId)
      await refreshOrders()
      notify('Создана новая заявка на основе предыдущей')
      return order
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
