---
spec_id: SPEC-DARK-MODE-001
title: 夜间模式（Dark Mode）增强 - 质量卡点
status: draft
template_id: requirement-gate-v1
schema_version: 1
created_at: 2026-09-12
updated_at: 2026-09-12
---

# Gate: 夜间模式（Dark Mode）增强 - 质量卡点

## Summary

本文档为「夜间模式（Dark Mode）增强」Spec（SPEC-DARK-MODE-001）的质量卡点检查，基于需求澄清文档和仓库代码证据，判断 Spec 是否达到可进入下游技术设计与研发执行的标准。需求核心为在现有 light/dark 二态基础上增加 Auto 三态模式、实时系统跟随、弹出菜单交互及深色视觉适配完善，属于纯前端 UX 变更，不涉及 API、后端或数据存储变更。

## Decision

- Status: Approved
- Approved approach: 基于现有 `useTheme.ts` 二态架构扩展为三态（light/dark/auto），`TopBar.tsx` 主题切换改为图标按钮 + 弹出菜单，`index.html` FOUC 脚本同步支持 `"auto"` 值，`i18n.ts` 新增主题菜单文案，全部组件深色视觉适配完善
- Decision owner: AI-Spec生成节点
- Decision date: 2026-09-12

## Acceptance Criteria

- [x] 核心功能点（三态切换、Auto 实时跟随、弹出菜单交互、持久化、视觉适配）均有对应 REQ-* 且可测试
- [x] 职责边界明确——仅修改前端 `src/` 代码，不涉及 `server/`，不涉及 API/后端/数据变更
- [x] localStorage 值域扩展（新增 `"auto"`）的向后兼容性已说明（REQ-001.5、REQ-001.6、NFR-004）
- [x] 降级场景已覆盖（localStorage 不可用、matchMedia 不支持、首次使用空态）
- [x] 边界条件已覆盖（菜单外点击、旧值兼容、老人模式共存、多语言共存）
- [x] 关键路径无 TBD/TODO——3 个 Open Questions 均为实现细节层面（图片适配方式、阴影变体、菜单组件选型），不影响产品行为定义和验收契约
- [x] 每条功能行为对应可测试的 REQ-*，重要验收使用 EARS，关键场景使用 Gherkin
- [x] 差异判断已给出：不涉及产品形态/站点/环境/版本差异（单 SPA 单仓库部署 GitHub Pages）

## Verification

- Tests: 下游 QA 应覆盖三态切换正确性、Auto 实时跟随、持久化恢复、降级场景、共存场景、视觉一致性
- Manual checks: 深色模式视觉一致性需人工在各页面逐一验证（9 组件 + App.tsx）
- CI or automation: 现有 E2E（Playwright `super-spicy.spec.ts`）不涉及主题功能，需新增主题切换相关 E2E 用例
- Additional evidence: 仓库代码确认现有 `dark:` 变体覆盖全部组件（113 处），现有架构（`darkMode: 'class'`、`useTheme` hook、FOUC 脚本）支持扩展

## Blockers

None.

## Changelog

| Time | Status Change | Updated By | Reason |
| --- | --- | --- | --- |
| 2026-09-12 | Created → Approved | AI-Spec生成节点 | Spec 通过质量卡点检查，所有 Acceptance Criteria 满足 |
