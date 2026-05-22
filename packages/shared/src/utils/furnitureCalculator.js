/** Расчёт мебели на заказ (demo planner) */

import { FURNITURE_MATERIALS, FURNITURE_FACADES } from '../constants/serviceProjects.js'

export function calculateFurnitureProject(input) {
  const roomWidth = Math.max(1, Number(input.roomWidth) || 3)
  const roomHeight = Math.max(2, Number(input.roomHeight) || 2.7)
  const furnitureLength = Math.max(0.6, Number(input.furnitureLength) || 2.4)
  const furnitureDepth = Math.max(0.4, Number(input.furnitureDepth) || 0.6)

  const mat = FURNITURE_MATERIALS.find((m) => m.id === input.material) || FURNITURE_MATERIALS[0]
  const facade = FURNITURE_FACADES.find((f) => f.id === input.facadeMaterial) || FURNITURE_FACADES[0]

  const bodyArea = furnitureLength * furnitureDepth * 2 + furnitureLength * roomHeight * 0.3
  const facadeArea = furnitureLength * roomHeight * 0.85

  const modules = Math.max(2, Math.ceil(furnitureLength / 0.8))
  const parts = [
    { name: `Корпус ${mat.id.toUpperCase()}`, qty: Math.ceil(bodyArea), unit: 'м²', price: mat.pricePerM2 },
    { name: `Фасады ${facade.id}`, qty: Math.ceil(facadeArea), unit: 'м²', price: facade.pricePerM2 },
    { name: 'Столешница', qty: 1, unit: 'шт', price: Math.round(furnitureLength * 18000) },
  ]

  const hardware = [
    { name: 'Петли Blum', qty: modules * 3, price: 1200 },
    { name: 'Ручки', qty: modules, price: 2500 },
    { name: 'Направляющие', qty: modules * 2, price: 4500 },
  ]

  const lines = [
    ...parts.map((p) => ({ ...p, type: 'part' })),
    ...hardware.map((h) => ({ ...h, type: 'hardware' })),
    { name: 'Сборка и монтаж GP', qty: 1, price: Math.round(furnitureLength * 15000), type: 'labor' },
  ]

  const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const gpCommission = Math.round(total * 0.08)

  const drawing2D = {
    roomWidth,
    roomHeight,
    furnitureLength,
    furnitureDepth,
    modules: Array.from({ length: modules }, (_, i) => ({
      x: i * (furnitureLength / modules),
      w: furnitureLength / modules,
      h: furnitureDepth,
    })),
  }

  return {
    modules,
    parts,
    hardware,
    estimate: { lines, subtotal: total, gpCommission, total },
    drawing2D,
  }
}
