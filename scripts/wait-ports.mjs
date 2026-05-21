#!/usr/bin/env node
/** Ждёт освобождения портов после kill (до 5 с) */
import { execSync } from 'node:child_process'

const PORTS = [4000, 5173, 5174]

function isFree(port) {
  try {
    execSync(`lsof -ti:${port} 2>/dev/null`, { encoding: 'utf8' })
    return false
  } catch {
    return true
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

for (let i = 0; i < 25; i++) {
  if (PORTS.every(isFree)) {
    process.exit(0)
  }
  await sleep(200)
}

console.error('[wait-ports] Порты всё ещё заняты. Выполните: npm run kill:ports')
process.exit(1)
