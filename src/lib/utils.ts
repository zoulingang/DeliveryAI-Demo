import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Currency } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 按币种格式化金额。
 * - CNY：直接显示原始值，符号 ¥，格式 ¥X.XX
 * - USD：按固定汇率 1 USD = 7 CNY 换算（CNY / 7），符号 $，格式 $X.XX
 */
export const money = (value: number, currency: Currency = 'CNY') => {
  if (currency === 'USD') {
    return `$${(value / 7).toFixed(2)}`
  }
  return `¥${value.toFixed(2)}`
}
