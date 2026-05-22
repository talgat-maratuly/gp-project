import http from 'node:http'

const targets = [
  { port: 5190, path: '/store' },
  { port: 5173, path: '/' },
  { port: 5174, path: '/' },
  { port: 5175, path: '/' },
]

function probe(port, path) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: '127.0.0.1', port, path, timeout: 3000 }, (res) => {
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

export default async function globalSetup() {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    const ok = (await Promise.all(targets.map((t) => probe(t.port, t.path)))).every(Boolean)
    if (ok) return
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('E2E global setup: apps not ready on 5173–5175 / hub 5190')
}
