import { useEffect } from 'react'

/** GP Partner — всегда светлая тема (читаемый текст) */
export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('gp-partner-theme', 'light')
  }, [])

  return { dark: false, toggle: () => {} }
}
