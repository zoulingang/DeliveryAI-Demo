---
spec_id: SPEC-DARK-MODE-001
title: 夜间模式（Dark Mode）增强
status: draft
template_id: requirement-spec-v1
schema_version: 1
product_area: 前端 / 全局主题
baseline_spec: 无（首次 spec）
depends_on_specs: []
supersedes_specs: []
source_documents:
  - artifacts/workflow-node-artifact-yeuwtmbcw0di7j0dgzpt/夜间模式需求澄清.md
created_at: 2026-09-12
updated_at: 2026-09-12
---

# Review Summary

- 本次需求: 在现有 light/dark 二态主题基础上，增加 Auto（跟随系统）三态模式、实时系统主题监听、弹出菜单交互、状态持久化及深色视觉适配完善
- 需求类型: UX / frontend change, copy-config
- 变更面: Context, Goals/Non-Goals, Glossary, Functional Requirements, UX Design, NFR/DFX, Open Questions, Traceability; 不涉及: API Design, Backend/Data, Metrics; 待确认: 无
- 变更面判断依据: 需求澄清文档（三态切换、Auto 实时监听、弹出菜单、图片适配）；仓库证据（`useTheme.ts` 仅二态 toggle 无 matchMedia listener；`TopBar.tsx` 单按钮切换；`index.html` FOUC 脚本无 auto 处理；`tailwind.config.js` shadow 为浅色 rgba；`i18n.ts` 无 auto 模式文案；全部 9 组件 + App.tsx 已有 `dark:` 变体共 113 处）
- 差异判断: 产品形态 / 站点 / 环境 / 版本差异: 不涉及; 依据: 单 SPA 概念演示应用，无多端/多站点/多环境/多版本形态（system-architecture.md 确认单仓库单前端部署 GitHub Pages）
- 本次变更关键信息:
  - 新增 Auto（跟随系统）三态主题模式，`useTheme` 从 light/dark 二态扩展为 light/dark/auto 三态
  - `useTheme` 新增 `matchMedia('(prefers-color-scheme: dark)')` `change` 事件实时监听，Auto 模式下系统主题变更即时响应
  - `TopBar` 主题切换从单按钮二态 toggle 改为图标按钮 + 弹出菜单（Light/Dark/Auto 三选项，当前高亮）
  - `index.html` FOUC 防闪脚本扩展支持 `"auto"` 值，auto 模式下初始化读取系统 `prefers-color-scheme`
  - `i18n.ts` 新增主题菜单相关文案（浅色模式/深色模式/跟随系统及其 aria-label）
  - 深色视觉适配完善：图片亮度/遮罩适配、阴影暗色变体、弹出菜单暗色样式
  - localStorage `theme` 键值域从 `"light" | "dark"` 扩展为 `"light" | "dark" | "auto"`
  - 不改动物核心业务流程、不涉及后端、不引入新依赖、不新增额外主题色板
- Review 重点:
  - 三态模式的状态定义与切换逻辑是否自洽（REQ-001 ~ REQ-005）
  - Auto 模式实时监听的生命周期管理（监听注册/清理时机）
  - localStorage 值域扩展的向后兼容性（旧 `"light"/"dark"` 值仍有效）
  - FOUC 防闪脚本与 `useTheme` 初始化逻辑的一致性
  - 深色视觉适配的完整性覆盖范围（全部 9 组件 + App.tsx）

## Scope Note

- Implemented sections: Context, Goals and Non-Goals, Glossary, Functional Requirements, UX Design, NFR/DFX, Open Questions, Traceability
- Not involved: API Design（无对外 API/SDK/Webhook/CLI 变更）, Backend/Data（无后端行为、数据结构、存储、权限、迁移变更）, Metrics（无新增埋点/日志/Dashboard/指标）
- Needs confirmation: 无（所有关键决策项已通过需求澄清确认）
- Reason: 需求澄清文档明确限定仅修改前端 `src/` 代码且不涉及后端；仓库证据确认后端 `server/` 仅健康检查占位、前端未调用后端 API；无埋点/指标配置存在

---

# Spec: 夜间模式（Dark Mode）增强

## 1. Context

