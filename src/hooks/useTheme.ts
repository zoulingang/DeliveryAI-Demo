import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'auto'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * 主题状态管理 hook（三态：light / dark / auto）。
 * - light/dark：用户显式选择，固定渲染对应主题
 * - auto：跟随系统 prefers-color-scheme，实时监听变化
 *
 * 优先级：localStorage > prefers-color-scheme > 默认 auto（跟随系统）。
 * localStorage 不可用时降级为内存态，不报错不阻塞。
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = getInitialTheme()
    applyTheme(initial)
    return initial
  })

  // 根据系统偏好解析 auto 模式的实际渲染主题
  const systemDark = usePrefersDark()

  // 当前实际渲染主题
  const resolvedTheme: ResolvedTheme = theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme

  // 当 theme 或系统偏好变化时，同步 DOM class
  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage 不可用时降级为内存态，不报错
    }
  }, [])

  return { theme, resolvedTheme, setTheme }
}

/**
 * 监听系统 prefers-color-scheme 变化，返回当前系统是否为深色。
 * 浏览器不支持 matchMedia 时始终返回 false（降级为浅色）。
 */
function usePrefersDark(): boolean {
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark())

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  return systemDark
}

function getSystemDark(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  } catch {
    // localStorage 不可用时降级为系统偏好
  }
  // 首次使用（无 localStorage 值）默认跟随系统
  return 'auto'
}

/** 仅在 hook 初始化时同步调用，用于 FOUC 防闪 */
function applyTheme(theme: Theme) {
  const resolved = theme === 'auto' ? (getSystemDark() ? 'dark' : 'light') : theme
  applyResolvedTheme(resolved)
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
