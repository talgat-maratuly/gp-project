import { loadGlobalStore, saveGlobalStore, uid } from '@gp/shared/demo'

const TAB_STATUS = {
  PENDING_REVIEW: ['PENDING_REVIEW', 'pending'],
  NEEDS_REVISION: ['NEEDS_REVISION'],
  APPROVED: ['APPROVED', 'approved'],
  REJECTED: ['REJECTED', 'rejected'],
  SUSPENDED: ['SUSPENDED', 'suspended'],
}

function partnerModerationStatus(p) {
  if (p.blocked) return 'SUSPENDED'
  if (p.moderationStatus) return p.moderationStatus
  if (p.active === false) return 'PENDING_REVIEW'
  return 'APPROVED'
}

function toApiPartner(p) {
  return {
    id: p.id,
    companyName: p.company,
    company: p.company,
    fullName: p.name,
    city: p.city,
    partnerRole: p.partnerRole || 'SPECIALIST',
    partnerType: p.partnerType || 'septic',
    status: partnerModerationStatus(p),
    user: { name: p.name, phone: p.phone, email: p.email || '' },
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now(),
    rejectionReason: p.rejectionReason || null,
    revisionComment: p.revisionComment || null,
    description: p.description || '',
    serviceOfferings: p.serviceOfferings || [],
  }
}

function toApiShop(s) {
  return {
    id: s.id,
    companyName: s.shopName,
    company: s.shopName,
    fullName: s.ownerName,
    city: s.city,
    partnerRole: 'SHOP',
    partnerType: 'shop',
    status: s.moderationStatus || (s.status === 'PENDING' ? 'PENDING_REVIEW' : s.status === 'BLOCKED' ? 'SUSPENDED' : s.status === 'REJECTED' ? 'REJECTED' : 'APPROVED'),
    user: { name: s.ownerName, phone: s.phone, email: '' },
    createdAt: s.createdAt || Date.now(),
    updatedAt: s.updatedAt || Date.now(),
    rejectionReason: s.rejectionReason || null,
    description: s.address || '',
  }
}

function matchesScope(row, scope) {
  if (!scope) return row.partnerType !== 'shop' && row.partnerRole !== 'SHOP'
  if (scope === 'shop') return row.partnerType === 'shop' || row.partnerRole === 'SHOP'
  if (scope === 'specialist') return row.partnerType !== 'shop' && row.partnerRole !== 'SHOP'
  return true
}

export function demoModerationList(tab, opts = {}) {
  const store = loadGlobalStore()
  const statuses = TAB_STATUS[tab] || [tab]
  const partners = (store.partners || []).map(toApiPartner).filter((p) => statuses.includes(p.status) && matchesScope(p, opts.scope))
  const shops = (store.shops || []).map(toApiShop).filter((s) => statuses.includes(s.status) && (opts.scope === 'shop' || !opts.scope))
  const rows = opts.scope === 'shop' ? shops : partners
  if (opts.city) return rows.filter((r) => r.city === opts.city)
  if (opts.franchiseId) {
    const fid = opts.franchiseId
    return rows.filter((r) => {
      const p = store.partners.find((x) => x.id === r.id)
      const sh = store.shops.find((x) => x.id === r.id)
      return (p && p.franchiseId === fid) || (sh && sh.franchiseId === fid)
    })
  }
  return rows
}

export function demoModerationPartner(id) {
  const store = loadGlobalStore()
  const p = store.partners.find((x) => x.id === id)
  if (p) return toApiPartner(p)
  const s = store.shops.find((x) => x.id === id)
  if (s) return toApiShop(s)
  throw new Error('Not found')
}

function appendAudit(entity, action, reason) {
  const audit = entity.moderationAudit || []
  return [
    ...audit,
    { id: uid('aud'), action, reason: reason || null, createdAt: Date.now(), admin: { name: 'Admin (demo)' } },
  ]
}

export function demoApprovePartner(id) {
  const store = loadGlobalStore()
  const pIdx = store.partners.findIndex((x) => x.id === id)
  if (pIdx >= 0) {
    const p = store.partners[pIdx]
    const next = {
      ...p,
      active: true,
      blocked: false,
      moderationStatus: 'APPROVED',
      updatedAt: Date.now(),
      moderationAudit: appendAudit(p, 'APPROVED'),
    }
    const partners = [...store.partners]
    partners[pIdx] = next
    saveGlobalStore({ ...store, partners })
    return toApiPartner(next)
  }
  const sIdx = (store.shops || []).findIndex((x) => x.id === id)
  if (sIdx >= 0) {
    const s = store.shops[sIdx]
    const next = { ...s, status: 'ACTIVE', moderationStatus: 'APPROVED', updatedAt: Date.now() }
    const shops = [...store.shops]
    shops[sIdx] = next
    saveGlobalStore({ ...store, shops })
    return toApiShop(next)
  }
  throw new Error('Not found')
}

export function demoRejectPartner(id, reason) {
  if (!reason || reason.trim().length < 3) throw new Error('rejectReasonRequired')
  const store = loadGlobalStore()
  const pIdx = store.partners.findIndex((x) => x.id === id)
  if (pIdx >= 0) {
    const p = store.partners[pIdx]
    const next = {
      ...p,
      active: false,
      moderationStatus: 'REJECTED',
      rejectionReason: reason.trim(),
      updatedAt: Date.now(),
      moderationAudit: appendAudit(p, 'REJECTED', reason.trim()),
    }
    const partners = [...store.partners]
    partners[pIdx] = next
    saveGlobalStore({ ...store, partners })
    return toApiPartner(next)
  }
  const sIdx = (store.shops || []).findIndex((x) => x.id === id)
  if (sIdx >= 0) {
    const s = store.shops[sIdx]
    const next = {
      ...s,
      status: 'REJECTED',
      moderationStatus: 'REJECTED',
      rejectionReason: reason.trim(),
      updatedAt: Date.now(),
    }
    const shops = [...store.shops]
    shops[sIdx] = next
    saveGlobalStore({ ...store, shops })
    return toApiShop(next)
  }
  throw new Error('Not found')
}
