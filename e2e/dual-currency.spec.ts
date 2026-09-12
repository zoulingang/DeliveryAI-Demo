import { test, expect, type Page } from '@playwright/test'

/**
 * 双币种价格展示与切换 E2E 验收测试
 *
 * 覆盖 Spec SPEC-DUAL-CURRENCY-001 的 REQ-001 ~ REQ-007：
 * - REQ-001: money() 函数双币种格式化与换算（¥/$ 符号、零值）
 * - REQ-002: 全站价格项同步切换（菜单/购物车/订单/结账/底部栏）
 * - REQ-003: 换算精度规则（1 USD = 7 CNY，两位小数四舍五入）
 * - REQ-004: 折扣规则展示层换算（底层数据 CNY，展示层换算）
 * - REQ-005: 优惠券文案金额换算
 * - REQ-006: 币种切换入口交互（弹出菜单/高亮/关闭/aria-label）
 * - REQ-007: 币种状态管理与持久化（localStorage/降级/独立键）
 *
 * 使用 ?preview=menu 直接进入菜单视图（TopBar 含币种切换菜单可见），
 * 通过 page.addInitScript 在页面加载前设置 localStorage。
 */

/* ─── Helpers ─── */

/** 进入菜单视图（TopBar 中币种切换菜单可见）。 */
async function goToMenu(page: Page) {
  await page.goto('/?preview=menu')
  await page.waitForLoadState('networkidle')
}

/** 打开币种切换弹出菜单。 */
async function openCurrencyMenu(page: Page, lang: 'zh' | 'en' = 'zh') {
  const label = lang === 'zh' ? '切换币种' : 'Switch currency'
  await page.getByRole('button', { name: label }).click()
}

/** 选择目标币种（自动打开菜单并选择）。 */
async function selectCurrency(page: Page, currency: 'CNY' | 'USD', lang: 'zh' | 'en' = 'zh') {
  await openCurrencyMenu(page, lang)
  const optionRegex = currency === 'CNY'
    ? new RegExp(lang === 'zh' ? '人民币' : 'CNY')
    : new RegExp(lang === 'zh' ? '美元' : 'USD')
  await page.getByRole('button', { name: optionRegex }).click()
}

/** 获取 localStorage 中 currency 的值。 */
async function getStoredCurrency(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('currency'))
}

/** 提交订单并进入订单视图。 */
async function submitOrder(page: Page, lang: 'zh' | 'en' = 'zh') {
  const label = lang === 'zh' ? '确认并提交订单' : 'Confirm & Submit Order'
  await page.getByRole('button', { name: label }).click()
}

/** 进入结账视图。 */
async function goToCheckout(page: Page, lang: 'zh' | 'en' = 'zh') {
  const label = lang === 'zh' ? '去结账' : 'Checkout'
  await page.getByRole('button', { name: label }).click()
}

/* ─── Tests ─── */

