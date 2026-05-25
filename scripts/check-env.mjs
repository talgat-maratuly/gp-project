#!/usr/bin/env node
/**
 * Проверка документированных env-переменных GP ecosystem.
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ENV_CONTRACT, SERVICES } from '../packages/shared/src/ecosystem/manifest.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function readEnvKeys(filePath) {
  const full = join(ROOT, filePath)
  if (!existsSync(full)) return { path: filePath, missing: true, keys: [] }
  const text = readFileSync(full, 'utf8')
  const keys = [...text.matchAll(/^(?:export\s+)?([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1])
  const commented = [...text.matchAll(/^#\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1])
  return { path: filePath, missing: false, keys: [...new Set([...keys, ...commented])] }
}

let failed = 0

console.log('=== GP Environment contract ===\n')

const rootExample = readEnvKeys('.env.example')
const apiExample = readEnvKeys('apps/api/.env.example')

for (const key of ENV_CONTRACT.api.required) {
  const inRoot = rootExample.keys.includes(key)
  const inApi = apiExample.keys.includes(key)
  if (!inRoot && !inApi) {
    console.error(`✗ API required env "${key}" not documented in .env.example or apps/api/.env.example`)
    failed++
  } else {
    console.log(`✓ API env documented: ${key}`)
  }
}

for (const svc of [SERVICES.service, SERVICES.partner]) {
  for (const rel of svc.envFiles) {
    const doc = readEnvKeys(rel)
    if (doc.missing) {
      console.warn(`⚠ ${svc.id}: ${rel} not found (optional for local dev)`)
      continue
    }
    if (!doc.keys.includes('VITE_API_URL')) {
      console.error(`✗ ${svc.id}: VITE_API_URL missing in ${rel}`)
      failed++
    } else {
      console.log(`✓ ${svc.id}: VITE_API_URL in ${rel}`)
    }
  }
}

const dockerProd = readEnvKeys('deploy/docker-compose.prod.yml')
if (!dockerProd.missing) {
  const text = readFileSync(join(ROOT, 'deploy/docker-compose.prod.yml'), 'utf8')
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'POSTGRES_PASSWORD']) {
    if (text.includes(key)) console.log(`✓ docker-compose.prod references ${key}`)
    else {
      console.error(`✗ deploy/docker-compose.prod.yml missing ${key}`)
      failed++
    }
  }
}

console.log(failed ? `\n✗ Env check failed (${failed} issues)` : '\n✓ Env contract OK')
process.exit(failed ? 1 : 0)
