import { uid, loadGlobalStore, saveGlobalStore } from './store.js'
import { calculateHunterProject } from '../utils/hunterCalculator.js'
import { calculateFurnitureProject } from '../utils/furnitureCalculator.js'
import { SERVICE_PROJECT_TYPES } from '../constants/serviceProjects.js'
import { FURNITURE_PROJECT_SERVICE_TYPE } from '../constants/furnitureExecutor.js'
import { createFurnitureExecutorOrder } from './furnitureExecutorMutations.js'

function linkedProducts(type) {
  const store = loadGlobalStore()
  return (store.marketProducts || []).filter(
    (p) => p.linkedServiceType === type && p.status === 'ACTIVE',
  )
}

export function createHunterProject(session, input) {
  const store = loadGlobalStore()
  const calc = calculateHunterProject(input, linkedProducts(SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION))
  const spId = uid('sp')
  const hpId = uid('hp')
  const now = Date.now()

  const serviceProject = {
    id: spId,
    type: SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION,
    franchiseId: session.franchiseId,
    city: session.city,
    clientId: session.clientId,
    clientName: session.name,
    partnerId: null,
    status: input.submit ? 'submitted' : 'draft',
    totalPrice: calc.estimate.total,
    gpCommission: calc.estimate.gpCommission,
    createdAt: now,
    updatedAt: now,
  }

  const hunterProject = {
    id: hpId,
    serviceProjectId: spId,
    photo: input.photo || null,
    length: input.length,
    width: input.width,
    area: calc.area,
    waterSource: input.waterSource,
    pressure: input.pressure,
    waterFlow: input.waterFlow,
    zones: calc.zones,
    sprinklers: calc.sprinklers,
    pipes: calc.pipes,
    valves: calc.valves,
    controller: calc.controller,
    estimate: calc.estimate,
    drawing2D: calc.drawing2D,
  }

  return saveGlobalStore({
    ...store,
    serviceProjects: [...(store.serviceProjects || []), serviceProject],
    hunterProjects: [...(store.hunterProjects || []), hunterProject],
  })
}

export function createFurnitureProject(session, input) {
  const store = loadGlobalStore()
  const calc = calculateFurnitureProject(input)
  const spId = uid('sp')
  const fpId = uid('fp')
  const now = Date.now()

  const serviceProject = {
    id: spId,
    type: SERVICE_PROJECT_TYPES.FURNITURE,
    franchiseId: session.franchiseId,
    city: session.city,
    clientId: session.clientId,
    clientName: session.name,
    partnerId: null,
    status: input.submit ? 'submitted' : 'draft',
    totalPrice: calc.estimate.total,
    gpCommission: calc.estimate.gpCommission,
    createdAt: now,
    updatedAt: now,
  }

  const furnitureProject = {
    id: fpId,
    serviceProjectId: spId,
    photo: input.photo || null,
    roomWidth: input.roomWidth,
    roomHeight: input.roomHeight,
    furnitureLength: input.furnitureLength,
    furnitureDepth: input.furnitureDepth,
    material: input.material,
    facadeMaterial: input.facadeMaterial,
    color: input.color,
    modules: calc.modules,
    parts: calc.parts,
    hardware: calc.hardware,
    estimate: calc.estimate,
    drawing2D: calc.drawing2D,
  }

  const next = saveGlobalStore({
    ...store,
    serviceProjects: [...(store.serviceProjects || []), serviceProject],
    furnitureProjects: [...(store.furnitureProjects || []), furnitureProject],
  })

  if (input.submit) {
    createFurnitureExecutorOrder({
      serviceType: FURNITURE_PROJECT_SERVICE_TYPE,
      serviceProjectId: spId,
      clientName: session.name,
      phone: session.phone || '',
      address: session.city || 'Уральск',
      city: session.city,
      comment: `Проект мебели · ${input.material} / ${input.color}`,
      totalPrice: calc.estimate.total,
      gpCommission: calc.estimate.gpCommission,
      franchiseId: session.franchiseId,
    })
  }

  return next
}

export function updateServiceProjectStatus(id, status, partnerId = null) {
  const store = loadGlobalStore()
  return saveGlobalStore({
    ...store,
    serviceProjects: (store.serviceProjects || []).map((p) =>
      p.id === id
        ? { ...p, status, partnerId: partnerId ?? p.partnerId, updatedAt: Date.now() }
        : p,
    ),
  })
}

export function getServiceProjectBundle(projectId) {
  const store = loadGlobalStore()
  const sp = (store.serviceProjects || []).find((p) => p.id === projectId)
  if (!sp) return null
  if (sp.type === SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION) {
    const detail = (store.hunterProjects || []).find((h) => h.serviceProjectId === projectId)
    return { serviceProject: sp, hunter: detail, furniture: null }
  }
  const detail = (store.furnitureProjects || []).find((f) => f.serviceProjectId === projectId)
  return { serviceProject: sp, hunter: null, furniture: detail }
}

export function listServiceProjects(filters = {}) {
  const store = loadGlobalStore()
  let list = store.serviceProjects || []
  if (filters.type) list = list.filter((p) => p.type === filters.type)
  if (filters.clientId) list = list.filter((p) => p.clientId === filters.clientId)
  if (filters.franchiseId) list = list.filter((p) => p.franchiseId === filters.franchiseId)
  if (filters.partnerId) list = list.filter((p) => p.partnerId === filters.partnerId)
  return list.map((sp) => ({ ...sp, ...getServiceProjectBundle(sp.id) }))
}
