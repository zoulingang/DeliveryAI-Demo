import { test, expect, type Page } from '@playwright/test'

/**
 * 夜间模式（Dark Mode）E2E 验收测试
 *
 * 覆盖 Spec SPEC-DARK-MODE-001 的 REQ-001 ~ REQ-008：
 * - REQ-001: 三态主题模式切换（Light/Dark/Auto）+ 旧值兼容
 * - REQ-002: Auto 模式实时系统跟随 + 切出后停止跟随
 * - REQ-003: 主题切换弹出菜单交互（弹出/高亮/选择关闭/外部关闭/aria-label）
 * - REQ-004: 主题状态持久化与初始化（localStorage/首次使用）
 * - REQ-006: 夜间模式与老人模式共存
 * - REQ-008: 主题与多语言共存 + 英文菜单文案
 *
 * 使用 ?preview=menu 直接进入菜单视图（TopBar 含主题菜单可见），
 * 通过 page.emulateMedia 模拟系统 prefers-color-scheme，
 * 通过 page.addInitScript 在页面加载前设置 localStorage。
 */

/* ─── Helpers ─── */

/** 进入菜单视图（TopBar 中主题菜单可见）。可在加载前设置系统主题。 */
async function goToMenu(page: Page, systemColorScheme: 'dark' | 'light' = 'light') {
  await page.emulateMedia({ colorScheme: systemColorScheme })
  await page.goto('/?preview=menu')
}

/** 打开主题切换弹出菜单。 */
async function openThemeMenu(page: Page, lang: 'zh' | 'en' = 'zh') {
  const label = lang === 'zh' ? '切换主题' : 'Switch theme'
  await page.getByRole('button', { name: label }).click()
}

/** 获取 html 元素是否包含指定 class。 */
async function hasHtmlClass(page: Page, className: string): Promise<boolean> {
  return page.evaluate((cls) => document.documentElement.classList.contains(cls), className)
}

/** 获取 localStorage 中 theme 的值。 */
async function getStoredTheme(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('theme'))
}

/** 获取 localStorage 中 i18nextLng 的值。 */
async function getStoredLang(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('i18nextLng'))
}

/* ─── Tests ─── */

