/** Фильтры доступа по franchiseId / роли */

export function scopeByFranchise(list, franchiseId) {
  if (!franchiseId || !Array.isArray(list)) return list
  return list.filter((item) => item.franchiseId === franchiseId)
}

export function ordersForClient(orders, clientId) {
  return orders.filter((o) => o.clientId === clientId)
}

/** Партнёр видит только заявки своего города, назначенные ему */
export function ordersForPartner(orders, partnerId, franchiseId) {
  return orders.filter((o) => {
    const assigned = o.assignedPartnerId ?? o.partnerId
    return o.franchiseId === franchiseId && assigned === partnerId
  })
}

export function ordersForAdmin(orders, role, franchiseId) {
  if (role === 'SUPER_ADMIN' && !franchiseId) return orders
  if (franchiseId) return scopeByFranchise(orders, franchiseId)
  return orders
}

export function mapOrderToService(o) {
  return {
    id: o.id,
    category: o.serviceId?.includes('septic') ? 'septic' : o.serviceId?.includes('lawn') ? 'lawn' : 'irrigation',
    serviceName: o.subserviceName ? `${o.serviceName} · ${o.subserviceName}` : o.serviceName,
    address: o.address,
    city: o.city,
    total: o.amount,
    status:
      o.status === 'assigned' ? 'accepted'
      : o.status === 'in_progress' ? 'on_way'
      : o.status === 'in_work' ? 'in_work'
      : o.status === 'completed' ? 'done'
      : o.status,
    createdAt: new Date(o.createdAt).toISOString(),
    partnerName: o.partnerName,
    franchiseId: o.franchiseId,
    clientId: o.clientId,
    note: o.note,
    canEdit: o.status === 'new',
    canCancel: o.status === 'new' || o.status === 'assigned',
    rawStatus: o.status,
  }
}

export function mapOrderToPartner(o, partnerId) {
  const aid = o.assignedPartnerId ?? o.partnerId
  const assigned = aid === partnerId
  return {
    id: o.id,
    category: o.serviceId?.includes('septic') ? 'septic' : 'lawn',
    serviceName: o.subserviceName ? `${o.serviceName} · ${o.subserviceName}` : o.serviceName,
    address: o.address,
    city: o.city,
    total: o.amount,
    status:
      o.status === 'assigned' ? 'accepted'
      : o.status === 'in_progress' ? 'en_route'
      : o.status === 'in_work' ? 'in_work'
      : o.status === 'completed' ? 'completed'
      : o.status,
    createdAt: new Date(o.createdAt).toISOString(),
    clientName: o.clientName,
    clientPhone: o.clientPhone,
    assignedPartnerId: aid,
    partnerId: aid,
    franchiseId: o.franchiseId,
    note: o.note,
    partnerComment: o.partnerComment || '',
    photosBefore: o.photosBefore || [],
    photosAfter: o.photosAfter || [],
    assigned,
  }
}
