import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * 主题状态管理 hook。
 * 优先级：localStorage > prefers-color-scheme > 默认浅色。
 * localStorage 不可用时降级为内存态，不报错不阻塞。
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme()
    applyTheme(initial)
    return initial
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage 不可用时降级为内存态，不报错
      }
      return next
    })
  }, [])

  return { theme, toggle }
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') return 'dark'
    if (stored === 'light') return 'light'
  } catch {
    // localStorage 不可用时降级为系统偏好
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
