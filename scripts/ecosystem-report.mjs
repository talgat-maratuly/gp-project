#!/usr/bin/env node
/**
 * GP Ecosystem Stability Report — scoring + dependency chains.
 * Usage: npm run ecosystem:report [--quick] [--json]
 */
import { spawnSync } from 'child_process'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createConnection } from 'net'
import {
  API_METHODS_REQUIRED,
  API_CONTRACT,
  BACKEND_ROUTE_CHECKS,
} from '@gp/shared-core/api-contracts'
import {
  assertApiClientMethods,
  assertExportsResolvable,
} from '@gp/shared-core/validation'
import {
  probeApiReachable,
  runAuthFlow,
  runPartnerFlow,
  runModerationFlow,
  runOrderFlow,
} from './lib/ecosystem-flows.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const QUICK = args.has('--quick')
const JSON_OUT = args.has('--json')

const APPS = {
  service: { id: 'gp-service', workspace: '@gp/service', dist: 'apps/gp-service/dist/index.html' },
  partner: { id: 'gp-partner', workspace: '@gp/partner', dist: 'apps/gp-partner/dist/index.html' },
  admin: { id: 'gp-admin', workspace: '@gp/admin', dist: 'apps/gp-admin/dist/index.html' },
  api: { id: 'gp-api', workspace: '@gp/api', dist: 'apps/api/dist/main.js' },
}

/** @typedef {'pass'|'warn'|'fail'|'skip'} CheckStatus */
/** @typedef {{ id: string, name: string, status: CheckStatus, score: number, detail?: string, apps?: string[], rootCause?: string, chain?: string }} Check */

const checks = []
const chains = []

function addCheck(c) {
  checks.push(c)
  if ((c.status === 'fail' || c.status === 'warn') && c.chain) {
    chains.push({
      chain: c.chain,
      affectedApps: c.apps || [],
      rootCause: c.rootCause || c.detail,
      severity: c.status,
    })
  }
}

function statusFrom(ok, warn = false) {
  if (ok) return 'pass'
  if (warn) return 'warn'
  return 'fail'
}

function scoreFrom(status) {
  if (status === 'pass') return 100
  if (status === 'warn') return 50
  if (status === 'skip') return 75
  return 0
}

function runSilent(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  })
  return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '', status: r.status }
}

function runBuild(workspace, appKey) {
  const label = APPS[appKey].id
  const r = runSilent('npm', ['run', 'build', '-w', workspace], { stdio: ['ignore', 'pipe', 'pipe'] })
  const tail = (r.stderr || r.stdout || '').split('\n').filter(Boolean).slice(-3).join(' ')
  return {
    ok: r.ok,
    detail: r.ok ? 'build succeeded' : tail || `exit ${r.status}`,
  }
}

