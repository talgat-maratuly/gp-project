import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const QA_ROOT = path.join(__dirname, '../..')
export const LOGS_DIR = path.join(QA_ROOT, 'qa-logs')
export const REPORT_PATH = path.join(QA_ROOT, 'apps/gp-admin/public/qa-report.json')
export const REPORT_COPY = path.join(QA_ROOT, 'qa-reports/latest.json')

export class QaReporter {
  constructor() {
    this.started = Date.now()
    this.modules = new Map()
    this.errors = []
    this.warnings = []
    this.apiTimings = []
    this.failedRequests = []
    this.metrics = {
      hunterCreated: 0,
      furnitureCreated: 0,
      marketOrdersCreated: 0,
      serviceOrdersCreated: 0,
      testUsersGenerated: 0,
      partnersGenerated: 0,
    }
    this.logLines = []
  }

  module(name) {
    if (!this.modules.has(name)) {
      this.modules.set(name, { module: name, tests: 0, passed: 0, failed: 0, warnings: 0, responseTimes: [] })
    }
    return this.modules.get(name)
  }

  log(line) {
    const msg = `[${new Date().toISOString()}] ${line}`
    this.logLines.push(msg)
    console.log(line)
  }

  async test(module, name, fn) {
    const m = this.module(module)
    m.tests++
    const t0 = performance.now()
    try {
      await fn()
      m.passed++
      m.responseTimes.push(performance.now() - t0)
      return true
    } catch (e) {
      m.failed++
      const err = {
        module,
        test: name,
        message: e?.message || String(e),
        stack: e?.stack || null,
        at: new Date().toISOString(),
      }
      this.errors.push(err)
      this.log(`FAIL [${module}] ${name}: ${err.message}`)
      return false
    }
  }

  warn(module, message) {
    const m = this.module(module)
    m.warnings++
    this.warnings.push({ module, message, at: new Date().toISOString() })
    this.log(`WARN [${module}] ${message}`)
  }

  recordApi(method, path, ms, ok, status, error) {
    this.apiTimings.push({ method, path, ms, ok, status })
    if (!ok) {
      this.failedRequests.push({ method, path, ms, status, error })
    }
  }

  buildReport() {
    const modules = [...this.modules.values()].map((m) => ({
      module: m.module,
      tests: m.tests,
      passed: m.passed,
      failed: m.failed,
      warnings: m.warnings,
      avgResponseTimeMs:
        m.responseTimes.length
          ? Math.round(m.responseTimes.reduce((a, b) => a + b, 0) / m.responseTimes.length)
          : 0,
    }))

    const totalTests = modules.reduce((s, m) => s + m.tests, 0)
    const passed = modules.reduce((s, m) => s + m.passed, 0)
    const failed = modules.reduce((s, m) => s + m.failed, 0)
    const warnings = modules.reduce((s, m) => s + m.warnings, 0)

    const apiAvg =
      this.apiTimings.length
        ? Math.round(this.apiTimings.reduce((s, t) => s + t.ms, 0) / this.apiTimings.length)
        : null

    const slowApis = [...this.apiTimings]
      .filter((t) => t.ms > 500)
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 20)

    let systemStatus = 'healthy'
    if (failed > 0) systemStatus = failed > totalTests * 0.1 ? 'failed' : 'degraded'
    if (failed === 0 && warnings > 5) systemStatus = 'degraded'

    return {
      runAt: new Date().toISOString(),
      durationMs: Date.now() - this.started,
      summary: {
        totalTests,
        passed,
        failed,
        warnings,
        systemStatus,
        successRate: totalTests ? Math.round((passed / totalTests) * 100) : 0,
        avgApiResponseMs: apiAvg,
        serverStatus: this.metrics.apiReachable ? 'online' : 'offline',
      },
      metrics: { ...this.metrics },
      modules,
      errors: this.errors,
      warnings: this.warnings,
      slowApis,
      brokenPages: this.errors.filter((e) => e.module === 'Routes').map((e) => e.test),
      failedRequests: this.failedRequests,
      dataLoss: this.errors.filter((e) => /потер|loss|missing|not found/i.test(e.message)),
      duplicateIssues: this.errors.filter((e) => /дубл|duplicate/i.test(e.message)),
      logs: {
        testLog: 'qa-logs/test-run.log',
        apiLog: 'qa-logs/api-requests.json',
        failedLog: 'qa-logs/failed-requests.json',
      },
      e2e: null,
      note: 'Store/API: npm run qa:all · UI: npm run qa:e2e · Full: npm run qa:full',
    }
  }

  writeFiles(report) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
    fs.mkdirSync(path.join(QA_ROOT, 'qa-reports'), { recursive: true })
    fs.writeFileSync(path.join(LOGS_DIR, 'test-run.log'), this.logLines.join('\n'))
    fs.writeFileSync(path.join(LOGS_DIR, 'api-requests.json'), JSON.stringify(this.apiTimings, null, 2))
    fs.writeFileSync(path.join(LOGS_DIR, 'failed-requests.json'), JSON.stringify(this.failedRequests, null, 2))
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
    fs.writeFileSync(REPORT_COPY, JSON.stringify(report, null, 2))
    this.log(`Report: ${REPORT_PATH}`)
  }
}
