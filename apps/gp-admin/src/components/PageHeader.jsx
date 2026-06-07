export default function PageHeader({ title, description }) {
  return (
    <header className="mb-4">
      <h1 className="text-xl font-bold admin-heading">{title}</h1>
      {description && <p className="text-sm admin-muted mt-1">{description}</p>}
    </header>
  )
}
