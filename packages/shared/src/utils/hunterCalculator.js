/** Расчёт автополива на базе оборудования Hunter (demo, не официальный конфигуратор) */

const BASE_SPRINKLERS = [
  { sku: 'MP2000', name: 'Hunter MP Rotator 2000', price: 4200, radiusM: 4 },
  { sku: 'PGP', name: 'Hunter PGP-04', price: 6800, radiusM: 6 },
  { sku: 'PSU', name: 'Hunter PSU-200', price: 3500, radiusM: 3 },
]

export function calculateHunterProject(input, linkedProducts = []) {
  const length = Math.max(1, Number(input.length) || 10)
  const width = Math.max(1, Number(input.width) || 8)
  const area = length * width
  const pressure = Math.max(1.5, Number(input.pressure) || 2.5)
  const flow = Math.max(0.5, Number(input.waterFlow) || 2)

  const zones = Math.max(1, Math.ceil(area / 40))
  const sprinklersPerZone = Math.max(2, Math.ceil(area / zones / 12))
  const totalSprinklers = zones * sprinklersPerZone

  const catalog = linkedProducts.length
    ? linkedProducts.map((p) => ({ sku: p.id, name: p.name, price: Number(p.price) || 4000, radiusM: 4 }))
    : BASE_SPRINKLERS

  const pick = catalog[0] || BASE_SPRINKLERS[0]
  const sprinklers = Array.from({ length: totalSprinklers }, (_, i) => ({
    ...pick,
    id: `spr-${i + 1}`,
    zone: (i % zones) + 1,
  }))

  const pipeMeters = Math.round((length + width) * 2 * zones * 1.2)
  const pipes = [{ name: 'Труба ПНД 32мм', unit: 'м', qty: pipeMeters, price: 450 }]
  const valves = [{ name: 'Клапан Hunter PGV', qty: zones, price: 8500 }]
  const controller = { name: 'Контроллер Hunter X2', qty: 1, price: 28500 }

  const lines = [
    ...sprinklers.map((s) => ({ name: s.name, qty: 1, price: s.price, type: 'sprinkler' })),
    ...pipes.map((p) => ({ name: p.name, qty: p.qty, price: p.price, type: 'pipe' })),
    ...valves.map((v) => ({ name: v.name, qty: v.qty, price: v.price, type: 'valve' })),
    { name: controller.name, qty: 1, price: controller.price, type: 'controller' },
    { name: 'Монтаж и настройка GP', qty: 1, price: Math.round(area * 1200), type: 'labor' },
  ]

  const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const gpCommission = Math.round(total * 0.1)

  const drawing2D = {
    length,
    width,
    zones,
    sprinklers: sprinklers.map((s, i) => ({
      x: ((i % 4) + 0.5) * (length / 4),
      y: (Math.floor(i / 4) % 3 + 0.5) * (width / 3),
      zone: s.zone,
    })),
  }

  return {
    area,
    zones,
    sprinklers,
    pipes,
    valves,
    controller,
    estimate: { lines, subtotal: total, gpCommission, total },
    drawing2D,
    pressure,
    flow,
  }
}
