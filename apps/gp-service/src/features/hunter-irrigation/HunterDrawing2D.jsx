/** 2D-схема участка (GP-дизайн, не официальный Hunter) */
export default function HunterDrawing2D({ drawing, length = 10, width = 8 }) {
  const d = drawing || { length, width, sprinklers: [] }
  const W = 280
  const H = 180
  const scaleX = W / (d.length || length)
  const scaleY = H / (d.width || width)

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
      <p className="text-xs font-bold text-emerald-800 mb-2">2D-схема участка</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md mx-auto bg-white rounded-xl border border-emerald-100">
        <rect x={4} y={4} width={W - 8} height={H - 8} fill="#f0fdf4" stroke="#10b981" strokeWidth={2} rx={8} />
        {(d.sprinklers || []).map((s, i) => (
          <circle
            key={i}
            cx={4 + (s.x || 0) * scaleX}
            cy={4 + (s.y || 0) * scaleY}
            r={5}
            fill="#059669"
            opacity={0.85}
          />
        ))}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#047857">
          {d.length || length}×{d.width || width} м
        </text>
      </svg>
    </div>
  )
}
