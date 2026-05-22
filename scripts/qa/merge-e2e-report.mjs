#!/usr/bin/env node
/** Merge Playwright JSON report into qa-report.json */
import fs from 'fs'
import path from 'path'
import { REPORT_PATH, REPORT_COPY, LOGS_DIR, QA_ROOT } from './reporter.mjs'

const PW_PATH = path.join(LOGS_DIR, 'playwright-report.json')

function walkSuites(suites, out) {
  for (const s of suites || []) {
    if (s.specs) {
      for (const spec of s.specs) {
        for (const t of spec.tests || []) {
          const r = t.results?.[0]
          out.push({
            title: [...(s.titlePath || []), spec.title].filter(Boolean).join(' › '),
            status: r?.status || t.status || 'unknown',
            durationMs: r?.duration ?? 0,
            error: r?.error?.message || null,
          })
        }
      }
    }
    walkSuites(s.suites, out)
  }
}

function parsePlaywrightReport(raw) {
  const tests = []
  if (raw.suites) walkSuites(raw.suites, tests)
  else if (Array.isArray(raw)) {
    for (const row of raw) tests.push(row)
  }
  const passed = tests.filter((t) => t.status === 'passed').length
  const failed = tests.filter((t) => !['passed', 'skipped'].includes(t.status)).length
  const skipped = tests.filter((t) => t.status === 'skipped').length
  return {
    tests,
    summary: {
      totalTests: tests.length,
      passed,
      failed,
      skipped,
      successRate: tests.length ? Math.round((passed / tests.length) * 100) : 0,
    },
  }
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('No qa-report.json — run npm run qa:all first')
    process.exit(1)
  }
  if (!fs.existsSync(PW_PATH)) {
    console.error('No playwright-report.json — run npm run qa:e2e first')
    process.exit(1)
  }

  const base = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
  const pw = JSON.parse(fs.readFileSync(PW_PATH, 'utf8'))
  const e2e = parsePlaywrightReport(pw)

  const e2eModule = {
    module: 'Playwright E2E',
    tests: e2e.summary.totalTests,
    passed: e2e.summary.passed,
    failed: e2e.summary.failed,
    warnings: 0,
    avgResponseTimeMs: e2e.tests.length
      ? Math.round(e2e.tests.reduce((s, t) => s + (t.durationMs || 0), 0) / e2e.tests.length)
      : 0,
  }

  const modules = (base.modules || []).filter((m) => m.module !== 'Playwright E2E')
  modules.push(e2eModule)

  const merged = {
    ...base,
    runAt: new Date().toISOString(),
    modules,
    e2e: {
      ...e2e.summary,
      specs: e2e.tests,
      reportFile: 'qa-logs/playwright-report.json',
    },
    summary: {
      ...base.summary,
      totalTests: modules.reduce((s, m) => s + m.tests, 0),
      passed: modules.reduce((s, m) => s + m.passed, 0),
      failed: modules.reduce((s, m) => s + m.failed, 0),
      warnings: modules.reduce((s, m) => s + m.warnings, 0),
      successRate: 0,
      systemStatus: base.summary?.systemStatus || 'healthy',
    },
    note: 'Store/API: npm run qa:all · UI: npm run qa:e2e · Full: npm run qa:full',
  }
  merged.summary.successRate = merged.summary.totalTests
    ? Math.round((merged.summary.passed / merged.summary.totalTests) * 100)
    : 0
  if (merged.summary.failed > 0) {
    merged.summary.systemStatus = merged.summary.failed > merged.summary.totalTests * 0.1 ? 'failed' : 'degraded'
  } else if (merged.summary.warnings > 5) {
    merged.summary.systemStatus = 'degraded'
  } else {
    merged.summary.systemStatus = 'healthy'
  }

  merged.errors = [
    ...(base.errors || []),
    ...e2e.tests
      .filter((t) => t.status !== 'passed' && t.status !== 'skipped')
      .map((t) => ({ module: 'Playwright E2E', test: t.title, message: t.error || t.status, stack: null })),
  ]

  fs.mkdirSync(LOGS_DIR, { recursive: true })
  fs.mkdirSync(path.join(QA_ROOT, 'qa-reports'), { recursive: true })
  fs.writeFileSync(REPORT_PATH, JSON.stringify(merged, null, 2))
  fs.writeFileSync(REPORT_COPY, JSON.stringify(merged, null, 2))
  console.log(`Merged E2E: ${e2e.summary.passed}/${e2e.summary.totalTests} passed → ${REPORT_PATH}`)
  process.exit(e2e.summary.failed > 0 ? 1 : 0)
}

main()
