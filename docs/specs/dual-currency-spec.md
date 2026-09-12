---
spec_id: SPEC-DUAL-CURRENCY-001
title: 人民币和美金双币种价格展示与切换
status: draft
template_id: requirement-spec-v1
schema_version: 1
product_area: 前端 / 价格展示层
baseline_spec: 无（首次 spec）
depends_on_specs: []
supersedes_specs: []
source_documents:
  - artifacts/workflow-node-artifact-yeux0biznkdi7j0dhil2/需求澄清-双币种价格展示与切换
created_at: 2026-09-12
updated_at: 2026-09-12
---

# Review Summary

- 本次需求: 在现有火锅门店点单概念演示应用中增加双币种（CNY/USD）价格展示与切换能力，使用户可在 TopBar 中自由切换币种，全站价格项即时以选中币种展示，数据层始终保持 CNY 基准不变
- 需求类型: UX / frontend change, copy-config
- 变更面: Context, Goals/Non-Goals, Glossary, Functional Requirements, UX Design, NFR/DFX, Open Questions, Traceability; 不涉及: API Design, Backend/Data, Metrics; 待确认: 无
- 变更面判断依据: 需求澄清文档（单币种切换、固定汇率 1:7、折扣换算、优惠券换算、默认 CNY、localStorage 持久化）；仓库证据（`money()` 函数硬编码 `¥`；`useTheme.ts` / `useElderlyMode.ts` 提供 localStorage + 降级 hook 模式；`TopBar.tsx` 现有语言/主题/老人模式切换入口；`CheckoutView.tsx` 折扣门槛 `subtotal >= 100 ? 30 : 0`；`i18n.ts` `coupon: '含 ¥30 菜品券'` 硬编码金额；`types.ts` `AppState` 无币种字段）
- 差异判断: 产品形态 / 站点 / 环境 / 版本差异: 不涉及; 依据: 单 SPA 概念演示应用，无多端/多站点/多环境/多版本形态
- 本次变更关键信息:
  - 新增 `useCurrency` hook（参照 `useTheme` / `useElderlyMode` 模式），管理 CNY/USD 二态切换、localStorage 持久化及降级
  - `money()` 函数扩展为接受币种参数，根据当前币种输出 `¥X.XX` 或 `$X.XX` 并按固定汇率 1 USD = 7 CNY 换算
  - 全站 5 个调用点（App.tsx、MenuView.tsx、CartPanel.tsx、OrderView.tsx、CheckoutView.tsx）传入当前币种
  - CheckoutView 折扣门槛和优惠金额在 USD 模式下按汇率换算显示（满 $14.29 减 $4.29），底层数据判断仍以 CNY 为准
  - `i18n.ts` `coupon` 文案金额参数化，支持币种切换换算
  - `TopBar.tsx` 新增币种切换入口，与语言/主题/老人模式并列
  - 数据层（`src/data/menu.ts`、`orderReducer.ts`）始终保持 CNY，换算仅在展示层
  - 不改后端、不引入新依赖、不影响主题/语言/老人模式等既有功能
- Review 重点:
  - `money()` 函数扩展的币种参数与换算精度（REQ-001 ~ REQ-003）
  - 折扣规则换算：展示层换算 vs 底层数据判断的分离（REQ-004）
  - 优惠券文案金额参数化处理（REQ-005）
  - TopBar 币种切换入口交互与 localStorage 持久化（REQ-006 ~ REQ-007）
  - 币种切换与主题/语言/老人模式共存不冲突（NFR-005）

## Scope Note

- Implemented sections: Context, Goals and Non-Goals, Glossary, Functional Requirements, UX Design, NFR/DFX, Open Questions, Traceability
- Not involved: API Design（无对外 API/SDK/Webhook/CLI 变更）, Backend/Data（无后端行为、数据结构、存储、权限、迁移变更）, Metrics（无新增埋点/日志/Dashboard/指标）
- Needs confirmation: 无（所有关键决策项已通过需求澄清确认）
- Reason: 需求澄清文档明确限定仅修改前端 `src/` 代码且不涉及后端；仓库证据确认后端 `server/` 仅健康检查占位、前端未调用后端 API；无埋点/指标配置存在

---

# Spec: 人民币和美金双币种价格展示与切换

## 1. Context

