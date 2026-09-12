import { useCallback, useState } from 'react'
import type { Currency } from '@/types'

const STORAGE_KEY = 'currency'

/**
 * 币种状态管理 hook（CNY / USD 二态切换）。
 * 优先级：localStorage > 默认 CNY。
 * localStorage 不可用时降级为内存态，不报错不阻塞。
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return getInitialCurrency()
  })

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage 不可用时降级为内存态，不报错
    }
  }, [])

  return { currency, setCurrency }
}

function getInitialCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'CNY' || stored === 'USD') return stored
  } catch {
    // localStorage 不可用时降级为默认 CNY
  }
  return 'CNY'
}
