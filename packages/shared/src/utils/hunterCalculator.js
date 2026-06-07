/** MVP расчёт автополива Hunter. Итог подтверждает специалист. */

export const IRRIGATION_SHAPES = [
  { id: 'square', label: 'Квадрат' },
  { id: 'rectangle', label: 'Прямоугольник' },
  { id: 'triangle', label: 'Треугольник' },
  { id: 'circle', label: 'Круг' },
  { id: 'oval', label: 'Овал' },
  { id: 'custom', label: 'Произвольная форма' },
]

export const IRRIGATION_OBJECT_TYPES = [
  { id: 'house', label: 'Дом', blocksWater: true },
  { id: 'tree', label: 'Дерево', blocksWater: true },
  { id: 'flowerbed', label: 'Клумба', blocksWater: false },
  { id: 'lawn', label: 'Газон', blocksWater: false },
  { id: 'path', label: 'Дорожка', blocksWater: true },
  { id: 'no_water', label: 'Без полива', blocksWater: true },
  { id: 'water_point', label: 'Точка воды', blocksWater: false },
]

const BASE_SPRINKLERS = [
  { sku: 'MP2000', name: 'Hunter MP Rotator 2000', price: 4200, radiusM: 4, flowM3h: 0.18, minPressureBar: 2.1 },
  { sku: 'PGP', name: 'Hunter PGP-04', price: 6800, radiusM: 6, flowM3h: 0.55, minPressureBar: 2.5 },
  { sku: 'PSU', name: 'Hunter PSU-200', price: 3500, radiusM: 3, flowM3h: 0.14, minPressureBar: 1.8 },
]

const MATERIALS = [
  { key: 'valve', name: 'Клапан Hunter PGV', type: 'valve', price: 8500, match: ['клапан', 'valve', 'pgv'] },
  { key: 'controller', name: 'Контроллер Hunter X2', type: 'controller', price: 28500, match: ['контроллер', 'controller', 'x2'] },
  { key: 'filter', name: 'Фильтр 120 mesh для автополива', type: 'filter', price: 18000, match: ['фильтр', 'filter'] },
  { key: 'pipe25', name: 'Труба ПНД 25 мм', type: 'pipe', unit: 'м', price: 450, match: ['пнд', 'pipe', 'труба', '25'] },
  { key: 'fittings', name: 'Фитинги ПНД 25 мм', type: 'fitting', price: 1200, match: ['фитинг', 'fitting'] },
  { key: 'pump', name: 'Насос для автополива', type: 'pump', price: 65000, match: ['насос', 'pump'] },
]