function checkPostgres() {
  const url = process.env.DATABASE_URL
  if (!url) {
    const envFile = join(ROOT, '.env')
    if (existsSync(envFile)) {
      const m = readFileSync(envFile, 'utf8').match(/DATABASE_URL=(.+)/)
      if (m) process.env.DATABASE_URL = m[1].replace(/^["']|["']$/g, '')
    }
  }
  const dbUrl = process.env.DATABASE_URL || ''
  const hostMatch = dbUrl.match(/@([^:/]+):(\d+)/)
  const host = hostMatch?.[1] || 'localhost'
  const port = Number(hostMatch?.[2] || 5432)

  return new Promise((resolve) => {
    const sock = createConnection({ host, port }, () => {
      sock.end()
      resolve({ ok: true, detail: `${host}:${port} reachable` })
    })
    sock.on('error', (e) => resolve({ ok: false, detail: e.message }))
    sock.setTimeout(3000, () => {
      sock.destroy()
      resolve({ ok: false, detail: 'connection timeout' })
    })
  })
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

function checkSharedCoreSync() {
  const issues = []
  const pkgPath = join(ROOT, 'packages/shared-core/package.json')
  for (const err of assertExportsResolvable(pkgPath, [
    'roles',
    'statuses',
    'permissions',
    'api-contracts',
  ])) {
    issues.push(err)
  }
  const sharedPkg = join(ROOT, 'packages/shared/package.json')
  for (const err of assertExportsResolvable(sharedPkg, [
    'constants/ecosystemStatuses',
    'constants/partnerRole',
  ])) {
    issues.push(`@gp/shared: ${err}`)
  }
  const frontApps = [
    ['service', 'apps/gp-service/package.json'],
    ['partner', 'apps/gp-partner/package.json'],
    ['admin', 'apps/gp-admin/package.json'],
  ]
  for (const [, rel] of frontApps) {
    const pj = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'))
    if (!pj.dependencies?.['@gp/shared-core']) {
      issues.push(`${rel} missing @gp/shared-core dependency`)
    }
    if (!pj.dependencies?.['@gp/shared']) {
      issues.push(`${rel} missing @gp/shared dependency`)
    }
  }
  const lock = existsSync(join(ROOT, 'package-lock.json'))
    ? readFileSync(join(ROOT, 'package-lock.json'), 'utf8')
    : ''
  if (!lock.includes('packages/shared-core')) {
    issues.push('package-lock.json missing packages/shared-core workspace')
  }
  const dockerFrontend = readFileSync(join(ROOT, 'deploy/Dockerfile.frontend'), 'utf8')
  if (!dockerFrontend.includes('shared-core')) {
    issues.push('deploy/Dockerfile.frontend does not COPY packages/shared-core')
  }
  return issues
}

function checkApiCompatibility() {
  const clientPath = join(ROOT, 'packages/shared/src/api/client.js')
  const clientSource = readFileSync(clientPath, 'utf8')
  const missing = assertApiClientMethods(clientSource)
  const routes = collectRoutes()
  const missingRoutes = []
  for (const { method, http, fragment } of BACKEND_ROUTE_CHECKS) {
    const ok = [...routes].some(
      (r) => r.startsWith(http) && r.toLowerCase().includes(fragment.toLowerCase()),
    )
    if (!ok) missingRoutes.push(method)
  }
  return { missing, missingRoutes, methodCount: API_METHODS_REQUIRED.length }
}

function groupScore(list) {
  if (!list?.length) return 0
  const total = list.reduce((s, c) => s + c.score, 0)
  return Math.round(total / list.length)
}

function aggregateScores(groups) {
  const healthScore = groupScore(groups.health)
  const deploymentScore = groupScore(groups.deployment)
  const apiSyncScore = groupScore(groups.apiSync)
  const sharedCoreIntegrityScore = groupScore(groups.sharedCore)
  const buildScore = groupScore(groups.builds)
  const runtimeScore = groupScore(groups.runtime)

  const ecosystemStabilityScore = Math.round(
    healthScore * 0.2 +
      deploymentScore * 0.15 +
      apiSyncScore * 0.25 +
      sharedCoreIntegrityScore * 0.2 +
      buildScore * 0.15 +
      runtimeScore * 0.05,
  )
  return {
    ecosystemStabilityScore,
    healthScore,
    deploymentScore,
    apiSyncScore,
    sharedCoreIntegrityScore,
    buildScore,
    runtimeScore,
  }
}

function overallStatus(scores, checks) {
  const fails = checks.filter((c) => c.status === 'fail').length
  const warns = checks.filter((c) => c.status === 'warn').length
  if (fails > 0 || scores.ecosystemStabilityScore < 60) return 'RED'
  if (warns > 0 || scores.ecosystemStabilityScore < 85) return 'YELLOW'
  return 'GREEN'
}

function statusColor(s) {
  if (s === 'GREEN') return '\x1b[32m'
  if (s === 'YELLOW') return '\x1b[33m'
  return '\x1b[31m'
}

function icon(st) {
  if (st === 'pass') return '✓'
  if (st === 'warn') return '⚠'
  if (st === 'skip') return '○'
  return '✗'
}

async function main() {
  const groups = { builds: [], health: [], deployment: [], apiSync: [], sharedCore: [], runtime: [] }

  // ── 1–2 Builds ──
  if (QUICK) {
    for (const key of ['service', 'partner', 'admin']) {
      const dist = join(ROOT, APPS[key].dist)
      const ok = existsSync(dist)
      const st = statusFrom(ok, !ok)
      addCheck({
        id: `build-${key}`,
        name: `${APPS[key].id} build (cached dist)`,
        status: st,
        score: scoreFrom(st),
        detail: ok ? 'dist present (--quick)' : 'dist missing — run full report',
        apps: [APPS[key].id],
        rootCause: ok ? undefined : 'frontend build artifact missing',
        chain: ok ? undefined : 'build → deploy → nginx',
      })
      groups.builds.push(checks.at(-1))
    }
    const apiDist = existsSync(join(ROOT, APPS.api.dist))
    const st = statusFrom(apiDist, !apiDist)
    addCheck({
      id: 'build-api',
      name: 'gp-api build (cached dist)',
      status: st,
      score: scoreFrom(st),
      detail: apiDist ? 'dist present (--quick)' : 'apps/api/dist missing',
      apps: ['gp-api'],
      chain: apiDist ? undefined : 'api build → docker → all frontends',
    })
    groups.builds.push(checks.at(-1))
  } else {
    for (const key of ['service', 'partner', 'admin']) {
      const r = runBuild(APPS[key].workspace, key)
      const st = statusFrom(r.ok)
      addCheck({
        id: `build-${key}`,
        name: `${APPS[key].id} build`,
        status: st,
        score: scoreFrom(st),
        detail: r.detail,
        apps: [APPS[key].id, 'deploy'],
        rootCause: r.ok ? undefined : r.detail,
        chain: r.ok ? undefined : 'vite build → docker frontend → GP_APP',
      })
      groups.builds.push(checks.at(-1))
    }
    const apiBuild = runSilent('npm', ['run', 'build:api'])
    const st = statusFrom(apiBuild.ok)
    addCheck({
      id: 'build-api',
      name: 'gp-api build',
      status: st,
      score: scoreFrom(st),
      detail: apiBuild.ok ? 'nest build succeeded' : (apiBuild.stderr || '').slice(-200),
      apps: ['gp-api', 'gp-service', 'gp-partner', 'gp-admin'],
      rootCause: apiBuild.ok ? undefined : 'backend build failed',
      chain: apiBuild.ok ? undefined : 'api → prisma → all clients',
    })
    groups.builds.push(checks.at(-1))
  }

  // ── 3 Docker ──
  const dockerVer = runSilent('docker', ['version', '--format', '{{.Server.Version}}'])
  const dockerOk = dockerVer.ok
  const dockerfiles = [
    'deploy/Dockerfile.api',
    'deploy/Dockerfile.frontend',
    'deploy/docker-compose.yml',
    'deploy/nginx/spa.conf',
  ]
  const missingDf = dockerfiles.filter((f) => !existsSync(join(ROOT, f)))
  let dockerSt = 'pass'
  let dockerDetail = dockerOk ? `Docker ${dockerVer.stdout.trim()}` : 'Docker CLI not installed'
  if (missingDf.length) {
    dockerSt = 'fail'
    dockerDetail = `missing: ${missingDf.join(', ')}`
  } else if (!dockerOk) {
    dockerSt = 'warn'
  }
  addCheck({
    id: 'docker',
    name: 'Docker status',
    status: dockerSt,
    score: scoreFrom(dockerSt),
    detail: dockerDetail,
    apps: ['deploy', 'gp-api', 'gp-service', 'gp-partner', 'gp-admin'],
    rootCause: !dockerOk ? 'Docker not available in PATH' : missingDf.length ? 'deploy files missing' : undefined,
    chain:
      !dockerOk || missingDf.length
        ? 'docker → CI build-and-push → production images'
        : undefined,
  })
  groups.deployment.push(checks.at(-1))

  // ── 4 Postgres ──
  const pg = await checkPostgres()
  const pgSt = statusFrom(pg.ok)
  addCheck({
    id: 'postgres',
    name: 'PostgreSQL status',
    status: pgSt,
    score: scoreFrom(pgSt),
    detail: pg.detail,
    apps: ['gp-api', 'postgres'],
    rootCause: pg.ok ? undefined : pg.detail,
    chain: pg.ok ? undefined : 'postgres → prisma → api → all apps',
  })
  groups.health.push(checks.at(-1))

  // ── 5 Shared-core sync ──
  const scIssues = checkSharedCoreSync()
  const scSt = scIssues.length === 0 ? 'pass' : 'fail'
  addCheck({
    id: 'shared-core',
    name: 'shared-core sync',
    status: scSt,
    score: scoreFrom(scSt),
    detail: scIssues.length ? scIssues.join('; ') : 'exports, deps, lockfile, Dockerfile aligned',
    apps: ['gp-service', 'gp-partner', 'gp-admin', 'packages/shared', 'deploy'],
    rootCause: scIssues[0],
    chain: scIssues.length ? 'shared-core → @gp/shared re-exports → vite builds' : undefined,
  })
  groups.sharedCore.push(checks.at(-1))

  // ── 6 API compatibility ──
  const apiComp = checkApiCompatibility()
  const apiSt =
    apiComp.missing.length === 0 && apiComp.missingRoutes.length === 0
      ? 'pass'
      : apiComp.missing.length
        ? 'fail'
        : 'warn'
  addCheck({
    id: 'api-compat',
    name: 'API compatibility',
    status: apiSt,
    score: scoreFrom(apiSt),
    detail:
      apiComp.missing.length > 0
        ? `missing methods: ${apiComp.missing.join(', ')}`
        : apiComp.missingRoutes.length > 0
          ? `missing routes: ${apiComp.missingRoutes.join(', ')}`
          : `${apiComp.methodCount} client methods, routes OK`,
    apps: ['gp-service', 'gp-partner', 'gp-admin', 'gp-api'],
    rootCause: apiComp.missing[0] || (apiComp.missingRoutes[0] ? `route ${apiComp.missingRoutes[0]}` : undefined),
    chain: 'packages/shared/api ↔ apps/api controllers',
  })
  groups.apiSync.push(checks.at(-1))

  // Env quick check
  const envCheck = runSilent('node', ['scripts/check-env.mjs'])
  const envSt = statusFrom(envCheck.ok)
  addCheck({
    id: 'env-contract',
    name: 'Environment contract',
    status: envSt,
    score: scoreFrom(envSt),
    detail: envCheck.ok ? 'documented env vars OK' : 'check-env failed',
    apps: ['deploy'],
  })
  groups.health.push(checks.at(-1))

  // Prisma
  const prismaVal = runSilent('npx', [
    'prisma',
    'validate',
    '--schema',
    'apps/api/prisma/schema.prisma',
  ])
  const prismaSt = statusFrom(prismaVal.ok)
  addCheck({
    id: 'prisma',
    name: 'Prisma schema',
    status: prismaSt,
    score: scoreFrom(prismaSt),
    detail: prismaVal.ok ? 'schema valid' : 'prisma validate failed',
    apps: ['gp-api'],
    chain: prismaVal.ok ? undefined : 'prisma → migrations → api',
  })
  groups.health.push(checks.at(-1))

  // ── 7–10 Live flows ──
  const apiProbe = await probeApiReachable()
  const apiUp = apiProbe.ok && apiProbe.dbOk !== false

  addCheck({
    id: 'api-runtime',
    name: 'API runtime (health)',
    status: apiProbe.ok ? (apiProbe.dbOk ? 'pass' : 'warn') : 'fail',
    score: scoreFrom(apiProbe.ok ? (apiProbe.dbOk ? 'pass' : 'warn') : 'fail'),
    detail: apiProbe.ok
      ? `API ok, DB ${apiProbe.dbOk ? 'ok' : apiProbe.dbMessage || 'unknown'}`
      : apiProbe.error || 'API not reachable on :4000',
    apps: ['gp-api'],
    rootCause: apiProbe.error,
    chain: 'api → auth/moderation/order/partner flows',
  })
  groups.runtime.push(checks.at(-1))
  groups.health.push(checks.at(-1))

  let flowContext = null
  if (!apiUp) {
    for (const [id, name] of [
      ['auth-flow', 'Auth flow status'],
      ['moderation-flow', 'Moderation flow status'],
      ['order-flow', 'Order flow status'],
      ['partner-flow', 'Partner flow status'],
    ]) {
      addCheck({
        id,
        name,
        status: 'skip',
        score: scoreFrom('skip'),
        detail: 'API not running — start API + postgres (npm run dev:api)',
        apps: ['gp-api'],
      })
      groups.runtime.push(checks.at(-1))
    }
  } else {
    const auth = await runAuthFlow()
    const authSt = statusFrom(auth.ok)
    addCheck({
      id: 'auth-flow',
      name: 'Auth flow status',
      status: authSt,
      score: scoreFrom(authSt),
      detail: auth.ok
        ? auth.steps.map((s) => s.name).join(', ')
        : auth.error || auth.chain?.rootCause,
      apps: auth.chain?.apps,
      rootCause: auth.chain?.rootCause,
      chain: 'auth/register → JWT → all apps',
    })
    groups.runtime.push(checks.at(-1))

    const partner = await runPartnerFlow(auth.tokens?.partner)
    const partnerSt = statusFrom(partner.ok)
    addCheck({
      id: 'partner-flow',
      name: 'Partner flow status',
      status: partnerSt,
      score: scoreFrom(partnerSt),
      detail: partner.ok
        ? partner.steps.map((s) => `${s.name}:${s.detail}`).join('; ')
        : partner.error || partner.chain?.rootCause,
      apps: partner.chain?.apps,
      rootCause: partner.chain?.rootCause,
      chain: 'partner register → apply → PENDING_REVIEW',
    })
    groups.runtime.push(checks.at(-1))

    const mod = await runModerationFlow(auth.tokens?.admin, partner.partnerProfileId)
    const modSt = statusFrom(mod.ok)
    addCheck({
      id: 'moderation-flow',
      name: 'Moderation flow status',
      status: modSt,
      score: scoreFrom(modSt),
      detail: mod.ok
        ? mod.steps.map((s) => s.detail).join(', ')
        : mod.error || mod.chain?.rootCause,
      apps: mod.chain?.apps,
      rootCause: mod.chain?.rootCause,
      chain: 'admin moderation → APPROVED → partner modules',
    })
    groups.runtime.push(checks.at(-1))

    flowContext = {
      clientToken: auth.tokens?.client,
      partnerToken: auth.tokens?.partner,
      adminToken: auth.tokens?.admin,
      partnerProfileId: partner.partnerProfileId,
    }
    const order = await runOrderFlow(flowContext)
    const orderSt = statusFrom(order.ok)
    addCheck({
      id: 'order-flow',
      name: 'Order flow status',
      status: orderSt,
      score: scoreFrom(orderSt),
      detail: order.ok
        ? order.steps.map((s) => s.name).join(' → ')
        : order.error || order.chain?.rootCause,
      apps: order.chain?.apps,
      rootCause: order.chain?.rootCause,
      chain: 'service order → admin assign → partner accept → status sync',
    })
    groups.runtime.push(checks.at(-1))
  }

  const scores = aggregateScores({
    health: groups.health,
    deployment: groups.deployment,
    apiSync: groups.apiSync,
    sharedCore: groups.sharedCore,
    builds: groups.builds,
    runtime: groups.runtime,
  })

  const finalStatus = overallStatus(scores, checks)
  const uniqueChains = [...new Map(chains.map((c) => [c.chain, c])).values()]

  const report = {
    generatedAt: new Date().toISOString(),
    mode: QUICK ? 'quick' : 'full',
    finalStatus,
    scores,
    checks: checks.map(({ id, name, status, score, detail, apps, rootCause }) => ({
      id,
      name,
      status,
      score,
      detail,
      apps,
      rootCause,
    })),
    brokenChains: uniqueChains,
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2))
    process.exit(finalStatus === 'RED' ? 1 : 0)
  }

  printReport(report, checks, scores, finalStatus, uniqueChains)
  process.exit(finalStatus === 'RED' ? 1 : finalStatus === 'YELLOW' ? 0 : 0)
}

function printReport(report, checks, scores, finalStatus, brokenChains) {
  const reset = '\x1b[0m'
  const bold = '\x1b[1m'
  const c = statusColor(finalStatus)

  console.log(`\n${bold}╔══════════════════════════════════════════════════════════╗${reset}`)
  console.log(`${bold}║           GP ECOSYSTEM STABILITY REPORT                  ║${reset}`)
  console.log(`${bold}╚══════════════════════════════════════════════════════════╝${reset}`)
  console.log(`Mode: ${report.mode}  |  ${new Date().toLocaleString()}\n`)

  console.log(`${bold}── Composite scores (0–100) ──${reset}`)
  console.log(`  Ecosystem stability:     ${scores.ecosystemStabilityScore}`)
  console.log(`  Health score:            ${scores.healthScore}`)
  console.log(`  Deployment score:        ${scores.deploymentScore}`)
  console.log(`  API sync score:          ${scores.apiSyncScore}`)
  console.log(`  shared-core integrity:   ${scores.sharedCoreIntegrityScore}`)
  console.log(`  Build score:             ${scores.buildScore}`)
  console.log(`  Runtime / flows score:   ${scores.runtimeScore}\n`)

  console.log(`${bold}── Stability checks (10) ──${reset}`)
  const byId = Object.fromEntries(checks.map((c) => [c.id, c]))

  function rollup(ids) {
    const list = ids.map((id) => byId[id]).filter(Boolean)
    if (!list.length) return { status: 'skip', detail: 'n/a' }
    if (list.some((c) => c.status === 'fail')) {
      const bad = list.find((c) => c.status === 'fail')
      return { status: 'fail', detail: bad.detail }
    }
    if (list.some((c) => c.status === 'warn')) {
      return { status: 'warn', detail: list.map((c) => c.id).join(', ') }
    }
    if (list.every((c) => c.status === 'skip')) return { status: 'skip', detail: list[0].detail }
    return { status: 'pass', detail: list.map((c) => c.id.replace('build-', '')).join(', ') + ' OK' }
  }

  const sections = [
    ['Frontend build status', ['build-service', 'build-partner', 'build-admin']],
    ['Backend build status', ['build-api']],
    ['Docker status', ['docker']],
    ['PostgreSQL status', ['postgres']],
    ['shared-core sync', ['shared-core']],
    ['API compatibility', ['api-compat']],
    ['Auth flow status', ['auth-flow']],
    ['Moderation flow status', ['moderation-flow']],
    ['Order flow status', ['order-flow']],
    ['Partner flow status', ['partner-flow']],
  ]
  sections.forEach(([title, ids], i) => {
    const r = ids.length === 1 ? byId[ids[0]] : rollup(ids)
    const st = r.status || byId[ids[0]]?.status
    const detail = r.detail || byId[ids[0]]?.detail
    console.log(
      `  ${i + 1}. ${title.padEnd(24)} ${icon(st)} ${st.toUpperCase().padEnd(5)} ${(detail || '').slice(0, 55)}`,
    )
  })

  console.log(`\n${bold}── Final result ──${reset}`)
  console.log(`  ${c}${bold}${finalStatus}${reset} — ${
    finalStatus === 'GREEN'
      ? 'ecosystem stable'
      : finalStatus === 'YELLOW'
        ? 'partial issues — review before deploy'
        : 'unstable — fix before deploy'
  }\n`)

  if (brokenChains.length) {
    console.log(`${bold}── Broken dependency chains ──${reset}`)
    for (const b of brokenChains) {
      console.log(`  Chain: ${b.chain}`)
      console.log(`    Affected: ${b.affectedApps.join(', ')}`)
      console.log(`    Root cause: ${b.rootCause}\n`)
    }
  }

  const failed = checks.filter((c) => c.status === 'fail')
  const warned = checks.filter((c) => c.status === 'warn')
  if (failed.length || warned.length) {
    console.log(`${bold}── Affected apps (summary) ──${reset}`)
    const apps = [...new Set([...failed, ...warned].flatMap((c) => c.apps || []))]
    console.log(`  ${apps.join(', ') || 'none'}\n`)
    if (failed.length) {
      console.log(`${bold}── Root causes ──${reset}`)
      for (const f of failed) {
        console.log(`  • ${f.name}: ${f.rootCause || f.detail}`)
      }
      console.log('')
    }
  }
}

main().catch((e) => {
  console.error('Report failed:', e)
  process.exit(1)
})
