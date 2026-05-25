#!/usr/bin/env node
/**
 * Shared API client ↔ backend route compatibility (static analysis).
 */
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { API_CONTRACT, BACKEND_ROUTE_CHECKS } from '@gp/shared-core/api-contracts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT_PATH = join(ROOT, 'packages/shared/src/api/client.js')
const API_SRC = join(ROOT, 'apps/api/src')

function collectApiMethods() {
  const text = readFileSync(CLIENT_PATH, 'utf8')
  const methods = new Set()
  for (const m of text.matchAll(/^\s{2}(\w+):/gm)) methods.add(m[1])
  return methods
}

function collectBackendRouteHints() {
  const routes = new Set()
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (ent.name.endsWith('.controller.ts')) {
        const t = readFileSync(p, 'utf8')
        const ctrl = t.match(/@Controller\(['"`]([^'"`]*)['"`]\)/)?.[1] ?? ''
        for (const m of t.matchAll(/@(Get|Post|Patch|Put|Delete)\(['"`]?([^'"`)]*)['"`]?\)/g)) {
          const method = m[1].toUpperCase()
          const sub = m[2] || ''
          let path = `/${ctrl}/${sub}`.replace(/\/+/g, '/').replace(/\/$/, '')
          routes.add(`${method} ${path}`)
        }
      }
    }
  }
  walk(API_SRC)
  return routes
}

let failed = 0
console.log('=== GP API contract ===\n')

const methods = collectApiMethods()
const required = Object.values(API_CONTRACT).flat()

for (const name of required) {
  if (!methods.has(name)) {
    console.error(`✗ @gp/shared/api missing method: ${name}`)
    failed++
  } else {
    console.log(`✓ api.${name}`)
  }
}

const backendRoutes = collectBackendRouteHints()
for (const { method, http, fragment } of BACKEND_ROUTE_CHECKS) {
  const found = [...backendRoutes].some(
    (r) => r.startsWith(http) && r.toLowerCase().includes(fragment.toLowerCase()),
  )
  if (!found) {
    console.warn(`⚠ backend route hint not found for api.${method} (${http} …${fragment})`)
  } else {
    console.log(`✓ backend route for ${method}`)
  }
}

console.log(`\nBackend: ${backendRoutes.size} route decorators scanned`)
console.log(failed ? `\n✗ API contract failed (${failed})` : '\n✓ API contract OK')
process.exit(failed ? 1 : 0)
