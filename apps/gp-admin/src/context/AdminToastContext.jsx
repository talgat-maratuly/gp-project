import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AdminToastContext = createContext(null)

export function AdminToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-[100] max-w-sm px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/40 text-red-100'
              : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
                : 'bg-slate-900/95 border-sky-500/40 text-slate-100'
          }`}
        >
          {toast.message}
        </div>
      )}
    </AdminToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext)
  if (!ctx) throw new Error('useAdminToast')
  return ctx
}