- **需求来源**: 用户需求——在低光环境下提供更舒适的视觉体验，降低屏幕亮度对用户的刺激
- **商业背景**: 当前应用为火锅门店点单概念演示（React + TypeScript + Vite + TailwindCSS），已在全部 9 个组件及 App.tsx 中配置 `dark:` 变体类名（共 113 处），具备基础暗色模式实现，但缺少 Auto 模式和实时系统跟随能力
- **用户角色与核心痛点**:

| 用户角色 | 核心场景 | 痛点 |
|----------|----------|------|
| 门店顾客（低光环境） | 夜间或暗光环境使用点单应用 | 浅色主题过亮刺眼，需手动切换深色 |
| 门店顾客（系统已设深色） | 已在系统层面设置深色模式 | 打开应用无法自动跟随，需重复设置 |
| 老年顾客 | 同时需要老人模式和夜间模式 | 字号放大与深色配色需共存不冲突 |

- **关联重点特性**: 老人模式（`useElderlyMode`）、多语言切换（`i18next`）——需确保与夜间模式共存不冲突

### 1.1 证据来源

| 来源 | 用途 | 可信度 | 备注 |
|------|------|--------|------|
| 夜间模式需求澄清文档（artifact） | 需求全量信息来源 | 高 | 用户已通过 ask-user-interaction 确认全部关键决策 |
| `src/hooks/useTheme.ts` | 确认现有二态 toggle 实现，无 matchMedia listener | 高 | 直接源码读取 |
| `src/components/TopBar.tsx` | 确认现有单按钮 toggle 交互 | 高 | 直接源码读取 |
| `index.html` FOUC 脚本 | 确认防闪逻辑仅处理 light/dark，无 auto | 高 | 直接源码读取 |
| `tailwind.config.js` | 确认 shadow 使用浅色 rgba，无 dark 变体 | 高 | 直接源码读取 |
| `src/i18n.ts` | 确认仅有 `aria_light`/`aria_dark`，无 auto 相关文案 | 高 | 直接源码读取 |
| `src/index.css` | 确认 `.dark` 全局样式及 250ms 过渡已存在 | 高 | 直接源码读取 |
| 全组件 `dark:` 变体统计 | 确认 9 组件 + App.tsx 共 113 处 dark: 变体 | 高 | grep 统计 |
| `src/hooks/useElderlyMode.ts` | 确认老人模式独立于主题，通过 `elderly` class 实现 | 高 | 直接源码读取 |

## 2. Goals and Non-Goals

### 2.1 目标

| 目标 ID | 类目 | 目标描述 | 可度量指标 | 目标值 |
|---------|------|----------|------------|--------|
| GOAL-001 | 用户 | 用户可在应用内手动切换浅色/深色/自动三种主题模式 | 三态切换可用 | Light/Dark/Auto 三选项均可正确切换 |
| GOAL-002 | 用户 | Auto 模式下实时跟随系统主题变更 | 系统主题切换后应用即时响应 | ≤250ms 内完成切换 |
| GOAL-003 | 用户 | 主题偏好持久化，重开应用恢复上次选择 | localStorage 持久化 | 关闭重开后主题状态一致 |
| GOAL-004 | 技术 | 深色模式下全部页面和组件视觉协调一致 | 视觉一致性 | 无配色断裂、对比度不足或图片突兀 |

### 2.2 非目标

| 非目标 ID | 不做的内容 | 原因 / 后续规划 |
|-----------|------------|------------------|
| NG-001 | 不改动物点单、购物车、订单管理、结账、服务呼叫等核心业务流程 | 主题切换为表现层增强，不影响业务逻辑 |
| NG-002 | 不引入额外主题色板（高对比度主题、自定义主题色等） | 仅做 light/dark 二色适配 |
| NG-003 | 不涉及服务端（`server/`）主题相关变更 | 后端为健康检查占位服务，无主题交互 |
| NG-004 | 不涉及老人模式功能改造 | 需确保共存但不在本次改造老人模式本身 |
| NG-005 | 不引入第三方主题库或 CSS-in-JS 方案 | 基于现有 TailwindCSS `darkMode: 'class'` 架构增强 |
| NG-006 | 不新增 npm 依赖 | 在现有技术栈内完成 |
| NG-007 | 不重新实现已有暗色模式基础架构 | 保留现有 `dark:` 变体和全局暗色样式 |

