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
              ? 'border-red-300 bg-red-50 text-red-800 dark:bg-red-950/95 dark:border-red-500/40 dark:text-red-100'
              : toast.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/95 dark:border-emerald-500/40 dark:text-emerald-100'
                : 'border-sky-300 bg-sky-50 text-sky-900 dark:bg-slate-900/95 dark:border-sky-500/40 dark:text-slate-100'
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
