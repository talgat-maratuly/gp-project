export default function FurnitureDrawing2D({ drawing }) {
  if (!drawing) return null
  const W = 260
  const H = 160
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-600 mb-2">2D-планировка</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-white rounded-xl border">
        <rect x={8} y={8} width={W - 16} height={H - 16} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
        {(drawing.modules || []).map((m, i) => (
          <rect
            key={i}
            x={20 + m.x * 40}
            y={40}
            width={Math.max(30, m.w * 40)}
            height={m.h * 50}
            fill="#e2e8f0"
            stroke="#64748b"
          />
        ))}
      </svg>
    </div>
  )
}
