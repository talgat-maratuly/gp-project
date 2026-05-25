import { usePartner } from '../context/PartnerContext'

export default function ServiceSchedulePage() {
  const { activeOrders } = usePartner()
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">График работ</h1>
      <p className="text-sm text-[var(--gp-text-muted)]">Запланированные и активные заявки по вашему направлению.</p>
      <ul className="space-y-2">
        {activeOrders.map((o) => (
          <li key={o.id} className="rounded-xl border border-[var(--gp-border)] p-3 text-sm">
            <p className="font-bold">{o.serviceName || o.id}</p>
            <p className="text-[var(--gp-text-muted)]">{o.address}</p>
          </li>
        ))}
        {!activeOrders.length && <p className="text-[var(--gp-text-muted)]">Нет активных заявок</p>}
      </ul>
    </div>
  )
}
