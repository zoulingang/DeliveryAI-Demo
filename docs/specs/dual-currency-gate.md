---
spec_id: SPEC-DUAL-CURRENCY-001
title: 人民币和美金双币种价格展示与切换 - 质量卡点
status: draft
template_id: requirement-gate-v1
schema_version: 1
created_at: 2026-09-12
updated_at: 2026-09-12
---

# Gate: 人民币和美金双币种价格展示与切换 - 质量卡点

## Summary

本文档为「人民币和美金双币种价格展示与切换」Spec（SPEC-DUAL-CURRENCY-001）的质量卡点检查，基于需求澄清文档和仓库代码证据，判断 Spec 是否达到可进入下游技术设计与研发执行的标准。需求核心为在前端展示层增加 CNY/USD 双币种切换能力，新增 `useCurrency` hook 管理币种状态，扩展 `money()` 函数支持币种换算，全站 5 个价格展示点同步更新，折扣规则和优惠券文案展示层换算，数据层始终保持 CNY 基准不变。属于纯前端 UX 变更，不涉及 API、后端或数据存储变更。

## Decision

- Status: Approved
- Approved approach: 新增 `useCurrency` hook（参照 `useTheme` / `useElderlyMode` 模式），扩展 `money()` 函数支持币种参数，全站 5 个调用点传入当前币种，CheckoutView 折扣展示层换算（底层数据判断不变），`i18n.ts` 优惠券文案金额参数化，TopBar 新增币种切换入口
- Decision owner: AI-Spec生成节点
- Decision date: 2026-09-12

## Acceptance Criteria

- [x] 核心功能点（双币种格式化换算、全站价格同步、折扣展示换算、优惠券文案换算、切换入口交互、状态持久化）均有对应 REQ-* 且可测试
- [x] 职责边界明确——仅修改前端 `src/` 代码，不涉及 `server/`，不涉及 API/后端/数据变更
- [x] 固定汇率 1 USD = 7 CNY 的换算规则与精度（两位小数四舍五入）已明确（REQ-001、REQ-003）
- [x] 折扣规则展示层换算与底层数据判断的分离已说明（REQ-004.2：底层数据判断始终以 CNY 为准）
- [x] 降级场景已覆盖（localStorage 不可用时降级为内存态，REQ-007.3）
- [x] 边界条件已覆盖（零值展示、首次使用默认 CNY、刷新恢复、空购物车）
- [x] 关键路径无 TBD/TODO——3 个 Open Questions 均为实现细节层面（切换入口交互形式、文案格式、过渡动画），不影响产品行为定义和验收契约
- [x] 每条功能行为对应可测试的 REQ-*，重要验收使用 EARS，关键场景使用 Gherkin
- [x] 差异判断已给出：不涉及产品形态/站点/环境/版本差异（单 SPA 单仓库部署 GitHub Pages）

## Verification

- Tests: 下游 QA 应覆盖双币种切换正确性、换算精度、全站价格同步、折扣换算、持久化恢复、降级场景、共存场景
- Manual checks: 全站价格同步更新需人工在各页面逐一验证（App.tsx 底部栏、MenuView、CartPanel、OrderView、CheckoutView）
- CI or automation: 现有 E2E（Playwright `super-spicy.spec.ts`、`dark-mode.spec.ts`）不涉及币种功能，需新增币种切换相关 E2E 用例
- Additional evidence: 仓库代码确认 `money()` 函数当前硬编码 `¥`，`useTheme` / `useElderlyMode` 提供 localStorage + 降级 hook 模式可复用，`TopBar.tsx` 现有多个切换入口可并列新增

## Blockers

None.

## Changelog

| Time | Status Change | Updated By | Reason |
| --- | --- | --- | --- |
| 2026-09-12 | Created → Approved | AI-Spec生成节点 | Spec 通过质量卡点检查，所有 Acceptance Criteria 满足 |