## 3. Glossary

| 概念 / 术语 | 描述 | 备注 |
|-------------|------|------|
| Light | 浅色模式，应用以浅色配色方案渲染 | localStorage `theme` 值为 `"light"` |
| Dark | 深色模式，应用以深色配色方案渲染 | localStorage `theme` 值为 `"dark"`，`<html>` 添加 `dark` class |
| Auto | 自动模式，跟随系统 `prefers-color-scheme` 设置 | localStorage `theme` 值为 `"auto"`，实际渲染主题由系统决定 |
| `prefers-color-scheme` | CSS 媒体查询，检测用户系统主题偏好 | 通过 `window.matchMedia('(prefers-color-scheme: dark)')` 访问 |
| FOUC | Flash of Unstyled Content，主题闪烁 | `index.html` 内联脚本在 React 渲染前同步确定初始主题 |
| `dark` class | TailwindCSS `darkMode: 'class'` 模式下的触发 class | 添加到 `<html>` 元素，激活所有 `dark:` 变体 |
| `elderly` class | 老人模式触发 class | 独立于 `dark` class，二者可共存 |

## 4. Functional Requirements

### REQ-001: 三态主题模式定义与状态管理

- **User Story**: As a 门店顾客, I want 在应用内选择浅色、深色或自动三种主题模式, so that 我可以根据环境光线和偏好自由控制视觉体验。
- **Priority**: P0
- **Description**: 将现有 light/dark 二态主题管理扩展为 light/dark/auto 三态。`useTheme` hook 的 `theme` 状态从 `'light' | 'dark'` 扩展为 `'light' | 'dark' | 'auto'`。当 `theme` 为 `'auto'` 时，实际渲染主题（`resolvedTheme`）由系统 `prefers-color-scheme` 决定。

**Acceptance Requirements (EARS)**:
- REQ-001.1: The system **shall** 支持三种主题模式：浅色（Light）、深色（Dark）、自动（Auto），其中 Auto 模式下实际渲染主题由系统 `prefers-color-scheme` 决定。
- REQ-001.2: **When** 用户选择 Light 模式, the system **shall** 移除 `<html>` 元素的 `dark` class 并将 localStorage `theme` 记录为 `"light"`。
- REQ-001.3: **When** 用户选择 Dark 模式, the system **shall** 在 `<html>` 元素添加 `dark` class 并将 localStorage `theme` 记录为 `"dark"`。
- REQ-001.4: **When** 用户选择 Auto 模式, the system **shall** 将 localStorage `theme` 记录为 `"auto"`，并根据系统当前 `prefers-color-scheme` 决定是否添加 `dark` class。
- REQ-001.5: **If** localStorage 中存储的值为 `"auto"`, **then** the system **shall** 在初始化时读取系统 `prefers-color-scheme` 确定实际渲染主题，等同于 Auto 模式行为。
- REQ-001.6: **If** localStorage 中存储的值为 `"light"` 或 `"dark"`（旧值兼容）, **then** the system **shall** 正常识别并应用对应主题，不因值域扩展而破坏。

**Gherkin**:
```gherkin
Scenario: 用户切换到 Auto 模式后系统为深色
  Given 用户当前处于 Light 模式且系统主题为深色
  When 用户在主题菜单中选择"自动"
  Then localStorage theme 值为 "auto"
  And <html> 元素包含 dark class
  And 页面切换为深色配色

Scenario: 旧版本 localStorage 值兼容
  Given localStorage theme 值为 "dark"（旧版本写入）
  When 用户打开应用
  Then 应用初始化为深色主题
  And 主题功能正常可用
```

### REQ-002: Auto 模式实时系统主题跟随

- **User Story**: As a 门店顾客, I want 在 Auto 模式下系统切换主题时应用自动跟随, so that 我不需要手动重新设置。
- **Priority**: P0
- **Description**: 当用户处于 Auto 模式时，应用通过 `window.matchMedia('(prefers-color-scheme: dark)')` 注册 `change` 事件监听器，系统主题变更时即时切换实际渲染主题。用户切换到 Light 或 Dark 模式后，应移除监听器。

