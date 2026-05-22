#!/usr/bin/env node
/** Full QA: store/stress/API + Playwright E2E + merged report */
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../..')

function run(cmd, args, label) {
  console.log(`\n=== ${label} ===\n`)
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false })
  return r.status ?? 1
}

let code = run('node', ['scripts/qa/run-all.mjs'], 'QA Store + Stress + API')
if (code !== 0) {
  console.error('Store/API QA failed — skipping E2E merge')
  process.exit(code)
}

const skipE2e = process.env.QA_SKIP_E2E === '1'
if (!skipE2e) {
  const e2eCode = run('npx', ['playwright', 'test'], 'Playwright E2E')
  if (e2eCode !== 0) {
    console.error('Playwright E2E failed')
    process.exit(e2eCode)
  }
  code = run('node', ['scripts/qa/merge-e2e-report.mjs'], 'Merge E2E report')
}

process.exit(code)
