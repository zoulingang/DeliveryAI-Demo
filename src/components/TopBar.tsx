import { useEffect, useRef, useState } from 'react'
import { Accessibility, Check, Coins, Crown, Languages, LayoutDashboard, MapPin, Monitor, Moon, PhoneCall, ReceiptText, Search, Sun, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { tableAreas } from '@/data/menu'
import type { Currency, ViewName } from '@/types'

interface TopBarProps {
  table: string
  view: ViewName
  serviceCount: number
  theme: 'light' | 'dark' | 'auto'
  resolvedTheme: 'light' | 'dark'
  language: string
  elderly: boolean
  currency: Currency
  onSetTheme: (theme: 'light' | 'dark' | 'auto') => void
  onToggleLanguage: () => void
  onToggleElderly: () => void
  onSetCurrency: (currency: Currency) => void
  onView: (view: ViewName) => void
  onService: () => void
  onConsole: () => void
}

export function TopBar({ table, view, serviceCount, theme, resolvedTheme, language, elderly, currency, onSetTheme, onToggleLanguage, onToggleElderly, onSetCurrency, onView, onService, onConsole }: TopBarProps) {
  const { t } = useTranslation()
  const areaKey = tableAreas[table]
  const tableLabel = areaKey ? `${table} · ${t(areaKey)}` : table

  return (
    <>
      <div className="bg-charcoal-900 px-4 py-2 text-center text-xs font-semibold tracking-wide text-rice-100 dark:bg-charcoal-700 dark:text-rice-200">
        {t('common.banner')}
      </div>
      <header className="sticky top-0 z-30 border-b border-charcoal-900/5 bg-rice-50/95 backdrop-blur-xl dark:border-white/5 dark:bg-charcoal-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-6">
          <button onClick={() => onView('menu')} className="flex items-center gap-2 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-chili-500 text-lg font-black text-white shadow-md">{t('common.brand')}</span>
            <span className="hidden sm:block"><strong className="block leading-4 text-charcoal-900 dark:text-rice-100">{t('common.brand_name')}</strong><small className="text-charcoal-500 dark:text-rice-200/60">{t('common.subtitle')}</small></span>
          </button>
          <span className="ml-1 flex items-center gap-1 rounded-full bg-rice-200 px-3 py-2 text-xs font-bold text-charcoal-700 dark:bg-charcoal-700 dark:text-rice-200"><MapPin size={13} className="text-chili-500" />{tableLabel}</span>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Button variant={view === 'menu' ? 'secondary' : 'ghost'} size="sm" onClick={() => onView('menu')}><Search size={16} />{t('common.nav_menu')}</Button>
            <Button variant={view === 'order' ? 'secondary' : 'ghost'} size="sm" onClick={() => onView('order')}><ReceiptText size={16} />{t('common.nav_order')}</Button>
          </nav>
          <Button variant="outline" size="icon" onClick={onService} className="relative" aria-label={t('common.aria_service')}>
            <PhoneCall size={18} />{serviceCount > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-chili-500 dark:border-charcoal-900" />}
          </Button>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline" size="icon" aria-label={t('common.aria_member')}><UserRound size={18} /></Button></DialogTrigger>
            <DialogContent title={t('common.member_title')}>
              <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal-900 to-charcoal-700 p-5 text-white shadow-card dark:from-charcoal-700 dark:to-charcoal-900">
                <div className="flex items-start justify-between"><span className="rounded-xl bg-amber-400 p-2 text-charcoal-900"><Crown /></span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t('common.member_badge')}</span></div>
                <p className="mt-6 text-sm text-rice-200">{t('common.member_name')}</p><p className="mt-1 text-2xl font-bold">2,680 <small className="text-sm font-medium text-rice-200">{t('common.growth_value')}</small></p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-charcoal-700"><p className="text-xs text-charcoal-500 dark:text-rice-200/60">{t('common.queue')}</p><p className="mt-2 text-2xl font-extrabold text-charcoal-900 dark:text-rice-100">A018</p><p className="text-xs text-chili-500">{t('common.queue_ahead')}</p></div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-charcoal-700"><p className="text-xs text-charcoal-500 dark:text-rice-200/60">{t('common.benefits')}</p><p className="mt-2 text-2xl font-extrabold text-charcoal-900 dark:text-rice-100">4 <small className="text-sm">{t('common.tickets')}</small></p><p className="text-xs text-amber-500">{t('common.coupon', { amount: currency === 'USD' ? '$4.29' : '¥30.00' })}</p></div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" onClick={onConsole} aria-label={t('common.aria_console')}><LayoutDashboard size={18} /></Button>
          <Button variant="outline" size="icon" onClick={onToggleElderly} aria-label={elderly ? '切换至常规模式' : '切换至老人模式'}>
            <Accessibility size={18} className={elderly ? 'text-chili-500' : ''} />
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleLanguage} aria-label={t('common.aria_lang')}>
            <Languages size={16} />{language === 'zh' ? 'EN' : '中'}
          </Button>
          <CurrencyMenu currency={currency} onSetCurrency={onSetCurrency} />
          <ThemeMenu theme={theme} resolvedTheme={resolvedTheme} onSetTheme={onSetTheme} />
        </div>
      </header>
    </>
  )
}

/* ─── 币种切换弹出菜单 ─── */

const currencyOptions: { value: Currency; symbol: string }[] = [
  { value: 'CNY', symbol: '¥' },
  { value: 'USD', symbol: '$' },
]

function CurrencyMenu({ currency, onSetCurrency }: { currency: Currency; onSetCurrency: (currency: Currency) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击菜单外部关闭菜单
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (value: Currency) => {
    onSetCurrency(value)
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="outline" size="icon" onClick={() => setOpen((prev) => !prev)} aria-label={t('common.aria_currency')}>
        <Coins size={18} />
        <span className="ml-0.5 text-xs font-bold">{currency === 'CNY' ? '¥' : '$'}</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-charcoal-900/5 bg-white p-1 shadow-float dark:border-white/10 dark:bg-charcoal-700">
          {currencyOptions.map(({ value, symbol }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${currency === value ? 'bg-chili-50 text-chili-600 dark:bg-chili-500/15 dark:text-chili-500' : 'text-charcoal-700 hover:bg-rice-100 dark:text-rice-200 dark:hover:bg-charcoal-900'}`}
            >
              <span className="text-base font-black">{symbol}</span>
              <span className="flex-1 text-left">{t(`common.currency_${value.toLowerCase()}`)}</span>
              {currency === value && <Check size={15} className="text-chili-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── 主题切换弹出菜单 ─── */

const themeOptions = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'auto', icon: Monitor },
] as const

function ThemeMenu({ theme, resolvedTheme, onSetTheme }: { theme: 'light' | 'dark' | 'auto'; resolvedTheme: 'light' | 'dark'; onSetTheme: (theme: 'light' | 'dark' | 'auto') => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击菜单外部关闭菜单
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (value: 'light' | 'dark' | 'auto') => {
    onSetTheme(value)
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="outline" size="icon" onClick={() => setOpen((prev) => !prev)} aria-label={t('common.aria_theme')}>
        {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-charcoal-900/5 bg-white p-1 shadow-float dark:border-white/10 dark:bg-charcoal-700">
          {themeOptions.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${theme === value ? 'bg-chili-50 text-chili-600 dark:bg-chili-500/15 dark:text-chili-500' : 'text-charcoal-700 hover:bg-rice-100 dark:text-rice-200 dark:hover:bg-charcoal-900'}`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{t(`common.theme_${value}`)}</span>
              {theme === value && <Check size={15} className="text-chili-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