- **需求来源**: 用户需求——支持人民币（CNY）和美元（USD）双币种价格展示，用户可自由切换查看币种
- **商业背景**: 当前应用为火锅门店点单概念演示（React + TypeScript + Vite + TailwindCSS），所有商品价格均以人民币（¥）存储和展示。`money()` 函数硬编码 `¥` 符号，无币种概念。需增加美元（USD）展示能力，使用固定汇率 1 USD = 7 CNY 换算。
- **用户角色与核心痛点**:

| 用户角色 | 核心场景 | 痛点 |
|----------|----------|------|
| 中文用户 | 浏览菜单、购物车、订单、结账 | 默认人民币展示，无痛点 |
| 英文/美元习惯用户 | 查看价格信息 | 仅能以人民币查看，无法以熟悉的美元展示价格 |

- **关联重点特性**: 多语言切换（`i18next`）、暗黑/浅色主题（`useTheme`）、老人模式（`useElderlyMode`）——需确保与币种切换共存不冲突

### 1.1 证据来源

| 来源 | 用途 | 可信度 | 备注 |
|------|------|--------|------|
| 需求澄清文档（artifact `workflow-node-artifact-yeux0biznkdi7j0dhil2`） | 需求全量信息来源 | 高 | 用户已确认全部 5 项关键推断 |
| `src/lib/utils.ts` | 确认 `money()` 函数硬编码 `¥` 符号，无币种参数 | 高 | 直接源码读取 |
| `src/hooks/useTheme.ts` | 确认 localStorage + 降级 hook 模式，作为 `useCurrency` 实现参考 | 高 | 直接源码读取 |
| `src/hooks/useElderlyMode.ts` | 确认二态 toggle + localStorage + 降级模式 | 高 | 直接源码读取 |
| `src/components/TopBar.tsx` | 确认现有语言/主题/老人模式切换入口布局 | 高 | 直接源码读取 |
| `src/components/CheckoutView.tsx` | 确认折扣逻辑 `subtotal >= 100 ? 30 : 0` 硬编码 CNY | 高 | 直接源码读取 |
| `src/components/MenuView.tsx` | 确认菜单价格调用 `money(product.price)` | 高 | 直接源码读取 |
| `src/components/CartPanel.tsx` | 确认购物车单项价格和小计调用 `money()` | 高 | 直接源码读取 |
| `src/components/OrderView.tsx` | 确认订单项价格和总额调用 `money()` | 高 | 直接源码读取 |
| `src/App.tsx` | 确认底部栏购物车总额调用 `money(cartTotal)` | 高 | 直接源码读取 |
| `src/i18n.ts` | 确认 `coupon: '含 ¥30 菜品券'` 硬编码金额 | 高 | 直接源码读取 |
| `src/types.ts` | 确认 `AppState` 无币种字段 | 高 | 直接源码读取 |
| `src/data/menu.ts` | 确认商品价格数据以 CNY 存储 | 高 | 直接源码读取 |

## 2. Goals and Non-Goals

### 2.1 目标

| 目标 ID | 类目 | 目标描述 | 可度量指标 | 目标值 |
|---------|------|----------|------------|--------|
| GOAL-001 | 用户 | 用户可在 TopBar 中自由切换查看币种（CNY ↔ USD） | 切换入口可用 | CNY/USD 两选项均可正确切换 |
| GOAL-002 | 用户 | 切换后全站所有价格项即时以选中币种符号和换算金额展示 | 全站价格同步更新 | 1 次渲染周期内完成 |
| GOAL-003 | 用户 | 币种偏好持久化，刷新后保持上次选择 | localStorage 持久化 | 刷新后币种状态一致 |
| GOAL-004 | 技术 | 切换币种不影响底层数据准确性 | 数据层始终保持 CNY | 商品价格、购物车金额、折扣计算均以 CNY 为基准 |

### 2.2 非目标

