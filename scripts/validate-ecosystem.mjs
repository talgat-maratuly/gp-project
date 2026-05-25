#!/usr/bin/env node
/**
 * GP Monorepo pre-commit / pre-deploy validation.
 *
 * Usage:
 *   node scripts/validate-ecosystem.mjs           # full (no docker)
 *   node scripts/validate-ecosystem.mjs --quick   # env + api + prisma + typecheck
 *   node scripts/validate-ecosystem.mjs --docker  # + docker image builds
 */
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { NGINX_APPS, SERVICES } from '../packages/shared/src/ecosystem/manifest.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const quick = args.has('--quick')
const withDocker = args.has('--docker')

function run(label, cmd, cmdArgs = [], opts = {}) {
  console.log(`\n▶ ${label}`)
  console.log(`  ${cmd} ${cmdArgs.join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  })
  if (r.status !== 0) {
    console.error(`\n✗ FAILED: ${label}`)
    return false
  }
  console.log(`✓ ${label}`)
  return true
}

const steps = []

steps.push(() => run('Environment contract', 'node', ['scripts/check-env.mjs']))
steps.push(() => run('API contract (shared ↔ backend)', 'node', ['scripts/check-api-contract.mjs']))
steps.push(() =>
  run('Prisma validate', 'npx', ['prisma', 'validate', '--schema', 'apps/api/prisma/schema.prisma']),
)
steps.push(() => run('Prisma generate', 'npm', ['run', 'prisma:generate']))
steps.push(() => run('Backend typecheck', 'npm', ['run', 'typecheck', '-w', '@gp/api']))

if (!quick) {
  steps.push(() => run('Build API', 'npm', ['run', 'build:api']))
  steps.push(() => run('Build GP Service', 'npm', ['run', 'build:service']))
  steps.push(() => run('Build GP Partner', 'npm', ['run', 'build:partner']))
  steps.push(() => run('Build GP Admin', 'npm', ['run', 'build:admin']))
}

if (withDocker) {
  const dockerOk = spawnSync('docker', ['version'], { stdio: 'ignore' }).status === 0
  if (!dockerOk) {
    console.error('\n✗ Docker not available — skip --docker or install Docker')
    process.exit(1)
  }
  steps.push(() =>
    run('Docker build API', 'docker', [
      'build',
      '-f',
      'deploy/Dockerfile.api',
      '-t',
      'gp-api:validate',
      '.',
    ]),
  )
  for (const app of NGINX_APPS) {
    steps.push(() =>
      run(`Docker build frontend (${app})`, 'docker', [
        'build',
        '-f',
        'deploy/Dockerfile.frontend',
        '--build-arg',
        `GP_APP=${app}`,
        '--build-arg',
        'VITE_API_URL=http://localhost:4000/api',
        '-t',
        `gp-${app}:validate`,
        '.',
      ]),
    )
  }
}

console.log('╔══════════════════════════════════════════╗')
console.log('║  GP Ecosystem Validation                 ║')
console.log('╚══════════════════════════════════════════╝')
console.log(`Mode: ${quick ? 'quick' : 'full'}${withDocker ? ' + docker' : ''}`)
console.log('Services:', Object.values(SERVICES).map((s) => s.id).join(', '))

let ok = true
for (const step of steps) {
  if (!step()) {
    ok = false
    break
  }
}

if (ok) {
  console.log('\n══════════════════════════════════════════')
  console.log('✓ GP ecosystem validation passed')
  console.log('══════════════════════════════════════════\n')
  process.exit(0)
}

console.log('\n══════════════════════════════════════════')
console.log('✗ GP ecosystem validation FAILED')
console.log('  Fix all affected services — do not patch one screen only.')
console.log('  See .cursor/rules/gp-ecosystem-sync.mdc and AGENTS.md')
console.log('══════════════════════════════════════════\n')
process.exit(1)
