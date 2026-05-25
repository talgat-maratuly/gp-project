#!/usr/bin/env node
/**
 * GP Ecosystem Health Checker — stabilization gate (pre-deploy).
 * Usage: node scripts/ecosystem-check.mjs [--flows]
 */
import { spawnSync } from 'child_process'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { API_METHODS_REQUIRED, BACKEND_ROUTE_CHECKS } from '@gp/shared-core/api-contracts'
import { assertApiClientMethods, assertExportsResolvable } from '@gp/shared-core/validation'
import { SERVICES } from '@gp/shared-core/ecosystem-types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))

function run(cmd, cmdArgs) {
  return spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }).status === 0
}

function checkSharedCore() {
  console.log('\n── @gp/shared-core ──')
  let failed = 0
  const pkg = join(ROOT, 'packages/shared-core/package.json')
  for (const err of assertExportsResolvable(pkg, ['roles', 'statuses', 'permissions', 'api-contracts'])) {
    console.error(`✗ ${err}`)
    failed++
  }
  if (!failed) console.log('✓ shared-core exports')

  const clientPath = join(ROOT, 'packages/shared/src/api/client.js')
  const missing = assertApiClientMethods(readFileSync(clientPath, 'utf8'))
  if (missing.length) {
    missing.forEach((m) => console.error(`✗ api.${m}`))
    failed += missing.length
  } else {
    console.log(`✓ API contract (${API_METHODS_REQUIRED.length} methods)`)
  }

  const sharedPkg = join(ROOT, 'packages/shared/package.json')
  for (const err of assertExportsResolvable(sharedPkg, ['constants/ecosystemStatuses', 'constants/partnerRole'])) {
    console.error(`✗ @gp/shared ${err}`)
    failed++
  }
  if (failed === 0) console.log('✓ @gp/shared re-exports')

  return failed === 0
}

function collectRoutes() {
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
          routes.add(`${m[1].toUpperCase()} /${ctrl}/${m[2] || ''}`.replace(/\/+/g, '/'))
        }
      }
    }
  }
  walk(join(ROOT, 'apps/api/src'))
  return routes
}

function checkBackendRoutes() {
  console.log('\n── Backend routes ──')
  const routes = collectRoutes()
  let warn = 0
  for (const { method, http, fragment } of BACKEND_ROUTE_CHECKS) {
    const ok = [...routes].some((r) => r.startsWith(http) && r.toLowerCase().includes(fragment.toLowerCase()))
    if (!ok) {
      console.warn(`⚠ missing route for api.${method}`)
      warn++
    }
  }
  if (warn === 0) console.log('✓ critical backend routes')
  return warn === 0
}

console.log('╔════════════════════════════════════════╗')
console.log('║  GP Ecosystem Health Check             ║')
console.log('╚════════════════════════════════════════╝')

let ok = checkSharedCore() && checkBackendRoutes()

console.log('\n── Validation pipeline ──')
if (!run('node', ['scripts/check-env.mjs'])) ok = false
if (!run('node', ['scripts/check-api-contract.mjs'])) ok = false
if (!run('npx', ['prisma', 'validate', '--schema', 'apps/api/prisma/schema.prisma'])) ok = false
if (!run('npm', ['run', 'prisma:generate'])) ok = false
if (!run('npm', ['run', 'typecheck', '-w', '@gp/api'])) ok = false
if (!run('npm', ['run', 'build:api'])) ok = false
if (!run('npm', ['run', 'build:service'])) ok = false
if (!run('npm', ['run', 'build:partner'])) ok = false
if (!run('npm', ['run', 'build:admin'])) ok = false

if (args.has('--flows')) {
  console.log('\n── Flow simulation (API on :4000) ──')
  if (!run('curl', ['-sf', 'http://localhost:4000/health'])) {
    console.warn('⚠ API not running — skip flows')
  } else {
    const reg = spawnSync(
      'curl',
      ['-sf', '-X', 'POST', 'http://localhost:4000/api/auth/register/client', '-H', 'Content-Type: application/json', '-d', '{}'],
      { encoding: 'utf8' },
    )
    if (reg.status === 0 && reg.stdout?.includes('accessToken')) console.log('✓ client register')
    else { console.error('✗ client register'); ok = false }
    const preg = spawnSync(
      'curl',
      ['-sf', '-X', 'POST', 'http://localhost:4000/api/auth/register/partner', '-H', 'Content-Type: application/json', '-d', '{"partnerRole":"SPECIALIST"}'],
      { encoding: 'utf8' },
    )
    if (preg.status === 0 && preg.stdout?.includes('accessToken')) console.log('✓ partner register')
    else { console.error('✗ partner register'); ok = false }
  }
}

if (ok) {
  console.log('\n✓ ECOSYSTEM HEALTH OK')
  console.log('Services:', Object.values(SERVICES).map((s) => s.id).join(', '))
  process.exit(0)
}
console.log('\n✗ ECOSYSTEM HEALTH FAILED')
process.exit(1)
