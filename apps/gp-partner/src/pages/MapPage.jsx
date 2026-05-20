import { useEffect } from 'react'
import { Navigation } from 'lucide-react'
import { usePartner } from '../context/PartnerContext'
import { getOrderStatusLabel, getMapStatusText } from '@gp/shared/constants'
import OrderMap from '../components/OrderMap'

export default function MapPage() {
  const { activeOrder, activeOrders, setActiveOrderId, updateExecutorLocation, user } = usePartner()
  const order = activeOrder || activeOrders[0]

  useEffect(() => {
    if (order && !activeOrder) setActiveOrderId(order.id)
  }, [order, activeOrder, setActiveOrderId])

  const moveDemo = async () => {
    const lat = (user?.lat || 51.243) + (Math.random() - 0.5) * 0.008
    const lng = (user?.lng || 51.377) + (Math.random() - 0.5) * 0.008
    await updateExecutorLocation(lat, lng)
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Нет активных заявок для карты</p>
      </div>
    )
  }

  const statusText = getMapStatusText(order.status) || getOrderStatusLabel(order.status)

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">Карта</h1>
      <p className="text-sm text-slate-400 mb-3">{order.serviceName} · {getOrderStatusLabel(order.status)}</p>
      <OrderMap
        clientLat={order.clientLat}
        clientLng={order.clientLng}
        executorLat={order.executorLat ?? user?.lat}
        executorLng={order.executorLng ?? user?.lng}
        statusLabel={statusText}
        className="h-[55vh] mb-4"
      />
      <button type="button" onClick={moveDemo} className="w-full py-3 rounded-2xl partner-gradient font-semibold flex items-center justify-center gap-2">
        <Navigation className="w-5 h-5" /> Обновить мою позицию
      </button>
    </div>
  )
}
