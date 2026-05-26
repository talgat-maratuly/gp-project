import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Store } from 'lucide-react'
import { MARKET_CATEGORIES, PRODUCT_UNITS } from '@gp/shared/constants'
import { api } from '@gp/shared/api'
import { formatPrice } from '@gp/shared/utils'
import { useLanguage } from '../i18n'
import { usePartner } from '../context/PartnerContext'
import * as marketDemo from '../lib/marketDemoApi'

const PATH_TAB = {
  '/shop/products': 'products',
  '/shop/stock': 'stock',
  '/shop/orders': 'orders',
  '/shop/settings': 'settings',
}

export default function MyShopPage() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const { isDemoMode, notify, refreshMarket, user, refreshStores } = usePartner()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(() => PATH_TAB[pathname] || 'products')

  useEffect(() => {
    const next = PATH_TAB[pathname] || 'products'
    setTab(next)
  }, [pathname])
  const [showCreateShop, setShowCreateShop] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [shopForm, setShopForm] = useState({ shopName: '', ownerName: '', phone: '', address: '' })
  const [productForm, setProductForm] = useState({
    name: '', categoryId: 'annuals', price: '', quantity: '10', unit: 'шт', description: '',
  })
  const [apiShopName, setApiShopName] = useState('')
  const [apiSaving, setApiSaving] = useState(false)

  useEffect(() => {
    if (!isDemoMode) refreshStores?.()
  }, [isDemoMode, refreshStores])

  const load = async () => {
    if (!isDemoMode) return
    setLoading(true)
    try {
      const [s, p, o] = await Promise.all([
        marketDemo.demoGetShop(),
        marketDemo.demoGetProducts(),
        marketDemo.demoGetMarketOrders(),
      ])
      setShop(s)
      setProducts(p)
      setOrders(o)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [isDemoMode])

  const createShop = async (e) => {
    e.preventDefault()
    try {
      await marketDemo.demoCreateShop(shopForm)
      setShowCreateShop(false)
      notify(t('market_shop_created'))
      await load()
      refreshMarket?.()
    } catch (err) {
      notify(err.message || t('error'), 'error')
    }
  }

  const addProduct = async (e) => {
    e.preventDefault()
    try {
      await marketDemo.demoAddProduct({
        ...productForm,
        price: Number(productForm.price),
        quantity: Number(productForm.quantity),
      })
      setShowAddProduct(false)
      setProductForm({ name: '', categoryId: 'annuals', price: '', quantity: '10', unit: 'шт', description: '' })
      notify(t('market_product_added'))
      await load()
    } catch (err) {
      notify(err.message === 'shop_required' ? t('market_create_shop_first') : err.message, 'error')
    }
  }

  const toggleProduct = async (id, active) => {
    await marketDemo.demoUpdateProduct(id, { status: active ? 'ACTIVE' : 'INACTIVE' })
    await load()
  }

  const advanceOrder = async (id) => {
    await marketDemo.demoAdvanceMarketOrder(id)
    notify(t('market_order_updated'))
    await load()
  }

  const registerApiStore = async () => {
    if (!apiShopName.trim()) return
    setApiSaving(true)
    try {
      await api.createPartnerStore({ name: apiShopName.trim() })
      setApiShopName('')
      await refreshStores?.()
      notify(t('market_shop_created'))
    } catch (err) {
      notify(err?.message || t('error'), 'error')
    } finally {
      setApiSaving(false)
    }
  }

  if (!isDemoMode) {
    const storeState = user?.storeUiState
    return (
      <div className="partner-card p-6 text-center partner-muted space-y-3">
        {storeState === 'NOT_REGISTERED' && (
          <>
            <p>{t('market_no_shop')}</p>
            <input
              className="gp-input-kaspi w-full text-left"
              placeholder={t('market_shop_name')}
              value={apiShopName}
              onChange={(e) => setApiShopName(e.target.value)}
            />
            <button
              type="button"
              disabled={apiSaving}
              className="w-full py-3 rounded-xl partner-gradient font-bold text-white disabled:opacity-50"
              onClick={registerApiStore}
            >
              {apiSaving ? '…' : t('store_register')}
            </button>
          </>
        )}
        {storeState === 'UNDER_REVIEW' && <p>{t('store_under_review')}</p>}
        {storeState === 'REJECTED' && <p>{t('store_rejected')}</p>}
        {storeState === 'APPROVED' && (
          <Link to="/catalog/add" className="text-emerald-600 font-semibold inline-block">{t('nav_add_product')}</Link>
        )}
        {!storeState && <p>{t('market_api_only')}</p>}
      </div>
    )
  }

  if (loading && !shop) {
    return <p className="partner-muted">{t('loading')}</p>
  }

  if (!shop) {
    return (
      <div className="partner-card p-6 text-center">
        <Store className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
        <h1 className="text-xl font-bold mb-2">{t('market_my_shop')}</h1>
        <p className="partner-muted text-sm mb-4">{t('market_no_shop')}</p>
        {!showCreateShop ? (
          <button type="button" onClick={() => setShowCreateShop(true)} className="w-full py-3 rounded-xl partner-gradient font-bold text-white">
            {t('market_create_shop')}
          </button>
        ) : (
          <form onSubmit={createShop} className="text-left gp-form-stack mt-4">
            <div className="gp-form-field">
              <label className="gp-form-label">{t('market_shop_name')}</label>
              <input className="gp-input-kaspi" placeholder={t('market_shop_name')} value={shopForm.shopName} onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })} required />
            </div>
            <div className="gp-form-field">
              <label className="gp-form-label">{t('market_owner')}</label>
              <input className="gp-input-kaspi" placeholder={t('market_owner')} value={shopForm.ownerName} onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })} required />
            </div>
            <div className="gp-form-field">
              <label className="gp-form-label">{t('phone')}</label>
              <input className="gp-input-kaspi" type="tel" placeholder="+7 701 000 00 00" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
            </div>
            <div className="gp-form-field">
              <label className="gp-form-label">{t('address')}</label>
              <input className="gp-input-kaspi" placeholder={t('address')} value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} required />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl partner-gradient font-bold text-white">{t('save')}</button>
          </form>
        )}
        <Link to="/cabinet" className="block mt-4 text-sm text-emerald-600 font-semibold">{t('market_open_cabinet')}</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{shop.shopName}</h1>
          <p className="text-sm partner-muted">{shop.city} · {shop.address}</p>
        </div>
        <Link to="/cabinet" className="text-xs font-bold text-emerald-600">{t('market_cabinet')}</Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['products', 'orders'].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${tab === id ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700' : 'border-[var(--gp-border)] partner-muted'}`}
          >
            {id === 'products' ? t('market_products') : t('market_orders')}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <>
          <button type="button" onClick={() => setShowAddProduct(true)} className="w-full mb-3 py-2.5 rounded-xl border border-dashed border-emerald-500 text-emerald-700 font-semibold flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> {t('market_add_product')}
          </button>
          {showAddProduct && (
            <form onSubmit={addProduct} className="partner-card p-4 mb-4 gp-form-stack">
              <div className="gp-form-field">
                <label className="gp-form-label">{t('market_product_name')}</label>
                <input className="gp-input-kaspi" placeholder={t('market_product_name')} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>
              <div className="gp-form-field">
                <label className="gp-form-label">Категория</label>
                <select className="gp-input-kaspi" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                  {MARKET_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="gp-form-field flex-1 min-w-0">
                  <label className="gp-form-label">{t('price')}</label>
                  <input className="gp-input-kaspi" type="number" inputMode="decimal" placeholder="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
                <div className="gp-form-field w-full sm:w-28">
                  <label className="gp-form-label">{t('market_stock')}</label>
                  <input className="gp-input-kaspi" type="number" inputMode="numeric" placeholder="0" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })} />
                </div>
              </div>
              <div className="gp-form-field">
                <label className="gp-form-label">Единица</label>
                <select className="gp-input-kaspi" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}>
                  {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl partner-gradient font-bold text-white">{t('save')}</button>
            </form>
          )}
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="partner-card p-3 flex justify-between items-center gap-2">
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-emerald-600 font-bold">{formatPrice(p.price)}</p>
                  <p className="text-xs partner-muted">{t('market_stock')}: {p.stock ?? p.quantity}</p>
                </div>
                <button type="button" onClick={() => toggleProduct(p.id, p.status !== 'ACTIVE' && p.inStock)} className="text-xs px-2 py-1 rounded-lg border border-[var(--gp-border)]">
                  {p.inStock !== false && p.status !== 'INACTIVE' ? t('market_hide') : t('market_show')}
                </button>
              </li>
            ))}
            {!products.length && <p className="partner-muted text-sm">{t('market_no_products')}</p>}
          </ul>
        </>
      )}

      {tab === 'orders' && (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="partner-card p-3">
              <p className="font-bold">#{o.orderNumber}</p>
              <p className="text-sm partner-muted">{o.clientName} · {formatPrice(o.finalAmount)}</p>
              <p className="text-xs mt-1">{t('status')}: {t(`market_status_${o.status}`)}</p>
              {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                <button type="button" onClick={() => advanceOrder(o.id)} className="mt-2 w-full py-2 rounded-xl partner-gradient text-white text-sm font-semibold">
                  {t('market_next_status')}
                </button>
              )}
            </li>
          ))}
          {!orders.length && <p className="partner-muted text-sm">{t('market_no_orders')}</p>}
        </ul>
      )}
    </div>
  )
}
