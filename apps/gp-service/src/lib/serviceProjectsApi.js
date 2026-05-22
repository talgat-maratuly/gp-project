import { api } from '@gp/shared/api'
import {
  createHunterProject,
  createFurnitureProject,
  listServiceProjects,
  getServiceProjectBundle,
  updateServiceProjectStatus,
  syncFromHub,
  loadGlobalStore,
  productsForClient,
  mapMarketProductToCatalog,
} from '@gp/shared/demo'
import { SERVICE_PROJECT_TYPES } from '@gp/shared/constants'
import { getDemoSession } from './demoApi'
import { isDemoMode } from '@gp/shared/demo'

export async function demoCreateHunter(input) {
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  createHunterProject(session, input)
  await syncFromHub()
  const list = listServiceProjects({ clientId: session.clientId, type: SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION })
  return list[list.length - 1]
}

export async function apiCreateHunter(input) {
  const project = await api.createHunterProject({
    photo: input.photo,
    length: Number(input.length),
    width: Number(input.width),
    waterSource: input.waterSource,
    pressure: Number(input.pressure),
    waterFlow: Number(input.waterFlow),
    submit: input.submit !== false,
  })
  return { serviceProject: project }
}

export async function demoCreateFurniture(input) {
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  createFurnitureProject(session, input)
  await syncFromHub()
  const list = listServiceProjects({ clientId: session.clientId, type: SERVICE_PROJECT_TYPES.FURNITURE })
  return list[list.length - 1]
}

export async function apiCreateFurniture(input) {
  const project = await api.createFurnitureProject({
    photo: input.photo,
    roomWidth: Number(input.roomWidth),
    roomHeight: Number(input.roomHeight),
    furnitureLength: Number(input.furnitureLength),
    furnitureDepth: Number(input.furnitureDepth),
    material: input.material,
    facadeMaterial: input.facadeMaterial,
    color: input.color,
    submit: input.submit !== false,
  })
  return { serviceProject: project }
}

export async function demoListProjects(type) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  return listServiceProjects({ clientId: session.clientId, type })
}

export async function apiListProjects(type) {
  return api.getServiceProjects({ type })
}

export async function demoGetProject(id) {
  await syncFromHub()
  return getServiceProjectBundle(id)
}

export async function apiGetProject(id) {
  const project = await api.getServiceProject(id)
  return {
    serviceProject: project,
    hunter: project.hunter || null,
    furniture: project.furniture || null,
  }
}

export async function demoLinkedProducts(type) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  const store = loadGlobalStore()
  return productsForClient(store.marketProducts || [], session.franchiseId, {})
    .filter((p) => p.linkedServiceType === type)
    .map(mapMarketProductToCatalog)
}

export async function apiLinkedProducts(type) {
  const list = await api.getMarketProducts({ linkedServiceType: type })
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    unit: p.unit || 'шт',
    category: p.categoryId,
    linkedServiceType: p.linkedServiceType,
  }))
}

export { updateServiceProjectStatus as demoUpdateProjectStatus }

export async function apiUpdateProjectStatus(id, status, partnerId) {
  return api.patchServiceProjectStatus(id, status)
}