**Acceptance Requirements (EARS)**:
- REQ-002.1: **When** 用户处于 Auto 模式且系统 `prefers-color-scheme` 发生变更, the system **shall** 在 250ms 内即时切换实际渲染主题（添加或移除 `dark` class）。
- REQ-002.2: **When** 用户从 Auto 模式切换到 Light 或 Dark 模式, the system **shall** 移除 `matchMedia` `change` 事件监听器，不再响应系统主题变更。
- REQ-002.3: **When** 用户从 Light 或 Dark 模式切换到 Auto 模式, the system **shall** 注册 `matchMedia` `change` 事件监听器并立即根据当前系统主题设置渲染主题。
- REQ-002.4: **If** 浏览器不支持 `prefers-color-scheme` 或 `matchMedia`, **then** the system **shall** 将 Auto 模式降级为默认浅色主题，不影响其他功能。

**Gherkin**:
```gherkin
Scenario: Auto 模式下系统从浅色切换到深色
  Given 用户处于 Auto 模式且当前渲染为浅色
  When 系统主题切换为深色（prefers-color-scheme: dark）
  Then <html> 元素添加 dark class
  And 页面在 250ms 内平滑过渡到深色配色

Scenario: 切换到 Light 模式后不再跟随系统
  Given 用户处于 Auto 模式
  When 用户选择 Light 模式
  Then matchMedia change 监听器被移除
  And 此后系统主题变更不影响应用渲染
```

### REQ-003: 主题切换交互——弹出菜单

- **User Story**: As a 门店顾客, I want 通过弹出菜单选择主题模式, so that 我可以清晰地看到所有可用选项并选择当前需要的模式。
- **Priority**: P0
- **Description**: TopBar 中的主题切换从单按钮二态 toggle 改为图标按钮 + 弹出菜单。点击图标按钮弹出菜单，显示 Light/Dark/Auto 三个选项，当前生效的选项高亮标记。选择某项后菜单关闭并立即应用主题。菜单外点击关闭菜单但不改变主题。

**Acceptance Requirements (EARS)**:
- REQ-003.1: The system **shall** 在 TopBar 保留一个主题切换图标按钮，图标根据当前实际渲染主题（resolvedTheme）显示对应图标（深色时显示 Sun，浅色时显示 Moon）。
- REQ-003.2: **When** 用户点击主题切换图标按钮, the system **shall** 弹出菜单显示三个选项：浅色模式（Light）、深色模式（Dark）、跟随系统（Auto）。
- REQ-003.3: The system **shall** 在菜单中高亮标记当前生效的模式（用户选择的 mode，而非 resolvedTheme）。
- REQ-003.4: **When** 用户在菜单中选择某一模式, the system **shall** 立即关闭菜单并应用对应主题。
- REQ-003.5: **When** 用户在菜单外点击, the system **shall** 关闭菜单但不改变当前主题。
- REQ-003.6: The system **shall** 为主题切换图标按钮提供 aria-label，为菜单选项提供可访问的文本标签。

**Gherkin**:
```gherkin
Scenario: 用户通过菜单切换到深色模式
  Given 用户当前处于 Auto 模式（渲染为浅色）
  When 用户点击主题切换图标按钮
  And 用户在弹出菜单中选择"深色模式"
  Then 菜单关闭
  And 页面切换为深色配色
  And localStorage theme 值为 "dark"
  And 主题图标更新为 Sun

Scenario: 菜单外点击不改变主题
  Given 用户当前处于浅色模式且已打开主题菜单
  When 用户点击菜单外区域
  Then 菜单关闭
  And 主题保持浅色不变
```

### REQ-004: 主题状态持久化与初始化

- **User Story**: As a 门店顾客, I want 关闭并重新打开应用后恢复上次选择的主题模式, so that 我不需要每次都重新设置。
- **Priority**: P0
- **Description**: 主题偏好存储在 localStorage `theme` 键中，值为 `"light"` / `"dark"` / `"auto"` 之一。应用启动时按优先级恢复：localStorage 值 > 系统 `prefers-color-scheme` > 默认浅色。`index.html` FOUC 防闪脚本同步更新以支持 `"auto"` 值。

