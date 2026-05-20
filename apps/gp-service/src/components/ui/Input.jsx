export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>}
      <input className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-gp-blue-500/30 ${error ? 'border-red-400' : 'border-slate-200'} ${className}`} {...props} />
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </label>
  )
}
