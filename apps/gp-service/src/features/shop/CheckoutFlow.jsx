import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, CreditCard, MapPin, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@gp/shared/utils'
import {
  PAYMENT_TO_PARTNER,
  SHOP_DELIVERY_MODES,
  computeShopDeliveryFee,
  getShopDeliverySummary,
} from '@gp/shared/constants'
import PaymentMethodPicker from '../../components/PaymentMethodPicker'
import AddressPickerMap from '../../components/AddressPickerMap'
import { useService } from '../../context/ServiceContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const STEPS = [
  { n: 1, title: 'Товары', icon: ShoppingBag },
  { n: 2, title: 'Адрес', icon: MapPin },
  { n: 3, title: 'Оплата', icon: CreditCard },
]

export default function CheckoutFlow() {
  const navigate = useNavigate()
  const { cartItems, cartTotal, placeShopOrder, setCheckoutDraft, checkoutDraft } = useService()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(checkoutDraft?.form || {
    name: '', phone: '', address: '', lat: 51.233, lng: 51.367,
    comment: '', paymentMethod: 'kaspi_partner',
    deliveryMode: 'courier',
  })
  const [processing, setProcessing] = useState(false)

  const deliveryFee = useMemo(
    () => computeShopDeliveryFee(cartTotal, form.deliveryMode),
    [cartTotal, form.deliveryMode],
  )
  const deliverySummary = useMemo(
    () => getShopDeliverySummary(cartTotal, form.deliveryMode),
    [cartTotal, form.deliveryMode],
  )
  const orderGrandTotal = cartTotal + deliveryFee

  if (!cartItems.length) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Корзина пуста</p>
        <Button onClick={() => navigate('/shop')}>В магазин</Button>
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const next = () => {
    if (step === 1) {
      setCheckoutDraft({ form, step: 2 })
      setStep(2)
    } else if (step === 2) {
      if (!form.name || !form.phone || !form.address) return
      setCheckoutDraft({ form, step: 3 })
      setStep(3)
    }
  }

  const pay = async () => {
    setProcessing(true)
    try {
      const order = await placeShopOrder(form)
      if (order) navigate(`/orders?success=${order.id}`)
    } catch (err) {
      if (String(err?.message || '').includes('Войдите')) navigate('/login')
    } finally {
      setProcessing(false)
    }
  }

  const payLabel = PAYMENT_TO_PARTNER.find((m) => m.id === form.paymentMethod)?.shortLabel || 'заказ'

  return (
    <div className="px-4 py-4">
      <button type="button" onClick={() => (step > 1 ? setStep(step - 1) : navigate('/shop/cart'))} className="flex items-center gap-1 text-sm text-gp-blue-600 mb-4">
        <ChevronLeft className="w-4 h-4" /> Назад
      </button>

      <div className="flex gap-2 mb-6">
        {STEPS.map(({ n, title, icon: Icon }) => (
          <div key={n} className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold ${step >= n ? 'gp-gradient text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-4 h-4 mx-auto mb-0.5" />
            {title}
            {step > n && <Check className="w-3 h-3 mx-auto mt-0.5" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-xl font-bold mb-4">Шаг 1 — Товары</h1>
          <ul className="space-y-3 mb-4">
            {cartItems.map(({ product, qty }) => (
              <li key={product.id} className="gp-card p-3 flex justify-between text-sm">
                <span className="line-clamp-1 flex-1">{product.name} ×{qty}</span>
                <span className="font-semibold shrink-0 ml-2">{formatPrice(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <p className="text-2xl font-bold text-gp-green-700 mb-6">{formatPrice(cartTotal)}</p>
          <Button size="lg" className="w-full" onClick={next}>Далее — адрес</Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-xl font-bold mb-4">Шаг 2 — Адрес и доставка</h1>
          <div className="space-y-3 mb-4">
            <Input label="Имя" value={form.name} onChange={set('name')} />
            <Input label="Телефон" type="tel" value={form.phone} onChange={set('phone')} placeholder="+7 7XX XXX XX XX" />
            <Input label="Адрес" value={form.address} onChange={set('address')} placeholder="Уральск, ул. Мухит 112" />
            <Input label="Комментарий" value={form.comment} onChange={set('comment')} />
          </div>

          <fieldset className="mb-4 border-0 p-0">
            <legend className="text-sm font-semibold text-slate-800 mb-2">Способ получения</legend>
            <div className="space-y-2">
              {Object.values(SHOP_DELIVERY_MODES).map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    form.deliveryMode === m.id ? 'border-gp-green-600 bg-gp-green-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={form.deliveryMode === m.id}
                    onChange={() => setForm({ ...form, deliveryMode: m.id })}
                    className="mt-1 accent-gp-green-600"
                  />
                  <div>
                    <p className="font-medium text-sm text-slate-800">{m.label}</p>
                    <p className="text-xs text-slate-500">
                      {m.id === 'pickup'
                        ? 'Без доставки, заберёте у продавца.'
                        : getShopDeliverySummary(cartTotal, 'courier').hint}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {form.deliveryMode === 'courier' && (
            <>
              <p className="text-sm font-medium text-slate-800 mb-2">Точка на карте</p>
              <AddressPickerMap
                lat={form.lat}
                lng={form.lng}
                onLocationChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
              />
            </>
          )}

          <div className="gp-card p-3 mb-6 text-sm text-slate-600 mt-4">
            <p>
              {form.deliveryMode === 'pickup' ? (
                <>Сумма заказа: <strong>{formatPrice(cartTotal)}</strong></>
              ) : (
                <>
                  Товары: {formatPrice(cartTotal)}
                  {deliveryFee > 0 && <> · Доставка: {formatPrice(deliveryFee)}</>}
                  {deliveryFee === 0 && deliverySummary.freeByOrderSum && (
                    <> · Доставка: <span className="text-gp-green-700 font-semibold">0 ₸</span></>
                  )}
                  <br />
                  <span className="font-bold text-gp-green-700">К оплате: {formatPrice(orderGrandTotal)}</span>
                </>
              )}
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={next}>Далее — оплата</Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-xl font-bold mb-4">Шаг 3 — Оплата</h1>
          <ul className="text-sm text-slate-600 space-y-1 mb-2">
            <li className="flex justify-between"><span>Товары</span><span>{formatPrice(cartTotal)}</span></li>
            <li className="flex justify-between">
              <span>{form.deliveryMode === 'pickup' ? 'Доставка' : 'Доставка (курьер)'}</span>
              <span>
                {form.deliveryMode === 'pickup' ? '—' : deliveryFee === 0 ? '0 ₸' : formatPrice(deliveryFee)}
              </span>
            </li>
          </ul>
          <p className="text-3xl font-bold text-gp-green-700 mb-6">{formatPrice(orderGrandTotal)}</p>
          <PaymentMethodPicker value={form.paymentMethod} onChange={(paymentMethod) => setForm({ ...form, paymentMethod })} />
          <div className="gp-card p-4 my-4 text-sm text-slate-600">
            Оплата <strong>напрямую продавцу</strong> ({cartItems[0]?.product?.partnerName || 'партнёр'}).
            GP не принимает деньги на свой счёт.
          </div>
          <Button
            size="lg"
            variant={form.paymentMethod === 'kaspi_partner' ? 'kaspi' : 'primary'}
            className="w-full"
            disabled={processing}
            onClick={pay}
          >
            {processing ? 'Обработка…' : `Подтвердить · ${payLabel}`}
          </Button>
        </div>
      )}
    </div>
  )
}