**Acceptance Requirements (EARS)**:
- REQ-004.1: The system **shall** 将用户选择的主题模式持久化到 localStorage `theme` 键，值为 `"light"` / `"dark"` / `"auto"` 之一。
- REQ-004.2: **When** 应用初始化时, the system **shall** 按以下优先级确定初始主题：localStorage `theme` 值 > 系统 `prefers-color-scheme` > 默认浅色。
- REQ-004.3: **When** localStorage `theme` 值为 `"auto"`, the system **shall** 在初始化时读取系统 `prefers-color-scheme` 确定实际渲染主题。
- REQ-004.4: **When** localStorage 无 `theme` 值（首次使用）, the system **shall** 默认跟随系统主题（等同于 Auto 模式行为）。
- REQ-004.5: **If** localStorage 不可用, **then** the system **shall** 降级为内存态管理主题，切换即时生效但刷新后丢失，不向用户展示错误。
- REQ-004.6: The system **shall** 在 `index.html` FOUC 防闪脚本中同步支持 `"auto"` 值处理，确保 React 渲染前初始主题与 `useTheme` 逻辑一致。

**Gherkin**:
```gherkin
Scenario: 持久化恢复 Auto 模式
  Given 用户上次选择了 Auto 模式且系统为深色
  When 用户重新打开应用
  Then 应用初始化为深色主题
  And 主题模式为 Auto
  And 系统主题变更时应用实时跟随

Scenario: 首次使用默认跟随系统
  Given 用户首次使用应用（localStorage 无 theme 值）且系统为深色
  When 用户打开应用
  Then 应用初始化为深色主题
  And 主题模式等同于 Auto
```

### REQ-005: 深色视觉适配完善

- **User Story**: As a 门店顾客, I want 深色模式下所有页面和组件视觉协调一致, so that 我的暗光使用体验舒适无割裂感。
- **Priority**: P1
- **Description**: 在现有 `dark:` 变体基础上，对图片、阴影、弹出菜单等视觉元素进行深色适配完善。图片适度降低亮度或添加暗色遮罩；阴影调整为低亮度暗色阴影；弹出菜单组件暗色配色协调。

**Acceptance Requirements (EARS)**:
- REQ-005.1: The system **shall** 在深色模式下对展示图片（菜品图、火锅图等）适度降低亮度或添加暗色遮罩，使其融入暗色背景。
- REQ-005.2: The system **shall** 在深色模式下使用更柔和、低亮度的暗色阴影替代现有浅色 rgba 阴影（`shadow-card`、`shadow-float`），避免浅色阴影在暗色背景上突兀。
- REQ-005.3: The system **shall** 确保主题切换弹出菜单本身在深色模式下视觉表现一致（菜单背景、文字、高亮项配色协调）。
- REQ-005.4: The system **shall** 确保深色模式下全部 9 个组件（TopBar、MenuView、OrderView、CheckoutView、CartPanel、ServiceSheet、DemoConsole、BindTable、WelcomeView）及 App.tsx 的视觉表现协调一致，无配色断裂或对比度不足。
- REQ-005.5: The system **shall** 确保深色模式下文字与背景对比度满足 WCAG AA 标准（≥ 4.5:1 正文，≥ 3:1 大字/图标）。

### REQ-006: 夜间模式与老人模式共存

- **User Story**: As a 老年顾客, I want 同时开启老人模式和夜间模式, so that 我在暗光环境下也能使用放大的字号和增强的对比度。
- **Priority**: P1
- **Description**: 夜间模式（`dark` class）与老人模式（`elderly` class）通过独立的 class 机制工作，二者可同时开启互不冲突。老人模式的字号放大和对比度增强规则在暗色模式下同样生效。

