#!/usr/bin/env node
/**
 * Освобождает порты MVP перед запуском dev-серверов.
 * macOS / Linux: lsof + SIGKILL
 */
import { execSync } from 'node:child_process'

const MVP_PORTS = [
  { port: 4000, label: 'GP API' },
  { port: 5173, label: 'GP Service' },
  { port: 5174, label: 'GP Partner' },
]

/** Vite fallback / admin — тоже чистим, чтобы не мешали */
const EXTRA_PORTS = [5175, 5176]

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti:${port} -sTCP:LISTEN 2>/dev/null || lsof -ti:${port} 2>/dev/null`, {
      encoding: 'utf8',
    }).trim()
    return out ? [...new Set(out.split('\n').filter(Boolean))] : []
  } catch {
    return []
  }
}

function killPids(pids) {
  for (const pid of pids) {
    try {
      process.kill(Number(pid), 'SIGKILL')
    } catch {
      /* already dead */
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const allPorts = [...MVP_PORTS, ...EXTRA_PORTS.map((port) => ({ port, label: `extra :${port}` }))]

let killed = 0
for (const { port, label } of allPorts) {
  const pids = pidsOnPort(port)
  if (!pids.length) continue
  console.log(`[kill:ports] ${label} — порт ${port} (PID: ${pids.join(', ')})`)
  killPids(pids)
  killed += pids.length
}

if (killed) {
  await sleep(600)
  console.log(`[kill:ports] готово, освобождено процессов: ${killed}`)
} else {
  console.log('[kill:ports] порты 4000, 5173, 5174 свободны')
}
