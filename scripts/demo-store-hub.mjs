#!/usr/bin/env node
/** Hub для общего demo-store между GP Service / Partner / Admin (разные порты) */
import http from 'http'
import { createSeedState } from '../packages/shared/src/demo/seed.js'

const PORT = Number(process.env.GP_DEMO_HUB_PORT || 5190)
let store = createSeedState()

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.url === '/store' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(store))
    return
  }
  if (req.url === '/store' && req.method === 'PUT') {
    const chunks = []
    for await (const c of req) chunks.push(c)
    try {
      store = JSON.parse(Buffer.concat(chunks).toString())
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    } catch {
      res.writeHead(400)
      res.end('bad json')
    }
    return
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, orders: store.orders?.length }))
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[gp-demo-hub] http://127.0.0.1:${PORT}/store`)
})
