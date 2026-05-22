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

export async function demoCreateHunter(input) {
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  createHunterProject(session, input)
  await syncFromHub()
  const list = listServiceProjects({ clientId: session.clientId, type: SERVICE_PROJECT_TYPES.HUNTER_IRRIGATION })
  return list[list.length - 1]
}

export async function demoCreateFurniture(input) {
  const session = getDemoSession()
  if (!session) throw new Error('auth_required')
  createFurnitureProject(session, input)
  await syncFromHub()
  const list = listServiceProjects({ clientId: session.clientId, type: SERVICE_PROJECT_TYPES.FURNITURE })
  return list[list.length - 1]
}

export async function demoListProjects(type) {
  await syncFromHub()
  const session = getDemoSession()
  if (!session) return []
  return listServiceProjects({ clientId: session.clientId, type })
}

export async function demoGetProject(id) {
  await syncFromHub()
  return getServiceProjectBundle(id)
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

export { updateServiceProjectStatus as demoUpdateProjectStatus }