test.describe('双币种价格展示与切换 - E2E 验收测试', () => {

  /* ─── REQ-001: money() 函数双币种格式化与换算 ─── */

  test.describe('REQ-001: money() 函数双币种格式化与换算', () => {
    test('REQ-001.2: CNY 模式下价格展示 ¥ 符号和原始金额', async ({ page }) => {
      await goToMenu(page)
      // 默认 CNY，商品 p1 价格 68 → ¥68.00
      await expect(page.locator('article').first()).toContainText('¥68.00')
    })

    test('REQ-001.3: USD 模式下价格展示 $ 符号和换算金额', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      // p1 价格 68 CNY → 68/7 = 9.71 → $9.71
      await expect(page.locator('article').first()).toContainText('$9.71')
    })

    test('REQ-001.4: USD 模式下零值展示 $0.00', async ({ page }) => {
      // 预览购物车含 1 件 p3(42)，42 < 100 → discount=0 → $0.00
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      await submitOrder(page)
      await goToCheckout(page)
      await expect(page.getByText('$0.00')).toBeVisible()
    })
  })

  /* ─── REQ-002: 全站价格项同步切换 ─── */

  test.describe('REQ-002: 全站价格项同步切换', () => {
    test('REQ-002.1: 切换到 USD 后菜单价格即时更新', async ({ page }) => {
      await goToMenu(page)
      await expect(page.locator('article').first()).toContainText('¥68.00')
      await selectCurrency(page, 'USD')
      await expect(page.locator('article').first()).toContainText('$9.71')
    })

    test('REQ-002.2: 切换到 USD 后购物车面板价格同步更新', async ({ page }) => {
      await goToMenu(page)
      // 预览购物车含 p3(42)，小计/预估 ¥42.00
      await expect(page.getByText('¥42.00').first()).toBeVisible()
      await selectCurrency(page, 'USD')
      // 42/7 = 6.00 → $6.00
      await expect(page.getByText('$6.00').first()).toBeVisible()
    })

    test('REQ-002.3: 切换到 USD 后订单视图价格同步更新', async ({ page }) => {
      await goToMenu(page)
      await submitOrder(page)
      // 订单视图总价 42 → ¥42.00
      await expect(page.getByText('¥42.00').first()).toBeVisible()
      await selectCurrency(page, 'USD')
      await expect(page.getByText('$6.00').first()).toBeVisible()
    })

    test('REQ-002.4: 切换到 USD 后结账视图价格同步更新', async ({ page }) => {
      await goToMenu(page)
      await submitOrder(page)
      await goToCheckout(page)
      // subtotal=42, discount=0, payable=42
      await expect(page.getByText('¥42.00').first()).toBeVisible()
      await selectCurrency(page, 'USD')
      await expect(page.getByText('$6.00').first()).toBeVisible()
    })

    test('REQ-002.5: 切换回 CNY 后全站价格恢复', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      await expect(page.locator('article').first()).toContainText('$9.71')
      await selectCurrency(page, 'CNY')
      await expect(page.locator('article').first()).toContainText('¥68.00')
    })
  })

  /* ─── REQ-003: 换算精度规则 ─── */

  test.describe('REQ-003: 换算精度规则', () => {
    test('REQ-003.1: ¥68 → $9.71（68/7=9.714…，四舍五入）', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      await expect(page.locator('article').first()).toContainText('$9.71')
    })

    test('REQ-003.2: ¥42 → $6.00（42/7=6.00，精确）', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      // 预览购物车 p3(42) → $6.00
      await expect(page.getByText('$6.00').first()).toBeVisible()
    })

    test('REQ-003.3: ¥59 → $8.43（59/7=8.4286…，四舍五入）', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      // p2 价格 59 → 59/7 = 8.4286… → $8.43
      await expect(page.locator('article').nth(1)).toContainText('$8.43')
    })

    test('REQ-003.4: 切换回 CNY 时恢复原始金额，无精度损失', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      await expect(page.locator('article').first()).toContainText('$9.71')
      await selectCurrency(page, 'CNY')
      await expect(page.locator('article').first()).toContainText('¥68.00')
    })
  })

  /* ─── REQ-004: 折扣规则展示层换算 ─── */

  test.describe('REQ-004: 折扣规则展示层换算', () => {
    test('REQ-004.1: CNY 模式下折扣门槛触发 → 减 ¥30.00', async ({ page }) => {
      await goToMenu(page)
      // 预览购物车含 p3(42)，增加数量到 3 → 42×3 = 126 ≥ 100
      await page.getByRole('button', { name: '增加' }).click()
      await page.getByRole('button', { name: '增加' }).click()
      await submitOrder(page)
      await goToCheckout(page)
      // subtotal=126, discount=30, payable=96
      await expect(page.getByText('¥126.00').first()).toBeVisible()
      await expect(page.getByText('-¥30.00')).toBeVisible()
      await expect(page.getByText('¥96.00').first()).toBeVisible()
    })

    test('REQ-004.2: USD 模式下折扣门槛和优惠金额换算显示', async ({ page }) => {
      await goToMenu(page)
      await page.getByRole('button', { name: '增加' }).click()
      await page.getByRole('button', { name: '增加' }).click()
      await selectCurrency(page, 'USD')
      await submitOrder(page)
      await goToCheckout(page)
      // subtotal=126/7=18.00, discount=30/7=4.29, payable=96/7=13.71
      await expect(page.getByText('$18.00').first()).toBeVisible()
      await expect(page.getByText('-$4.29')).toBeVisible()
      await expect(page.getByText('$13.71').first()).toBeVisible()
    })

    test('REQ-004.3: 底层折扣判断始终以 CNY 为准（42 < 100 无折扣）', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      await submitOrder(page)
      await goToCheckout(page)
      // 42 < 100 → discount=0 → $0.00
      await expect(page.getByText('$0.00')).toBeVisible()
    })

    test('REQ-004.4: 切换回 CNY 后折扣恢复原始金额', async ({ page }) => {
      await goToMenu(page)
      await page.getByRole('button', { name: '增加' }).click()
      await page.getByRole('button', { name: '增加' }).click()
      await selectCurrency(page, 'USD')
      await submitOrder(page)
      await goToCheckout(page)
      await expect(page.getByText('-$4.29')).toBeVisible()
      // 切换回 CNY
      await selectCurrency(page, 'CNY')
      await expect(page.getByText('-¥30.00')).toBeVisible()
      await expect(page.getByText('¥96.00').first()).toBeVisible()
    })
  })

  /* ─── REQ-005: 优惠券文案金额换算 ─── */

  test.describe('REQ-005: 优惠券文案金额换算', () => {
    test('REQ-005.1: CNY 模式下优惠券文案显示 ¥30.00', async ({ page }) => {
      await goToMenu(page)
      // 打开会员弹窗
      await page.getByRole('button', { name: '会员与排号' }).click()
      await expect(page.getByText('含 ¥30.00 菜品券')).toBeVisible()
    })

    test('REQ-005.2: USD 模式下优惠券文案显示 $4.29', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      // 打开会员弹窗
      await page.getByRole('button', { name: '会员与排号' }).click()
      await expect(page.getByText('含 $4.29 菜品券')).toBeVisible()
    })
  })

  /* ─── REQ-006: 币种切换入口交互 ─── */

  test.describe('REQ-006: 币种切换入口交互', () => {
    test('REQ-006.1: TopBar 中有币种切换入口，aria-label 为「切换币种」', async ({ page }) => {
      await goToMenu(page)
      const currencyBtn = page.getByRole('button', { name: '切换币种' })
      await expect(currencyBtn).toBeVisible()
      await expect(currencyBtn).toHaveAttribute('aria-label', '切换币种')
    })

    test('REQ-006.2: 点击弹出 CNY 和 USD 两个选项', async ({ page }) => {
      await goToMenu(page)
      await openCurrencyMenu(page)
      await expect(page.getByRole('button', { name: /人民币/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /美元/ })).toBeVisible()
    })

    test('REQ-006.3: 当前币种在选项中高亮标识', async ({ page }) => {
      await goToMenu(page)
      await openCurrencyMenu(page)
      // 默认 CNY 高亮
      const cnyBtn = page.getByRole('button', { name: /人民币/ })
      const usdBtn = page.getByRole('button', { name: /美元/ })
      await expect(cnyBtn).toHaveClass(/bg-chili-50/)
      await expect(usdBtn).not.toHaveClass(/bg-chili-50/)
    })

    test('REQ-006.4: 选择 USD 后立即切换', async ({ page }) => {
      await goToMenu(page)
      await openCurrencyMenu(page)
      await page.getByRole('button', { name: /美元/ }).click()
      // 菜单价格更新为 USD
      await expect(page.locator('article').first()).toContainText('$9.71')
    })

    test('REQ-006.5: 选择选项后菜单关闭', async ({ page }) => {
      await goToMenu(page)
      await openCurrencyMenu(page)
      await page.getByRole('button', { name: /美元/ }).click()
      await expect(page.getByRole('button', { name: /人民币/ })).not.toBeVisible()
    })

    test('REQ-006.6: 菜单外点击关闭菜单但不改变币种', async ({ page }) => {
      await goToMenu(page)
      await openCurrencyMenu(page)
      await expect(page.getByRole('button', { name: /人民币/ })).toBeVisible()
      // 点击菜单外部（banner 区域）
      await page.getByText('概念演示 / 非官方').first().click()
      // 菜单关闭
      await expect(page.getByRole('button', { name: /人民币/ })).not.toBeVisible()
      // 币种保持默认 CNY
      await expect(page.locator('article').first()).toContainText('¥68.00')
    })

    test('REQ-006.7: 币种按钮显示当前币种符号', async ({ page }) => {
      await goToMenu(page)
      const currencyBtn = page.getByRole('button', { name: '切换币种' })
      // CNY → 显示 ¥
      await expect(currencyBtn).toContainText('¥')
      await selectCurrency(page, 'USD')
      // USD → 显示 $
      await expect(currencyBtn).toContainText('$')
    })

    test('REQ-006.8: 英文模式下币种切换入口 aria-label 和选项文案正确', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'))
      await goToMenu(page)
      const currencyBtn = page.getByRole('button', { name: 'Switch currency' })
      await expect(currencyBtn).toHaveAttribute('aria-label', 'Switch currency')
      await currencyBtn.click()
      await expect(page.getByRole('button', { name: /CNY/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /USD/ })).toBeVisible()
    })
  })

  /* ─── REQ-007: 币种状态管理与持久化 ─── */

  test.describe('REQ-007: 币种状态管理与持久化', () => {
    test('REQ-007.1: 选择 USD 后持久化到 localStorage', async ({ page }) => {
      await goToMenu(page)
      await selectCurrency(page, 'USD')
      expect(await getStoredCurrency(page)).toBe('USD')
    })

    test('REQ-007.2: 刷新页面后恢复上次选择的币种', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('currency', 'USD'))
      await goToMenu(page)
      // 恢复为 USD
      await expect(page.locator('article').first()).toContainText('$9.71')
    })

    test('REQ-007.3: 首次使用无 localStorage → 默认 CNY', async ({ page }) => {
      await goToMenu(page)
      await expect(page.locator('article').first()).toContainText('¥68.00')
      expect(await getStoredCurrency(page)).toBeNull()
    })

    test('REQ-007.4: 切换 CNY 后持久化到 localStorage', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('currency', 'USD'))
      await goToMenu(page)
      await selectCurrency(page, 'CNY')
      expect(await getStoredCurrency(page)).toBe('CNY')
    })

    test('REQ-007.5: 币种与主题/语言 localStorage 键独立共存', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark')
        localStorage.setItem('i18nextLng', 'en')
        localStorage.setItem('currency', 'USD')
      })
      await goToMenu(page)
      // 币种 USD
      await expect(page.locator('article').first()).toContainText('$9.71')
      // 主题 dark 不受影响
      await expect(page.locator('html')).toHaveClass(/dark/)
      // 语言 en 不受影响
      await expect(page.getByRole('button', { name: 'Switch theme' })).toBeVisible()
    })
  })
})