function num(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function shapeArea(shape, length, width) {
  if (shape === 'circle') return Math.PI * Math.pow(length / 2, 2)
  if (shape === 'oval') return Math.PI * (length / 2) * (width / 2)
  if (shape === 'triangle') return (length * width) / 2
  return length * width
}

function objectArea(obj, lotArea) {
  if (obj.areaSqm != null) return Math.max(0, num(obj.areaSqm, 0))
  const width = num(obj.width, 0)
  const height = num(obj.height, 0)
  const radius = num(obj.radius, 0)
  if (radius > 0) return Math.PI * radius * radius
  if (width > 0 && height > 0) return width * height
  if (obj.type === 'tree') return 4
  if (obj.type === 'path') return Math.min(12, lotArea * 0.08)
  if (obj.type === 'house') return Math.min(80, lotArea * 0.22)
  if (obj.type === 'flowerbed') return Math.min(10, lotArea * 0.05)
  if (obj.type === 'no_water') return Math.min(10, lotArea * 0.05)
  return 0
}

function normalizeObject(obj, index) {
  const type = obj.type || 'tree'
  return {
    id: obj.id || `obj-${index + 1}`,
    type,
    label: obj.label || IRRIGATION_OBJECT_TYPES.find((o) => o.id === type)?.label || type,
    x: clamp(num(obj.x, 20 + index * 8), 2, 98),
    y: clamp(num(obj.y, 20 + index * 6), 2, 98),
    width: num(obj.width, type === 'house' ? 20 : type === 'path' ? 55 : 8),
    height: num(obj.height, type === 'house' ? 16 : type === 'path' ? 6 : 8),
    radius: num(obj.radius, type === 'tree' ? 5 : 0),
    areaSqm: obj.areaSqm == null ? undefined : num(obj.areaSqm, 0),
  }
}

function linkedCatalog(linkedProducts) {
  const source = linkedProducts?.length
    ? linkedProducts.map((p) => ({
        sku: p.id || p.sku,
        productId: p.id,
        name: p.name,
        price: num(p.price, 4000),
        quantity: num(p.quantity ?? p.stock, p.inStock === false ? 0 : 1),
        inStock: p.inStock !== false && num(p.quantity ?? p.stock, 1) > 0,
        storeName: p.storeName || p.partnerName || p.shopName || 'GP Market',
        radiusM: num(p.radiusM, /pgp/i.test(p.name || '') ? 6 : /psu|pro-spray/i.test(p.name || '') ? 3 : 4),
        flowM3h: num(p.flowM3h, /pgp/i.test(p.name || '') ? 0.55 : 0.18),
        minPressureBar: num(p.minPressureBar, /pgp/i.test(p.name || '') ? 2.5 : 2.1),
      }))
    : []
  return source.length ? source : BASE_SPRINKLERS.map((p) => ({ ...p, quantity: 0, inStock: false, storeName: null }))
}

function pickSprinkler(area, pressure, catalog) {
  const available = catalog.filter((p) => p.inStock && pressure >= p.minPressureBar)
  if (available.length) return area > 180 ? (available.find((p) => p.radiusM >= 6) || available[0]) : available[0]
  const base = area > 180 ? BASE_SPRINKLERS[1] : pressure < 2.1 ? BASE_SPRINKLERS[2] : BASE_SPRINKLERS[0]
  const analog = catalog.find((p) => pressure >= p.minPressureBar) || catalog[0]
  return { ...base, analog: analog?.inStock ? analog : null, inStock: false, quantity: 0 }
}

function marketMatch(line, products) {
  const hay = (p) => `${p.name || ''} ${p.brand || ''} ${p.categoryId || ''}`.toLowerCase()
  const words = [
    line.name,
    ...(line.match || []),
  ].join(' ').toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  const found = (products || []).find((p) => words.some((w) => hay(p).includes(w)))
  if (!found) return { status: 'missing', message: 'нет в наличии', requestToShop: true }
  const stock = num(found.quantity ?? found.stock, found.inStock === false ? 0 : line.qty)
  return {
    status: stock >= line.qty ? 'available' : stock > 0 ? 'partial' : 'missing',
    productId: found.id,
    productName: found.name,
    price: num(found.price, line.price),
    quantity: stock,
    storeName: found.storeName || found.partnerName || found.shopName || 'GP Market',
    message: stock >= line.qty ? 'в наличии' : stock > 0 ? 'частично в наличии' : 'нет в наличии',
    requestToShop: stock < line.qty,
  }
}

export function calculateHunterProject(input = {}, linkedProducts = []) {
  const shape = input.shape || input.shapeType || 'rectangle'
  const length = Math.max(1, num(input.length, 12))
  const width = Math.max(1, num(input.width, shape === 'square' || shape === 'circle' ? length : 8))
  const sotkaArea = num(input.sotki ?? input.lotAreaSotka, 0) * 100
  const grossArea = sotkaArea > 0 ? sotkaArea : shapeArea(shape, length, width)
  const pressure = Math.max(0.1, num(input.pressure, 2.5))
  const flow = Math.max(0.1, num(input.waterFlow, 2))
  const objects = (input.objects || input.obstacles || []).map(normalizeObject)
  const noWaterObjects = objects.filter((o) => ['house', 'path', 'no_water'].includes(o.type))
  const noWaterArea = noWaterObjects.reduce((sum, o) => sum + objectArea(o, grossArea), 0)
  const explicitLawnArea = num(input.lawnAreaSqm, 0)
  const lawnArea = Math.max(1, Math.round(explicitLawnArea || grossArea - noWaterArea))

  const catalog = linkedCatalog(linkedProducts)
  const sprinklerType = pickSprinkler(lawnArea, pressure, catalog)
  const sprinklerCoverage = Math.max(8, Math.PI * Math.pow(sprinklerType.radiusM, 2) * 0.55)
  const totalSprinklers = Math.max(2, Math.ceil(lawnArea / sprinklerCoverage))
  const flowPerSprinkler = num(sprinklerType.flowM3h, 0.18)
  const maxSprinklersPerZone = Math.max(1, Math.floor(flow / flowPerSprinkler))
  const areaZones = Math.ceil(lawnArea / 120)
  const flowZones = Math.ceil(totalSprinklers / maxSprinklersPerZone)
  const zones = Math.max(1, areaZones, flowZones)
  const sprinklersPerZone = Math.ceil(totalSprinklers / zones)

  const sprinklers = Array.from({ length: totalSprinklers }, (_, i) => ({
    ...sprinklerType,
    id: `spr-${i + 1}`,
    zone: (i % zones) + 1,
    x: ((i % Math.ceil(Math.sqrt(totalSprinklers))) + 0.5) * (length / Math.ceil(Math.sqrt(totalSprinklers))),
    y: (Math.floor(i / Math.ceil(Math.sqrt(totalSprinklers))) + 0.5) * (width / Math.ceil(totalSprinklers / Math.ceil(Math.sqrt(totalSprinklers)))),
  }))

  const pipeMeters = Math.max(20, Math.round((length + width) * 2 + totalSprinklers * sprinklerType.radiusM * 1.15 + zones * 8))
  const needsPump = pressure < sprinklerType.minPressureBar || flow < totalSprinklers * flowPerSprinkler / zones
  const controllerZones = zones <= 4 ? 4 : zones <= 6 ? 6 : zones <= 8 ? 8 : 12
  const pipes = [{ key: 'pipe25', name: 'Труба ПНД 25 мм', unit: 'м', qty: pipeMeters, price: 450, type: 'pipe', match: MATERIALS.find((m) => m.key === 'pipe25').match }]
  const valves = [{ key: 'valve', name: 'Клапан Hunter PGV', qty: zones, price: 8500, type: 'valve', match: MATERIALS.find((m) => m.key === 'valve').match }]
  const controller = { key: 'controller', name: `Контроллер Hunter X2 ${controllerZones} зон`, qty: 1, price: 28500 + Math.max(0, controllerZones - 4) * 4500, type: 'controller', match: MATERIALS.find((m) => m.key === 'controller').match }
  const filter = { key: 'filter', name: 'Фильтр 120 mesh для автополива', qty: 1, price: 18000, type: 'filter', match: MATERIALS.find((m) => m.key === 'filter').match }
  const fittings = { key: 'fittings', name: 'Фитинги ПНД 25 мм', qty: Math.max(10, totalSprinklers * 2 + zones * 3), price: 1200, type: 'fitting', match: MATERIALS.find((m) => m.key === 'fittings').match }
  const pump = needsPump ? { key: 'pump', name: 'Насос для автополива', qty: 1, price: 65000, type: 'pump', match: MATERIALS.find((m) => m.key === 'pump').match } : null
  const sprinklerLine = {
    key: 'sprinkler',
    name: sprinklerType.name,
    qty: totalSprinklers,
    price: num(sprinklerType.price, 4200),
    type: 'sprinkler',
    match: ['hunter', 'mp', 'pgp', 'sprinkler', 'форсунка', 'спринклер'],
  }

  const materialLines = [sprinklerLine, ...pipes, ...valves, controller, filter, fittings, ...(pump ? [pump] : [])]
  const market = materialLines.map((line) => ({ ...line, market: marketMatch(line, linkedProducts) }))
  const labor = { name: 'Проверка и монтаж специалистом GP', qty: 1, price: Math.round(lawnArea * 1100), type: 'labor' }
  const lines = [...market, labor]
  const total = lines.reduce((sum, line) => sum + num(line.qty, 1) * num(line.market?.price ?? line.price, 0), 0)
  const gpCommission = Math.round(total * 0.1)

  const aiChecks = []
  if (shape === 'custom' && (!input.points || input.points.length < 3)) {
    aiChecks.push({ level: 'warning', code: 'custom_shape_points', message: 'Произвольная форма задана без точного контура. MVP считает по длине/ширине или соткам.' })
  }
  if (!objects.some((o) => o.type === 'water_point')) aiChecks.push({ level: 'warning', code: 'water_point_missing', message: 'Не указана точка подключения воды.' })
  if (pressure < sprinklerType.minPressureBar) aiChecks.push({ level: 'error', code: 'low_pressure', message: `Давление ${pressure} бар ниже рекомендуемого для ${sprinklerType.name}. Нужен насос или другие форсунки.` })
  if (flowZones > areaZones) aiChecks.push({ level: 'warning', code: 'low_flow', message: 'Расход воды ограничивает количество дождевателей в одной зоне. Система разделена на дополнительные зоны.' })
  if (noWaterArea > grossArea * 0.45) aiChecks.push({ level: 'warning', code: 'many_obstacles', message: 'Много препятствий/зон без полива. Специалист должен проверить сухие зоны вручную.' })
  if (sprinklersPerZone > 8) aiChecks.push({ level: 'warning', code: 'coverage_density', message: 'Высокая плотность дождевателей на зону. Возможны сухие зоны или лишнее перекрытие.' })
  if (!aiChecks.length) aiChecks.push({ level: 'ok', code: 'mvp_ok', message: 'MVP-проверка не нашла критичных проблем. Финальный расчёт подтверждает специалист.' })

  const zonesPlan = Array.from({ length: zones }, (_, i) => ({
    id: `zone-${i + 1}`,
    name: `Зона ${i + 1}`,
    sprinklers: sprinklers.filter((s) => s.zone === i + 1).length,
    flowM3h: Number((sprinklers.filter((s) => s.zone === i + 1).length * flowPerSprinkler).toFixed(2)),
    areaSqm: Math.round(lawnArea / zones),
  }))

  const drawing2D = {
    shape,
    length,
    width,
    grossArea: Math.round(grossArea),
    lawnArea,
    zones,
    objects,
    noWaterZones: noWaterObjects,
    waterPoint: objects.find((o) => o.type === 'water_point') || null,
    sprinklers: sprinklers.map((s) => ({ x: s.x, y: s.y, zone: s.zone, radiusM: sprinklerType.radiusM })),
  }

  return {
    shape,
    length,
    width,
    lotAreaSotka: Number((grossArea / 100).toFixed(2)),
    grossArea: Math.round(grossArea),
    area: lawnArea,
    lawnArea,
    noWaterArea: Math.round(noWaterArea),
    zones,
    zonesPlan,
    sprinklerType,
    sprinklers,
    pipes,
    valves,
    controller,
    filter,
    fittings,
    pump,
    materials: market,
    market,
    estimate: { lines, subtotal: total, gpCommission, total },
    drawing2D,
    aiChecks,
    pressure,
    flow,
  }
}