| 非目标 ID | 不做的内容 | 原因 / 后续规划 |
|-----------|------------|------------------|
| NG-001 | 不引入实时汇率获取或第三方汇率 API | 固定汇率 1 USD = 7 CNY |
| NG-002 | 不支持除 CNY、USD 之外的第三方币种 | 本次仅需要双币种 |
| NG-003 | 不改变后端服务 | 后端仅有 `/ping` 健康检查，无价格逻辑 |
| NG-004 | 不改变商品数据的存储币种 | 数据层始终保持 CNY |
| NG-005 | 不修改支付流程逻辑 | 支付仅为模拟，不涉及真实交易 |
| NG-006 | 不做双币种同时并排展示 | 同一时刻仅展示一种币种 |
| NG-007 | 不改动核心业务流程（点单、购物车、订单管理、结账、服务呼叫） | 币种切换仅影响展示层 |
| NG-008 | 不引入新 npm 依赖 | 在现有技术栈内完成 |
| NG-009 | 不涉及主题/语言/老人模式功能改造 | 需确保共存但不在本次改造其本身 |

## 3. Glossary

| 概念 / 术语 | 描述 | 备注 |
|-------------|------|------|
| CNY | 人民币，应用数据层的基准币种 | 符号 `¥`，格式 `¥X.XX` |
| USD | 美元，切换后可选的展示币种 | 符号 `$`，格式 `$X.XX` |
| 固定汇率 | 1 USD = 7 CNY | CNY → USD 换算公式：`USD = CNY / 7` |
| `money()` | `src/lib/utils.ts` 中的价格格式化函数 | 当前硬编码 `¥`，需扩展为支持币种参数 |
| `useCurrency` | 拟新增的币种状态管理 hook | 参照 `useTheme` / `useElderlyMode` 模式 |
| localStorage `currency` | 币种偏好持久化键 | 值为 `"CNY"` 或 `"USD"` |
| 折扣门槛 | 结账页"满 100 减 30"规则 | 底层数据判断以 CNY 为准，USD 展示时换算显示 |
| 优惠券文案 | 会员区"含 ¥30 菜品券" | 金额部分需参数化支持币种换算 |

## 4. Functional Requirements

### REQ-001: `money()` 函数扩展——双币种格式化与换算

- **User Story**: As a 门店顾客, I want 价格以我选择的币种符号和正确换算的金额展示, so that 我能以熟悉的币种理解价格。
- **Priority**: P0
- **Description**: `money()` 函数从 `money(value: number)` 扩展为接受币种参数，根据当前币种输出对应符号和换算金额。CNY 模式下直接显示原始值加 `¥` 符号；USD 模式下按 `CNY / 7` 换算后加 `$` 符号，保留两位小数四舍五入。换算精度：两位小数，四舍五入。

**Acceptance Requirements (EARS)**:
- REQ-001.1: The system **shall** 支持两种币种格式化：CNY 输出 `¥X.XX`（原始值），USD 输出 `$X.XX`（CNY 值 ÷ 7，保留两位小数四舍五入）。
- REQ-001.2: **When** 币种为 CNY, the system **shall** 以 `¥` 符号和原始 CNY 金额展示价格，不做换算。
- REQ-001.3: **When** 币种为 USD, the system **shall** 以 `$` 符号和换算后金额展示价格，换算公式为 `USD = CNY / 7`，保留两位小数四舍五入。
- REQ-001.4: **When** 币种为 USD 且 CNY 值为 0, the system **shall** 展示 `$0.00`。

**Gherkin**:
```gherkin
Scenario: CNY 模式下价格展示
  Given 当前币种为 CNY
  When 商品价格为 68（CNY）
  Then money() 输出 "¥68.00"

Scenario: USD 模式下价格换算
  Given 当前币种为 USD
  When 商品价格为 68（CNY）
  Then money() 输出 "$9.71"（68 / 7 = 9.714... → 9.71 四舍五入）

Scenario: 零值展示
  Given 当前币种为 USD 且购物车为空
  When 购物车小计为 0
  Then money() 输出 "$0.00"
```

### REQ-002: 全站价格项同步切换

- **User Story**: As a 门店顾客, I want 切换币种后所有价格项即时更新, so that 我看到的价格信息一致无遗漏。
- **Priority**: P0
- **Description**: 切换币种后，全站所有价格展示项在同一渲染周期内更新为选中币种。受影响的价格展示点包括：菜单商品价格（MenuView）、购物车单项价格和小计（CartPanel）、订单项价格和总额（OrderView）、结账页小计/折扣/应付金额（CheckoutView）、底部栏购物车总额（App.tsx）。

