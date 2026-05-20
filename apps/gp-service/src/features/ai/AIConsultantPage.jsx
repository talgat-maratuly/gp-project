import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { useService } from '../../context/ServiceContext'
import Button from '../../components/ui/Button'
import ProductCard from '../shop/ProductCard'

const STARTERS = [
  'Автополив на 8 соток',
  'Насос для скважины',
  'Спринклеры Hunter',
  'Удобрения для хвойных',
]

export default function AIConsultantPage() {
  const { products } = useService()
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Здравствуйте! Я AI-консультант GP. Помогу с товарами и услугами для сада и автополива.' },
  ])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const send = (text) => {
    const msg = text.trim()
    if (!msg) return
    setMessages((m) => [...m, { role: 'user', text: msg }])
    setInput('')
    setTimeout(() => {
      const prods = products.filter((p) => p.name.toLowerCase().includes(msg.split(' ')[0]?.toLowerCase() || '') || p.popularity > 85).slice(0, 2)
      setSuggestions(prods.length ? prods : products.slice(0, 2))
      setMessages((m) => [...m, { role: 'bot', text: `Рекомендую обратить внимание на ${prods[0]?.name || 'каталог GP Shop'}. Могу подобрать комплект под ваш участок.` }])
    }, 500)
  }

  return (
    <div className="px-4 py-4 flex flex-col min-h-[70vh]">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Bot className="text-gp-green-600" /> AI-консультант</h1>
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'ml-auto bg-gp-blue-600 text-white' : 'bg-white border'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {STARTERS.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full bg-gp-green-50 text-gp-green-800">{q}</button>
        ))}
      </div>
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">{suggestions.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ваш вопрос…" className="flex-1 px-4 py-3 rounded-2xl border" />
        <Button type="submit"><Send className="w-5 h-5" /></Button>
      </form>
    </div>
  )
}