**Acceptance Requirements (EARS)**:
- REQ-006.1: The system **shall** 允许夜间模式与老人模式同时开启，`<html>` 元素可同时包含 `dark` 和 `elderly` class。
- REQ-006.2: **When** 夜间模式和老人模式同时开启, the system **shall** 同时应用字号放大（125%）和深色配色方案。
- REQ-006.3: **When** 夜间模式和老人模式同时开启, the system **shall** 确保老人模式的对比度增强规则在暗色模式下同样生效，文字对比度满足可读性要求。

### REQ-007: 主题切换平滑过渡

- **User Story**: As a 门店顾客, I want 主题切换时页面平滑过渡, so that 切换不闪烁不刺眼。
- **Priority**: P1
- **Description**: 利用现有 CSS transition（250ms ease）实现主题切换的平滑过渡，包括背景色、文字色、边框色等属性。

**Acceptance Requirements (EARS)**:
- REQ-007.1: **When** 主题切换发生, the system **shall** 通过 CSS transition（250ms ease）平滑过渡背景色、文字色、边框色等属性，不出现闪烁或跳动。
- REQ-007.2: The system **shall** 确保主题切换不引起页面重排或明显卡顿，不影响交互响应性。

### REQ-008: 主题与多语言共存

- **User Story**: As a 门店顾客, I want 切换语言时主题保持不变，切换主题时语言保持不变, so that 我的两个偏好独立保存互不影响。
- **Priority**: P1
- **Description**: 主题模式与语言切换通过独立的 localStorage 键（`theme` 和 `i18nextLng`）管理，互不影响。主题菜单文案需支持中英双语。

**Acceptance Requirements (EARS)**:
- REQ-008.1: **When** 用户切换语言, the system **shall** 保持当前主题模式不变。
- REQ-008.2: **When** 用户切换主题, the system **shall** 保持当前语言不变。
- REQ-008.3: The system **shall** 在 `i18n.ts` 中新增主题菜单相关文案（浅色模式、深色模式、跟随系统及对应 aria-label），支持中英双语显示。

## 5. UX Design

### 5.1 体验目标与设计原则

- **体验目标**: 在低光环境下提供更舒适的视觉体验，降低屏幕亮度刺激；让用户感知到"跟随系统"的智能行为
- **设计原则**: 平滑过渡无闪烁、三态清晰可辨、与现有 UI 风格一致

### 5.2 入口与交互范围

| 入口 | 位置 | 交互形式 | 变更说明 |
|------|------|----------|----------|
| 主题切换入口 | TopBar 右侧图标按钮 | 点击弹出菜单 | 从单按钮二态 toggle 改为图标按钮 + 弹出菜单 |

### 5.3 核心体验路径

1. 用户在 TopBar 看到主题切换图标按钮（Sun/Moon 图标根据当前渲染主题）
2. 用户点击按钮，弹出菜单显示三个选项：浅色模式（Light）、深色模式（Dark）、跟随系统（Auto）
3. 当前生效模式在菜单中高亮标记
4. 用户选择目标模式 → 菜单关闭 → 界面 250ms 平滑过渡 → localStorage 记录偏好
5. 主题图标更新为当前渲染主题对应图标

### 5.4 分支路径 / 异常路径

| 场景 | 系统响应 |
|------|----------|
| **菜单外点击** | 关闭菜单，不改变主题 |
| **Auto 模式 + 系统切换主题** | 即时跟随系统，250ms 内平滑过渡 |
| **localStorage 不可用** | 主题切换即时生效，降级为内存态，不报错不展示错误 |
| **浏览器不支持 `prefers-color-scheme`** | Auto 模式降级为默认浅色，功能正常 |
| **首次使用（无 localStorage）** | 默认跟随系统主题（等同 Auto） |
| **旧版本 localStorage 值（"light"/"dark"）** | 正常识别并应用，不破坏 |

### 5.5 视觉与响应式约束

- **过渡动画**: 背景色、文字色、边框色等 CSS 属性 250ms ease 平滑过渡，不闪烁不跳动
- **对比度**: 深色模式下文字与背景对比度满足 WCAG AA（≥ 4.5:1 正文，≥ 3:1 大字/图标）
- **图片适配**: 深色模式下展示图片适度降低亮度（如 `brightness-90`）或添加半透明暗色遮罩
- **阴影适配**: 深色模式下使用低亮度暗色阴影，避免浅色阴影突兀
- **菜单适配**: 弹出菜单本身需适配暗色模式（背景、文字、高亮项配色协调）