**Acceptance Requirements (EARS)**:
- REQ-002.1: **When** 用户切换币种, the system **shall** 在 1 次渲染周期内更新全站所有价格项为选中币种的符号和换算金额。
- REQ-002.2: The system **shall** 覆盖以下全部价格展示点：菜单商品价格、购物车单项价格、购物车小计/预估合计、订单项价格、订单合计、结账页小计、结账页折扣金额、结账页应付金额、底部栏购物车总额。
- REQ-002.3: The system **shall** 确保切换后不再有遗漏的 `¥` 硬编码价格展示（经 `money()` 函数统一格式化）。

### REQ-003: 换算精度规则

- **User Story**: As a 门店顾客, I want 美元金额换算准确, so that 我能信任展示的价格。
- **Priority**: P0
- **Description**: USD 金额 = 对应 CNY 金额 ÷ 7，保留两位小数，四舍五入。示例：¥68 → $9.71（68/7=9.7142...→9.71）；¥100 → $14.29（100/7=14.2857...→14.29）；¥30 → $4.29（30/7=4.2857...→4.29）。

**Acceptance Requirements (EARS)**:
- REQ-003.1: The system **shall** 使用固定汇率 1 USD = 7 CNY 进行换算，CNY → USD 公式为 `USD = CNY / 7`。
- REQ-003.2: The system **shall** 对换算结果保留两位小数，使用四舍五入规则。
- REQ-003.3: The system **shall** 确保切换回 CNY 时恢复为原始 CNY 金额，不因换算产生精度损失。

### REQ-004: 折扣规则展示层换算

- **User Story**: As a 门店顾客, I want 在 USD 模式下看到换算后的折扣门槛和优惠金额, so that 我能理解折扣条件。
- **Priority**: P0
- **Description**: 结账页"满 100 减 30"折扣规则在 USD 模式下，门槛和优惠金额按汇率换算显示（门槛 ≈ $14.29，优惠 ≈ $4.29）。底层数据判断仍以 CNY 为准（`subtotal >= 100 ? 30 : 0`），换算仅影响展示层。

**Acceptance Requirements (EARS)**:
- REQ-004.1: **When** 币种为 USD, the system **shall** 将折扣门槛 100 CNY 换算显示为 $14.29，优惠金额 30 CNY 换算显示为 $4.29。
- REQ-004.2: The system **shall** 确保底层数据判断逻辑（`subtotal >= 100 ? 30 : 0`）始终以 CNY 为基准，不因展示币种变化而改变。
- REQ-004.3: **When** 币种切换回 CNY, the system **shall** 恢复显示"满 ¥100.00 减 ¥30.00"。

**Gherkin**:
```gherkin
Scenario: USD 模式下折扣展示
  Given 当前币种为 USD 且订单小计为 120 CNY
  When 用户查看结账页
  Then 小计显示 $17.14（120/7）
  And 折扣显示 -$4.29（30/7）
  And 应付显示 $12.86（90/7）
  And 底层折扣判断 subtotal >= 100 仍以 CNY 120 为基准

Scenario: CNY 模式下折扣恢复
  Given 当前币种为 USD
  When 用户切换回 CNY
  Then 小计恢复 ¥120.00
  And 折扣恢复 -¥30.00
  And 应付恢复 ¥90.00
```

### REQ-005: 优惠券文案金额换算

- **User Story**: As a 门店顾客, I want 在 USD 模式下看到换算后的优惠券金额, so that 金额信息一致。
- **Priority**: P0
- **Description**: 会员区"含 ¥30 菜品券"文案中的金额随币种切换换算。USD 模式下显示"含 $4.29 菜品券"。需将 `i18n.ts` 中硬编码的 `coupon: '含 ¥30 菜品券'` 参数化处理。

**Acceptance Requirements (EARS)**:
- REQ-005.1: **When** 币种为 CNY, the system **shall** 显示"含 ¥30.00 菜品券"（或保持现有格式"含 ¥30 菜品券"）。
- REQ-005.2: **When** 币种为 USD, the system **shall** 显示"含 $4.29 菜品券"（30/7=4.2857...→4.29）。
- REQ-005.3: The system **shall** 将 `i18n.ts` 中 `coupon` 文案的金额部分参数化，不再硬编码 `¥30`。

### REQ-006: 币种切换入口交互

