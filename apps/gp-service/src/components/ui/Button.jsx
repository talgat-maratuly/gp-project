const v = {
  primary: 'gp-gradient text-white shadow-md active:scale-[0.98]',
  secondary: 'bg-white text-gp-blue-700 border border-slate-200 active:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  kaspi: 'bg-[#f14635] text-white shadow-md active:scale-[0.98]',
  outline: 'border-2 border-gp-green-600 text-gp-green-700',
}
const s = { sm: 'px-3 py-2 text-sm rounded-xl', md: 'px-5 py-2.5 text-sm rounded-xl', lg: 'px-6 py-3.5 text-base rounded-2xl' }

export default function Button({ children, variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button type={type} className={`inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50 ${v[variant]} ${s[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
