#!/usr/bin/env node
/**
 * Full GP stability flow (API-level). Used by ecosystem:report and standalone.
 */
import {
  probeApiReachable,
  runAuthFlow,
  runPartnerFlow,
  runModerationFlow,
  runOrderFlow,
} from './lib/ecosystem-flows.mjs'

const results = []

function record(step, ok, detail = '') {
  results.push({ step, ok, detail })
  const mark = ok ? '✓ PASS' : '✗ FAIL'
  console.log(`${mark}  ${step}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  const API = process.env.API_URL || 'http://localhost:4000/api'
  console.log(`\n=== GP stability flow test ===\nAPI: ${API}\n`)

  const probe = await probeApiReachable()
  record('API health', probe.ok, probe.error)
  if (!probe.ok) {
    printSummary()
    process.exit(1)
  }

  const auth = await runAuthFlow()
  for (const s of auth.steps) record(s.name, s.ok, s.detail)
  const partner = await runPartnerFlow(auth.tokens?.partner)
  for (const s of partner.steps) record(s.name, s.ok, s.detail)
  const mod = await runModerationFlow(auth.tokens?.admin, partner.partnerProfileId)
  for (const s of mod.steps) record(s.name, s.ok, s.detail)
  const order = await runOrderFlow({
    clientToken: auth.tokens?.client,
    partnerToken: auth.tokens?.partner,
    adminToken: auth.tokens?.admin,
    partnerProfileId: partner.partnerProfileId,
  })
  for (const s of order.steps) record(s.name, s.ok, s.detail)

  printSummary()
  process.exit(
    results.some((r) => !r.ok) || !auth.ok || !partner.ok || !mod.ok || !order.ok ? 1 : 0,
  )
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n── Flow summary: ${passed} passed, ${failed} failed ──\n`)
}

main().catch((e) => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
