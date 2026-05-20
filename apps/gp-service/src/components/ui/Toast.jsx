import { useEffect } from 'react'
import { useService } from '../../context/ServiceContext'

export default function ToastHost() {
  const { toast, clearToast } = useService()
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(clearToast, 2800)
    return () => clearTimeout(t)
  }, [toast, clearToast])
  if (!toast) return null
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm shadow-xl max-w-[90vw]">
      {toast.message}
    </div>
  )
}
