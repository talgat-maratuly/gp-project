export default function PageHeader({ title, description }) {
  return (
    <header className="mb-4">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </header>
  )
}
