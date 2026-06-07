/** 2D-схема участка для MVP расчёта автополива Hunter. */
const OBJECT_COLORS = {
  house: '#334155',
  tree: '#15803d',
  flowerbed: '#db2777',
  lawn: '#65a30d',
  path: '#a8a29e',
  no_water: '#dc2626',
  water_point: '#0284c7',
}

function shapeElement(shape, W, H) {
  const fill = '#f0fdf4'
  const stroke = '#10b981'
  if (shape === 'circle') return <circle cx={W / 2} cy={H / 2} r={Math.min(W, H) / 2 - 8} fill={fill} stroke={stroke} strokeWidth={2} />
  if (shape === 'oval') return <ellipse cx={W / 2} cy={H / 2} rx={W / 2 - 8} ry={H / 2 - 8} fill={fill} stroke={stroke} strokeWidth={2} />
  if (shape === 'triangle') return <polygon points={`${W / 2},8 ${W - 8},${H - 8} 8,${H - 8}`} fill={fill} stroke={stroke} strokeWidth={2} />
  if (shape === 'custom') return <path d={`M 16 24 C ${W * 0.2} 4, ${W * 0.65} 10, ${W - 18} 34 L ${W - 10} ${H - 36} C ${W * 0.6} ${H - 4}, ${W * 0.25} ${H - 18}, 16 ${H - 10} Z`} fill={fill} stroke={stroke} strokeWidth={2} />
  return <rect x={4} y={4} width={W - 8} height={H - 8} fill={fill} stroke={stroke} strokeWidth={2} rx={shape === 'square' ? 4 : 10} />
}

export default function HunterDrawing2D({ drawing, length = 10, width = 8, editable = false, activeObjectType = 'tree', onAddObject }) {
  const d = drawing || { length, width, shape: 'rectangle', sprinklers: [], objects: [] }
  const W = 320
  const H = 220
  const scaleX = W / (d.length || length)
  const scaleY = H / (d.width || width)

  const handleClick = (e) => {
    if (!editable || !onAddObject) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onAddObject({ type: activeObjectType, x: Math.round(x), y: Math.round(y) })
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-bold text-emerald-800">2D-схема участка</p>
        {editable && <p className="text-[11px] text-emerald-700">Нажмите на план, чтобы добавить объект</p>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} onClick={handleClick} className={`w-full max-w-md mx-auto bg-white rounded-xl border border-emerald-100 ${editable ? 'cursor-crosshair' : ''}`}>
        {shapeElement(d.shape, W, H)}
        {(d.sprinklers || []).map((s, i) => {
          const cx = 4 + (s.x || 0) * scaleX
          const cy = 4 + (s.y || 0) * scaleY
          const r = Math.max(14, (s.radiusM || 4) * Math.min(scaleX, scaleY))
          return (
            <g key={`spr-${i}`}>
              <circle cx={cx} cy={cy} r={r} fill="#38bdf8" opacity={0.12} stroke="#0284c7" strokeWidth={0.6} />
              <circle cx={cx} cy={cy} r={4.5} fill="#059669" opacity={0.9} />
              <text x={cx + 6} y={cy - 4} fontSize={8} fill="#047857">Z{s.zone}</text>
            </g>
          )
        })}
        {(d.objects || []).map((o, i) => {
          const cx = (o.x || 50) * W / 100
          const cy = (o.y || 50) * H / 100
          const color = OBJECT_COLORS[o.type] || '#475569'
          if (o.type === 'tree' || o.type === 'water_point') {
            return <circle key={o.id || i} cx={cx} cy={cy} r={o.type === 'water_point' ? 7 : 9} fill={color} opacity={0.9} />
          }
          return (
            <rect
              key={o.id || i}
              x={cx - (o.width || 12) / 2}
              y={cy - (o.height || 10) / 2}
              width={o.width || 12}
              height={o.height || 10}
              fill={color}
              opacity={o.type === 'no_water' ? 0.25 : 0.55}
              stroke={color}
              rx={3}
            />
          )
        })}
        <text x={W / 2} y={H - 7} textAnchor="middle" fontSize={10} fill="#047857">
          {d.grossArea || Math.round((d.length || length) * (d.width || width))} м² · газон {d.lawnArea || d.area || 0} м² · {d.zones || 1} зон
        </text>
      </svg>
    </div>
  )
}