- **User Story**: As a 门店顾客, I want 通过明确的切换入口选择目标币种, so that 我可以自由切换查看币种。
- **Priority**: P0
- **Description**: 在 TopBar 中新增币种切换入口，与语言切换、主题切换、老人模式并列。切换入口提供 CNY 和 USD 两个选项，用户选择后即时切换并关闭选择菜单。当前生效币种在入口处有视觉标识。

**Acceptance Requirements (EARS)**:
- REQ-006.1: The system **shall** 在 TopBar 中提供币种切换入口，与现有语言/主题/老人模式切换入口并列。
- REQ-006.2: The system **shall** 提供 CNY 和 USD 两个币种选项供用户选择。
- REQ-006.3: **When** 用户选择某一币种, the system **shall** 立即切换为该币种并更新全站价格展示。
- REQ-006.4: The system **shall** 在切换入口处标识当前生效的币种。
- REQ-006.5: The system **shall** 为币种切换入口提供 aria-label 等可访问性标签。
- REQ-006.6: The system **shall** 确保币种切换入口的视觉风格与 TopBar 现有控件一致，不干扰主操作区。

### REQ-007: 币种状态管理与持久化

- **User Story**: As a 门店顾客, I want 刷新页面后保持上次选择的币种, so that 我不需要重新设置。
- **Priority**: P0
- **Description**: 新增 `useCurrency` hook（参照 `useTheme` / `useElderlyMode` 模式），管理 CNY/USD 二态切换。币种偏好存储在 localStorage `currency` 键中，值为 `"CNY"` 或 `"USD"`。应用启动时从 localStorage 恢复；首次进入默认 CNY。localStorage 不可用时降级为内存态，不报错不阻塞。

**Acceptance Requirements (EARS)**:
- REQ-007.1: The system **shall** 将用户选择的币种持久化到 localStorage `currency` 键，值为 `"CNY"` 或 `"USD"`。
- REQ-007.2: **When** 应用初始化时, the system **shall** 从 localStorage 读取上次选择的币种；无存储值时默认为 CNY。
- REQ-007.3: **If** localStorage 不可用, **then** the system **shall** 降级为内存态管理币种，切换即时生效但刷新后丢失，不向用户展示错误。
- REQ-007.4: The system **shall** 确保币种状态管理与主题（`theme`）、语言（`i18nextLng`）、老人模式（`elderly-mode`）使用独立的 localStorage 键，互不影响。

**Gherkin**:
```gherkin
Scenario: 持久化恢复 USD
  Given 用户上次选择了 USD
  When 用户刷新页面重新打开应用
  Then 应用初始化为 USD 币种
  And 全站价格以美元展示

Scenario: 首次使用默认 CNY
  Given 用户首次使用应用（localStorage 无 currency 值）
  When 用户打开应用
  Then 应用默认为 CNY 币种
  And 全站价格以人民币展示
```

## 5. UX Design

### 5.1 体验目标与设计原则

- **体验目标**: 让用户能以熟悉的币种查看价格信息，切换即时无延迟
- **设计原则**: 切换即时响应、双币种符号清晰可辨、与现有 TopBar 控件视觉风格一致

### 5.2 入口与交互范围

| 入口 | 位置 | 交互形式 | 变更说明 |
|------|------|----------|----------|
| 币种切换入口 | TopBar 右侧 | 按钮或弹出菜单（两选项 CNY/USD） | 新增控件，与语言/主题/老人模式并列 |

### 5.3 核心体验路径

1. 用户进入应用，默认以人民币（¥）展示所有价格项
2. 用户在 TopBar 中看到币种切换入口，当前生效币种有视觉标识
3. 用户点击切换入口，选择 USD
4. 全站所有价格项在 1 次渲染周期内更新为 `$` 符号和换算金额
5. 币种偏好写入 localStorage
6. 用户继续浏览菜单、加购、查看订单、结账，所有流程中价格均以选中币种显示
7. 用户可随时再次切换回 CNY，价格即时恢复

### 5.4 分支路径 / 异常路径

| 场景 | 系统响应 |
|------|----------|
| **切换到 USD** | 全站价格即时更新为 `$` 符号和换算金额 |
| **切换回 CNY** | 全站价格恢复为 `¥` 符号和原始 CNY 金额 |
| **localStorage 不可用** | 切换即时生效，降级为内存态，不报错不展示错误 |
| **首次使用** | 默认 CNY 币种 |
| **刷新页面** | 从 localStorage 恢复上次币种选择 |
| **空购物车** | 小计显示 `¥0.00` 或 `$0.00`（视当前币种） |