### 5.6 文案与可理解性

| 文案键 | 中文 | 英文 | 用途 |
|--------|------|------|------|
| `common.theme_light` | 浅色模式 | Light | 菜单选项 |
| `common.theme_dark` | 深色模式 | Dark | 菜单选项 |
| `common.theme_auto` | 跟随系统 | Auto | 菜单选项 |
| `common.aria_theme` | 切换主题 | Switch theme | 图标按钮 aria-label |

> 现有 `aria_light` / `aria_dark` 文案保留，新增 `aria_theme` 用于图标按钮统一标签。

## 6. NFR / DFX

| NFR ID | 类别 | 要求 | 验收方法 |
|--------|------|------|----------|
| NFR-001 | 兼容性 | 支持主流现代浏览器（Chrome、Safari、Firefox、Edge 最新版本），兼容 `prefers-color-scheme` 和 `matchMedia` API | 在各浏览器手动验证三态切换及 Auto 跟随 |
| NFR-002 | 性能 | 主题切换不引起明显卡顿或页面重排；Auto 模式 `matchMedia` 事件监听不引起额外性能开销 | 切换主题时观察帧率，确认无明显掉帧 |
| NFR-003 | 稳定性 | localStorage 不可用、matchMedia 不支持等降级场景下应用功能不受影响，不报错 | 模拟 localStorage 禁用和 matchMedia 缺失场景 |
| NFR-004 | 兼容性 | localStorage `theme` 值域扩展（新增 `"auto"`）向后兼容，旧 `"light"/"dark"` 值正常工作 | 清除 localStorage 后设置旧值，验证初始化正确 |
| NFR-005 | 共存性 | 夜间模式与老人模式（`elderly` class）、多语言切换（i18n）兼容共存，不产生样式冲突 | 同时开启两模式验证视觉效果 |

## 7. Open Questions

| ID | 问题 | 影响 | 建议负责人 |
|---|---|---|---|
| OQ-001 | 图片暗色适配具体实现方式（`brightness-90` 滤镜 vs 半透明暗色遮罩层 vs CSS `mix-blend-mode`） | UX 视觉效果 | RD（编码阶段确定） |
| OQ-002 | 阴影暗色适配是否需要新增 `dark:shadow-*` Tailwind 变体或使用 `dark:` 前缀覆盖现有 `shadow-card`/`shadow-float` | 实现方式 | RD（编码阶段确定） |
| OQ-003 | 弹出菜单组件选型——复用现有 Radix UI Dialog 还是新增 Popover/DropdownMenu 组件 | 实现方式 | RD（编码阶段确定） |

> 以上均为实现细节层面的问题，不影响 Spec 的产品行为定义和验收契约，可在编码阶段由 RD 自主决策。

## 8. Traceability

| REQ / NFR ID | UX Design 章节 | 关联组件 / 文件 | QA 重点 |
|---|---|---|---|
| REQ-001 | §5.2-5.3 | `useTheme.ts`, `App.tsx` | 三态切换正确性、旧值兼容 |
| REQ-002 | §5.4 | `useTheme.ts` | Auto 模式实时跟随、监听器生命周期 |
| REQ-003 | §5.2-5.6 | `TopBar.tsx`, `i18n.ts` | 弹出菜单交互、高亮、菜单外点击 |
| REQ-004 | §5.4 | `useTheme.ts`, `index.html` | 持久化恢复、FOUC 一致性、降级 |
| REQ-005 | §5.5 | 全部 9 组件 + App.tsx, `tailwind.config.js`, `index.css` | 深色视觉一致性、对比度、图片/阴影适配 |
| REQ-006 | §5.4 | `useTheme.ts`, `useElderlyMode.ts`, `index.css` | 两模式共存、对比度 |
| REQ-007 | §5.5 | `index.css` | 过渡平滑性、无重排 |
| REQ-008 | §5.6 | `i18n.ts`, `App.tsx` | 语言/主题独立性 |
| NFR-001~005 | §5.5 | — | 浏览器兼容、性能、降级、共存 |