test.describe('夜间模式 - E2E 验收测试', () => {

  /* ─── REQ-001: 三态主题模式切换 ─── */

  test.describe('REQ-001: 三态主题模式切换', () => {
    test('REQ-001.2: 选择浅色模式 → 移除 dark class, localStorage=light', async ({ page }) => {
      await goToMenu(page, 'dark')
      // 系统深色 + 首次默认 Auto → 页面为深色
      await expect(page.locator('html')).toHaveClass(/dark/)
      await openThemeMenu(page)
      await page.getByRole('button', { name: '浅色模式' }).click()
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      expect(await getStoredTheme(page)).toBe('light')
    })

    test('REQ-001.3: 选择深色模式 → 添加 dark class, localStorage=dark', async ({ page }) => {
      await goToMenu(page, 'light')
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
      expect(await getStoredTheme(page)).toBe('dark')
    })

    test('REQ-001.4: 选择自动模式 (系统深色) → localStorage=auto, dark class 存在', async ({ page }) => {
      // 先设置为浅色（显式），再切到 Auto，系统为深色
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await goToMenu(page, 'dark')
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      await openThemeMenu(page)
      await page.getByRole('button', { name: '跟随系统' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
      expect(await getStoredTheme(page)).toBe('auto')
    })

    test('REQ-001.6: 旧 localStorage "dark" 值向后兼容', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
      await goToMenu(page, 'light')
      // 旧值 "dark" 应正常识别并应用
      await expect(page.locator('html')).toHaveClass(/dark/)
    })

    test('REQ-001.6: 旧 localStorage "light" 值向后兼容', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await goToMenu(page, 'dark')
      // 旧值 "light" 应正常识别并应用，不跟随系统
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    })
  })

  /* ─── REQ-002: Auto 模式实时系统跟随 ─── */

  test.describe('REQ-002: Auto 模式实时系统跟随', () => {
    test('REQ-002.1: Auto 模式下系统从浅色切换到深色 → 即时跟随', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'auto'))
      await goToMenu(page, 'light')
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      // 模拟系统切换为深色
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect(page.locator('html')).toHaveClass(/dark/)
    })

    test('REQ-002.1: Auto 模式下系统从深色切换到浅色 → 即时跟随', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'auto'))
      await goToMenu(page, 'dark')
      await expect(page.locator('html')).toHaveClass(/dark/)
      // 模拟系统切换为浅色
      await page.emulateMedia({ colorScheme: 'light' })
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    })

    test('REQ-002.2: 从 Auto 切换到 Light 后不再跟随系统', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'auto'))
      await goToMenu(page, 'light')
      // 显式切换到 Light
      await openThemeMenu(page)
      await page.getByRole('button', { name: '浅色模式' }).click()
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      // 系统切换为深色，不应跟随
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    })

    test('REQ-002.3: 从 Light 切换到 Auto 后立即跟随系统', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await goToMenu(page, 'dark')
      // 初始为 Light（显式），系统为深色
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      // 切换到 Auto
      await openThemeMenu(page)
      await page.getByRole('button', { name: '跟随系统' }).click()
      // 应立即跟随系统（深色）
      await expect(page.locator('html')).toHaveClass(/dark/)
    })
  })

  /* ─── REQ-003: 主题切换弹出菜单交互 ─── */

  test.describe('REQ-003: 主题切换弹出菜单交互', () => {
    test('REQ-003.1: 主题图标根据渲染主题显示 (浅色=Moon, 深色=Sun)', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await goToMenu(page, 'light')
      // 浅色模式 → Moon 图标
      const themeBtn = page.getByRole('button', { name: '切换主题' })
      let iconClass = await themeBtn.locator('svg').getAttribute('class')
      expect(iconClass).toContain('moon')
      // 切换到深色
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      // 深色模式 → Sun 图标
      iconClass = await themeBtn.locator('svg').getAttribute('class')
      expect(iconClass).toContain('sun')
    })

    test('REQ-003.2/003.3: 点击图标弹出三选项菜单, 当前模式高亮', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await goToMenu(page, 'light')
      await openThemeMenu(page)
      // 三个选项可见
      await expect(page.getByRole('button', { name: '浅色模式' })).toBeVisible()
      await expect(page.getByRole('button', { name: '深色模式' })).toBeVisible()
      await expect(page.getByRole('button', { name: '跟随系统' })).toBeVisible()
      // 当前模式 (light) 高亮
      await expect(page.getByRole('button', { name: '浅色模式' })).toHaveClass(/bg-chili-50/)
      await expect(page.getByRole('button', { name: '深色模式' })).not.toHaveClass(/bg-chili-50/)
      await expect(page.getByRole('button', { name: '跟随系统' })).not.toHaveClass(/bg-chili-50/)
    })

    test('REQ-003.4: 选择选项后菜单关闭并应用主题', async ({ page }) => {
      await goToMenu(page, 'light')
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      // 菜单关闭
      await expect(page.getByRole('button', { name: '浅色模式' })).not.toBeVisible()
      // 主题已应用
      await expect(page.locator('html')).toHaveClass(/dark/)
    })

    test('REQ-003.5: 菜单外点击关闭菜单但不改变主题', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'light'))
      await goToMenu(page, 'light')
      await openThemeMenu(page)
      // 确认菜单已打开
      await expect(page.getByRole('button', { name: '浅色模式' })).toBeVisible()
      // 点击菜单外部区域（banner 文字区域）
      await page.getByText('概念演示 / 非官方').first().click()
      // 菜单关闭
      await expect(page.getByRole('button', { name: '浅色模式' })).not.toBeVisible()
      // 主题保持浅色不变
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      expect(await getStoredTheme(page)).toBe('light')
    })

    test('REQ-003.6: 主题切换按钮有 aria-label', async ({ page }) => {
      await goToMenu(page, 'light')
      const themeBtn = page.getByRole('button', { name: '切换主题' })
      await expect(themeBtn).toBeVisible()
      await expect(themeBtn).toHaveAttribute('aria-label', '切换主题')
    })
  })

  /* ─── REQ-004: 主题状态持久化与初始化 ─── */

  test.describe('REQ-004: 主题状态持久化与初始化', () => {
    test('REQ-004.1: 主题选择持久化到 localStorage 并在重载后恢复', async ({ page }) => {
      await goToMenu(page, 'light')
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      expect(await getStoredTheme(page)).toBe('dark')
      // 刷新页面验证持久化
      await page.reload()
      await expect(page.locator('html')).toHaveClass(/dark/)
      expect(await getStoredTheme(page)).toBe('dark')
    })

    test('REQ-004.3: localStorage=auto + 系统深色 → 初始化为深色', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'auto'))
      await goToMenu(page, 'dark')
      await expect(page.locator('html')).toHaveClass(/dark/)
    })

    test('REQ-004.3: localStorage=auto + 系统浅色 → 初始化为浅色', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('theme', 'auto'))
      await goToMenu(page, 'light')
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    })

    test('REQ-004.4: 首次使用无 localStorage → 默认跟随系统 (深色)', async ({ page }) => {
      // 不设置 localStorage，首次使用
      await goToMenu(page, 'dark')
      // 默认 Auto，跟随系统 → 深色
      await expect(page.locator('html')).toHaveClass(/dark/)
      // theme 键未被写入 localStorage（useTheme 不在初始化时写入）
      expect(await getStoredTheme(page)).toBeNull()
    })

    test('REQ-004.4: 首次使用无 localStorage → 默认跟随系统 (浅色)', async ({ page }) => {
      await goToMenu(page, 'light')
      await expect(page.locator('html')).not.toHaveClass(/dark/)
    })
  })

  /* ─── REQ-006: 夜间模式与老人模式共存 ─── */

  test.describe('REQ-006: 夜间模式与老人模式共存', () => {
    test('REQ-006.1/006.2: dark 和 elderly class 可同时存在', async ({ page }) => {
      await goToMenu(page, 'light')
      // 启用深色模式
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
      // 启用老人模式
      await page.getByRole('button', { name: '切换至老人模式' }).click()
      // 两者同时存在
      await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(page.locator('html')).toHaveClass(/elderly/)
      expect(await hasHtmlClass(page, 'dark')).toBe(true)
      expect(await hasHtmlClass(page, 'elderly')).toBe(true)
    })

    test('REQ-006.1: 关闭深色模式后老人模式仍保持', async ({ page }) => {
      await goToMenu(page, 'light')
      // 启用老人模式
      await page.getByRole('button', { name: '切换至老人模式' }).click()
      await expect(page.locator('html')).toHaveClass(/elderly/)
      // 启用深色模式
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(page.locator('html')).toHaveClass(/elderly/)
      // 关闭深色模式
      await openThemeMenu(page)
      await page.getByRole('button', { name: '浅色模式' }).click()
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      // 老人模式保持
      await expect(page.locator('html')).toHaveClass(/elderly/)
    })
  })

  /* ─── REQ-008: 主题与多语言共存 ─── */

  test.describe('REQ-008: 主题与多语言共存', () => {
    test('REQ-008.1/008.2: 切换语言不影响主题, 切换主题不影响语言', async ({ page }) => {
      await goToMenu(page, 'light')
      // 设置深色主题
      await openThemeMenu(page)
      await page.getByRole('button', { name: '深色模式' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
      // 切换语言（中文 → 英文）
      await page.getByRole('button', { name: '切换语言' }).click()
      // 主题仍为深色
      await expect(page.locator('html')).toHaveClass(/dark/)
      // 验证语言已切换为英文
      expect(await getStoredLang(page)).toBe('en')
      // 切换主题（深色 → 浅色）使用英文菜单
      await openThemeMenu(page, 'en')
      await page.getByRole('button', { name: 'Light' }).click()
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      // 语言仍为英文
      expect(await getStoredLang(page)).toBe('en')
    })

    test('REQ-008.3: 英文模式下主题菜单文案正确', async ({ page }) => {
      await goToMenu(page, 'light')
      // 切换为英文
      await page.getByRole('button', { name: '切换语言' }).click()
      // 打开主题菜单
      await openThemeMenu(page, 'en')
      // 验证英文文案
      await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Auto' })).toBeVisible()
      // aria-label 为英文
      const themeBtn = page.getByRole('button', { name: 'Switch theme' })
      await expect(themeBtn).toHaveAttribute('aria-label', 'Switch theme')
    })
  })
})
