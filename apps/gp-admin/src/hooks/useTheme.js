import { useEffect, useState } from 'react'

const KEY = 'gp-theme'

export function initAdminTheme() {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem(KEY)
  const dark = saved === 'dark'
    || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0f1115' : '#f4f5f7')
  return dark
}

export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem(KEY, dark ? 'dark' : 'light')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#0f1115' : '#f4f5f7')
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d), setDark }
}
