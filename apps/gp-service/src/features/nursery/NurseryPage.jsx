import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@gp/shared/api'
import { PageHeader } from '@gp/shared/ui/KaspiUI'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useService } from '../../context/ServiceContext'
import { useLanguage } from '../../i18n'

const emptyRequest = {
  plantName: '',
  plantType: 'trees',
  quantity: 500,
  heightCm: 200,
  ageMonths: '',
  desiredDeliveryAt: '',
  deliveryNeeded: true,
  comment: '',
}

const emptyPreorder = {
  plantName: '',
  quantity: 10000,
  deliveryDate: '',
  sizeRequirement: '',
  varietyRequirement: '',
  deliveryNeeded: true,
  contractNeeded: true,
  comment: '',
}

export default function NurseryPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { profile, isLoggedIn } = useService()
  const [products, setProducts] = useState([])
  const [requests, setRequests] = useState([])
  const [preorders, setPreorders] = useState([])
  const [request, setRequest] = useState(emptyRequest)
  const [preorder, setPreorder] = useState(emptyPreorder)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const cityId = profile.cityId || 'city-uralsk'
  const city = profile.city || 'Уральск'

  const refresh = async () => {
    const [productRows, requestRows, preorderRows] = await Promise.all([
      api.getNurseryProducts({ cityId }),
      isLoggedIn ? api.getMyNurseryRequests().catch(() => []) : Promise.resolve([]),
      isLoggedIn ? api.getMyGrowingPreorders().catch(() => []) : Promise.resolve([]),
    ])
    setProducts(Array.isArray(productRows) ? productRows : [])
    setRequests(Array.isArray(requestRows) ? requestRows : [])
    setPreorders(Array.isArray(preorderRows) ? preorderRows : [])
  }

  useEffect(() => {
    refresh().catch(() => setProducts([]))
  }, [cityId, isLoggedIn])

  const requireLogin = () => {
    if (isLoggedIn) return true
    navigate('/login', { state: { from: '/nursery' } })
    return false
  }

  const createRequest = async (e) => {
    e.preventDefault()
    if (!requireLogin()) return
    setLoading(true)
    setMessage('')
    try {
      await api.createNurseryRequest({ ...request, cityId, city })
      setRequest(emptyRequest)
      setMessage(t('nursery_create_request'))
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const createPreorder = async (e) => {
    e.preventDefault()
    if (!requireLogin()) return
    setLoading(true)
    setMessage('')
    try {
      await api.createGrowingPreorder({ ...preorder, cityId, city })
      setPreorder(emptyPreorder)
      setMessage(t('nursery_preorder_title'))
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const acceptOffer = async (id, kind) => {
    setLoading(true)
    try {
      if (kind === 'preorder') await api.acceptGrowingPreorderOffer(id)
      else await api.acceptNurseryOffer(id)
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <PageHeader title={t('nursery_title')} subtitle={city} onBack={() => navigate(-1)} />

      {message && <div className="gp-card p-3 text-sm text-gp-green-700">{message}</div>}

      <section className="gp-card p-4">
        <h2 className="font-bold mb-3">{t('nursery_find_plants')}</h2>
        <div className="space-y-3">
          {products.length === 0 && <p className="text-sm text-slate-500">{t('nursery_empty')}</p>}
          {products.slice(0, 8).map((p) => (
            <div key={p.id} className="border rounded-xl p-3">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-slate-500">{p.category} · {p.quantity} шт. · {p.heightCm || '—'} см</p>
              {p.price && <p className="text-sm font-bold mt-1">{Number(p.price).toLocaleString()} ₸</p>}
              <p className="text-xs text-slate-400">{p.nursery?.name}</p>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={createRequest} className="gp-card p-4 space-y-3">
        <h2 className="font-bold">{t('nursery_request_title')}</h2>
        <Input label={t('nursery_plant_name')} value={request.plantName} onChange={(e) => setRequest({ ...request, plantName: e.target.value })} required />
        <Input label={t('nursery_plant_type')} value={request.plantType} onChange={(e) => setRequest({ ...request, plantType: e.target.value })} />
        <Input label={t('nursery_quantity')} type="number" value={request.quantity} onChange={(e) => setRequest({ ...request, quantity: e.target.value })} required />
        <Input label={t('nursery_height')} type="number" value={request.heightCm} onChange={(e) => setRequest({ ...request, heightCm: e.target.value })} />
        <Input label={t('nursery_desired_date')} type="date" value={request.desiredDeliveryAt} onChange={(e) => setRequest({ ...request, desiredDeliveryAt: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={request.deliveryNeeded} onChange={(e) => setRequest({ ...request, deliveryNeeded: e.target.checked })} />
          {t('nursery_delivery_needed')}
        </label>
        <textarea className="w-full p-3 rounded-xl border text-sm" rows={3} placeholder={t('nursery_comment')} value={request.comment} onChange={(e) => setRequest({ ...request, comment: e.target.value })} />
        <Button type="submit" disabled={loading}>{t('nursery_create_request')}</Button>
      </form>

      <form onSubmit={createPreorder} className="gp-card p-4 space-y-3">
        <h2 className="font-bold">{t('nursery_preorder_title')}</h2>
        <Input label={t('nursery_plant_name')} value={preorder.plantName} onChange={(e) => setPreorder({ ...preorder, plantName: e.target.value })} required />
        <Input label={t('nursery_quantity')} type="number" value={preorder.quantity} onChange={(e) => setPreorder({ ...preorder, quantity: e.target.value })} required />
        <Input label={t('nursery_desired_date')} type="date" value={preorder.deliveryDate} onChange={(e) => setPreorder({ ...preorder, deliveryDate: e.target.value })} />
        <Input label={`${t('nursery_height')} / ${t('nursery_plant_type')}`} value={preorder.sizeRequirement} onChange={(e) => setPreorder({ ...preorder, sizeRequirement: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preorder.contractNeeded} onChange={(e) => setPreorder({ ...preorder, contractNeeded: e.target.checked })} />
          {t('growing_contracts')}
        </label>
        <textarea className="w-full p-3 rounded-xl border text-sm" rows={3} placeholder={t('nursery_comment')} value={preorder.comment} onChange={(e) => setPreorder({ ...preorder, comment: e.target.value })} />
        <Button type="submit" disabled={loading}>{t('nursery_preorder_title')}</Button>
      </form>

      {requests.length > 0 && (
        <section className="gp-card p-4 space-y-3">
          <h2 className="font-bold">{t('nursery_requests')}</h2>
          {requests.map((r) => (
            <div key={r.id} className="border rounded-xl p-3">
              <p className="font-semibold">{r.plantName} · {r.quantity} шт.</p>
              <p className="text-xs text-slate-500">{r.status}</p>
              {(r.offers || []).map((o) => (
                <button key={o.id} type="button" disabled={loading || o.status === 'ACCEPTED'} onClick={() => acceptOffer(o.id)} className="w-full mt-2 p-2 rounded-lg bg-emerald-50 text-left text-sm">
                  {o.nursery?.name}: {Number(o.pricePerUnit).toLocaleString()} ₸ · {o.availableQty} шт. · {o.status}
                </button>
              ))}
            </div>
          ))}
        </section>
      )}

      {preorders.length > 0 && (
        <section className="gp-card p-4 space-y-3">
          <h2 className="font-bold">{t('growing_preorders')}</h2>
          {preorders.map((r) => (
            <div key={r.id} className="border rounded-xl p-3">
              <p className="font-semibold">{r.plantName} · {r.quantity} шт.</p>
              <p className="text-xs text-slate-500">{r.status}</p>
              {(r.offers || []).map((o) => (
                <button key={o.id} type="button" disabled={loading || o.status === 'ACCEPTED'} onClick={() => acceptOffer(o.id, 'preorder')} className="w-full mt-2 p-2 rounded-lg bg-emerald-50 text-left text-sm">
                  {Number(o.pricePerUnit).toLocaleString()} ₸ · {o.readyDate?.slice(0, 10) || '—'} · {o.status}
                </button>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
