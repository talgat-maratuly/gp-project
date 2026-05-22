#!/usr/bin/env node
/**
 * Стабильный запуск API + GP Service + GP Partner + GP Admin.
 * Market (GP Shop) — раздел /shop внутри GP Service (:5173).
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

try {
  execSync('node scripts/check-ports.mjs', { cwd: root, stdio: 'inherit' })
} catch {
  process.exit(1)
}

const concurrently = join(root, 'node_modules', '.bin', 'concurrently')

const args = [
  '-n', 'api,service,partner,admin',
  '-c', 'yellow,green,cyan,magenta',
  '--kill-others-on-fail',
  'npm run dev:api',
  'npm run dev:service',
  'npm run dev:partner',
  'npm run dev:admin',
]

console.log('\n▶ GP dev: API :4000 · Service/Market :5173 · Partner :5174 · Admin :5175\n')

const child = spawn(concurrently, args, {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code) => process.exit(code ?? 0))

process.on('SIGINT', () => {
  child.kill('SIGINT')
})
process.on('SIGTERM', () => {
  child.kill('SIGTERM')
})
