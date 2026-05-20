import { useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { useService } from '../../context/ServiceContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function ObjectsPage() {
  const { objects, setObjects } = useService()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', area: '' })

  const add = (e) => {
    e.preventDefault()
    if (!form.name) return
    setObjects([...objects, { id: `obj-${Date.now()}`, type: 'house', ...form, area: Number(form.area) || 0 }])
    setForm({ name: '', address: '', area: '' })
    setAdding(false)
  }

  return (
    <div className="px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои адреса</h1>
        <Button size="sm" onClick={() => setAdding(!adding)} aria-label="Добавить адрес"><Plus className="w-4 h-4" /></Button>
      </div>

      {adding && (
        <form onSubmit={add} className="gp-card p-4 mb-4 space-y-3">
          <Input label="Как назвать (дом, дача…)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Площадь, соток" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          <Button type="submit" className="w-full">Сохранить</Button>
        </form>
      )}

      <ul className="space-y-3">
        {objects.map((o) => (
          <li key={o.id} className="gp-card p-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gp-green-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-gp-green-600" />
            </div>
            <div>
              <p className="font-semibold">{o.name}</p>
              <p className="text-sm text-slate-500">{o.address}</p>
              {o.area > 0 && <p className="text-xs text-gp-green-600 mt-1">{o.area} соток</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