### 5.5 视觉与响应式约束

- **切换即时性**: 切换币种后价格更新应为即时响应，无明显延迟
- **视觉一致性**: 币种切换入口应与现有 TopBar 控件视觉风格一致，不干扰主操作区
- **格式规范**: 人民币格式 `¥X.XX`，美元格式 `$X.XX`，金额保留两位小数

### 5.6 文案与可理解性

| 文案键 | 中文 | 英文 | 用途 |
|--------|------|------|------|
| `common.aria_currency` | 切换币种 | Switch currency | 币种切换入口 aria-label |
| `common.currency_cny` | 人民币 | CNY | 币种选项标签 |
| `common.currency_usd` | 美元 | USD | 币种选项标签 |

> `coupon` 文案金额部分参数化处理（REQ-005），具体文案格式待设计阶段确定。

## 6. NFR / DFX

| NFR ID | 类别 | 要求 | 验收方法 |
|--------|------|------|----------|
| NFR-001 | 兼容性 | 支持主流现代浏览器（Chrome、Safari、Firefox、Edge 最新版本） | 在各浏览器手动验证双币种切换 |
| NFR-002 | 性能 | 币种切换不引起明显渲染延迟或页面重排，所有价格项同步更新 | 切换币种时观察帧率，确认无掉帧 |
| NFR-003 | 稳定性 | localStorage 不可用时降级为内存态，应用功能不受影响，不报错 | 模拟 localStorage 禁用场景 |
| NFR-004 | 准确性 | 切换币种不影响价格数据准确性，数据层始终保持 CNY | 验证切换后商品价格、购物车金额、折扣计算均以 CNY 为基准 |
| NFR-005 | 共存性 | 币种切换与主题（dark/light/auto）、语言（zh/en）、老人模式兼容共存，使用独立 localStorage 键，不产生冲突 | 同时切换多个偏好验证独立性 |

## 7. Open Questions

| ID | 问题 | 影响 | 建议负责人 |
|---|---|---|---|
| OQ-001 | 币种切换入口具体交互形式（单按钮 toggle vs 弹出菜单 vs 下拉选择），与 TopBar 现有控件风格如何协调 | UX 交互细节 | RD（编码阶段确定） |
| OQ-002 | `coupon` 文案参数化后的具体格式（如 "含 ¥30.00 菜品券" 还是保持 "含 ¥30 菜品券"，USD 模式下是否保留"菜品券"后缀） | 文案格式 | RD（编码阶段确定） |
| OQ-003 | 币种切换是否需要平滑过渡动画（如价格数字渐变），还是直接即时更新 | UX 视觉效果 | RD（编码阶段确定） |

> 以上均为实现细节层面的问题，不影响 Spec 的产品行为定义和验收契约，可在编码阶段由 RD 自主决策。

## 8. Traceability

| REQ / NFR ID | UX Design 章节 | 关联组件 / 文件 | QA 重点 |
|---|---|---|---|
| REQ-001 | §5.5 | `src/lib/utils.ts` | 双币种格式化、换算精度、零值处理 |
| REQ-002 | §5.3 | `App.tsx`, `MenuView.tsx`, `CartPanel.tsx`, `OrderView.tsx`, `CheckoutView.tsx` | 全站价格同步更新、无遗漏 |
| REQ-003 | §5.5 | `src/lib/utils.ts` | 换算公式正确性、四舍五入精度、CNY 恢复无损 |
| REQ-004 | §5.3-5.4 | `src/components/CheckoutView.tsx` | 折扣展示换算、底层数据判断不变 |
| REQ-005 | §5.6 | `src/i18n.ts`, `src/components/TopBar.tsx` | 优惠券文案换算、参数化处理 |
| REQ-006 | §5.2-5.3 | `src/components/TopBar.tsx` | 切换入口交互、视觉标识、可访问性 |
| REQ-007 | §5.4 | `useCurrency` hook (new), `App.tsx` | 持久化恢复、降级、独立键 |
| NFR-001~005 | §5.5 | — | 浏览器兼容、性能、降级、准确性、共存 |
