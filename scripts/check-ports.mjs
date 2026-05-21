#!/usr/bin/env node
/**
 * Проверка портов MVP. Если занят — понятное сообщение и exit 1.
 * Использование: node scripts/check-ports.mjs
 */
import { execSync } from 'node:child_process'

const PORTS = [
  { port: 4000, label: 'GP API', message: 'GP API уже запущен (порт 4000)' },
  { port: 5173, label: 'GP Service', message: 'GP Service уже запущен (порт 5173)' },
  { port: 5174, label: 'GP Partner', message: 'GP Partner уже запущен (порт 5174)' },
]

function pidsOnPort(port) {
  try {
    const out = execSync(`lsof -ti:${port} 2>/dev/null`, { encoding: 'utf8' }).trim()
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}

const busy = PORTS.map((p) => ({ ...p, pids: pidsOnPort(p.port) })).filter((p) => p.pids.length)

if (!busy.length) {
  console.log('[check:ports] OK — 4000, 5173, 5174 свободны')
  process.exit(0)
}

console.error('\n❌ Порты заняты — запуск dev отменён:\n')
for (const { port, message, pids } of busy) {
  console.error(`  • ${message}`)
  console.error(`    http://localhost:${port} · PID: ${pids.join(', ')}\n`)
}
console.error('Исправление: npm run kill:ports   или   npm run restart:all\n')
process.exit(1)
