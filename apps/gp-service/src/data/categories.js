export const CATEGORIES = [
  { id: 'plants', name: 'Растения', icon: 'Leaf', color: 'from-emerald-500 to-green-600', description: 'Деревья, кустарники, многолетники' },
  { id: 'lawn', name: 'Газон', icon: 'Sprout', color: 'from-lime-500 to-emerald-600', description: 'Семена, рулонный газон, уход' },
  { id: 'irrigation', name: 'Автополив', icon: 'Droplets', color: 'from-sky-500 to-blue-600', description: 'Капельный полив, трубы, фитинги' },
  { id: 'hunter', name: 'Hunter', icon: 'Target', color: 'from-red-500 to-orange-600', description: 'Спринклеры и контроллеры Hunter' },
  { id: 'pumps', name: 'Насосы', icon: 'Gauge', color: 'from-cyan-500 to-teal-600', description: 'Погружные и поверхностные насосы' },
  { id: 'filters', name: 'Фильтры', icon: 'Filter', color: 'from-indigo-500 to-blue-600', description: 'Сетчатые, дисковые, песочные' },
  { id: 'fertilizers', name: 'Удобрения', icon: 'FlaskConical', color: 'from-amber-500 to-yellow-600', description: 'Минеральные и органические' },
  { id: 'lighting', name: 'Освещение', icon: 'Lightbulb', color: 'from-violet-500 to-purple-600', description: 'Ландшафтная подсветка LED' },
  { id: 'tools', name: 'Садовые инструменты', icon: 'Wrench', color: 'from-stone-500 to-slate-600', description: 'Секаторы, лопаты, тачки' },
  { id: 'consumables', name: 'Расходники', icon: 'Package', color: 'from-orange-500 to-amber-600', description: 'Шланги, скотч, крепёж' },
  { id: 'parts', name: 'Комплектующие', icon: 'Cog', color: 'from-slate-500 to-gray-600', description: 'Запчасти и аксессуары' },
]

export const getCategoryById = (id) => CATEGORIES.find((c) => c.id === id)

export const BRANDS = [
  'Hunter', 'Rain Bird', 'Grundfos', 'Gardena', 'Fiskars', 'GP', 'Philips', 'Karcher', 'Netafim', 'Irritrol',
]
