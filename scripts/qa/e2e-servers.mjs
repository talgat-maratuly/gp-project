#!/usr/bin/env node
/** Start demo hub + Vite apps for Playwright (keeps process alive). */
import { spawn } from 'node:child_process'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const ports = [
  { port: 5190, path: '/store', label: 'hub' },
  { port: 5173, path: '/', label: 'service' },
  { port: 5174, path: '/', label: 'partner' },
  { port: 5175, path: '/', label: 'admin' },
]

function probe(port, path) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path, timeout: 2000 }, (res) => {
      res.resume()
      resolve(res.statusCode && res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitAll(maxMs = 180_000) {
  const t0 = Date.now()
  while (Date.now() - t0 < maxMs) {
    const results = await Promise.all(ports.map((p) => probe(p.port, p.path)))
    if (results.every(Boolean)) {
      console.log('[e2e-servers] All apps ready')
      return true
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  return false
}

const concurrentlyBin = join(root, 'node_modules/concurrently/dist/bin/concurrently.js')

const children = []
const hubUp = await probe(5190, '/store')
if (!hubUp) {
  const hub = spawn(process.execPath, ['scripts/demo-store-hub.mjs'], { cwd: root, stdio: 'inherit' })
  hub.on('error', (err) => console.error('[e2e-servers] hub:', err.message))
  children.push(hub)
} else {
  console.log('[e2e-servers] hub already on :5190')
}

const vite = spawn(
  process.execPath,
  [
    concurrentlyBin,
    '-n', 'service,partner,admin',
    '-c', 'green,cyan,magenta',
    'npm run dev:service',
    'npm run dev:partner',
    'npm run dev:admin',
  ],
  { cwd: root, stdio: 'inherit' },
)

children.push(vite)

function shutdown() {
  for (const c of children) {
    try {
      c.kill('SIGTERM')
    } catch {
      /* ignore */
    }
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const ok = await waitAll()
if (!ok) {
  console.error('[e2e-servers] Timeout waiting for Vite apps')
  shutdown()
  process.exit(1)
}

// Keep alive for Playwright
setInterval(() => {}, 60_000)
