# DeliveryAI-Demo（沸点 · 火锅点单概念演示）

## 项目背景

本项目是 [DeliveryAI](https://deliveryai.tech) 产品的示例 Demo 仓库，旨在帮助 DeliveryAI 用户在平台上**快速创建 Demo 空间**，并拥有一份**可修改的示例代码**，从而能够端到端走完一个需求开发的全流程——从需求澄清、设计、编码到测试与发布。

通过将本仓库关联到 DeliveryAI 平台，用户可以获得完整的研发协作体验：

- 🔗 **一键关联仓库**：在 DeliveryAI 平台上绑定本仓库，即可获得预置的 Demo 空间。
- 📝 **可修改的示例代码**：仓库包含一个完整的火锅点单 Demo 应用，用户可以基于此理解项目结构并进行二次开发。
- 🚀 **全流程体验**：从需求创建、任务分配、代码开发到 MR（Merge Request）合并，覆盖完整研发协作链路。

## 技术栈

本项目采用前后端分离架构，技术栈如下：

### 前端

| 技术 | 说明 |
|------|------|
| **React 18** | 核心框架，构建交互式 UI |
| **TypeScript** | 类型安全，提升代码可维护性 |
| **Vite** | 构建工具，提供快速的开发热更新 |
| **Tailwind CSS** | 原子化 CSS 框架，快速实现自定义样式 |
| **Radix UI** | 无障碍基础组件库（Dialog、Tabs 等） |
| **i18next** | 国际化方案，支持中英文切换 |
| **Lucide React** | 图标库 |
| **Playwright** | 端到端测试框架 |

### 后端

| 技术 | 说明 |
|------|------|
| **Express** | Node.js Web 服务框架 |
| **TypeScript** | 类型安全 |
| **tsx** | TypeScript 运行时，支持开发热更新 |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）或 npm

### 安装与运行

```bash
# 安装前端依赖
pnpm install

# 启动前端开发服务器
pnpm dev

# 启动后端服务（可选，单独终端）
cd server
pnpm install
pnpm dev
```

前端开发服务器默认运行在 `http://localhost:5173`。

## 项目结构

```
.
├── src/                  # 前端源码
│   ├── components/       # React 组件（菜单、购物车、订单等）
│   ├── data/             # 示例数据
│   ├── hooks/            # 自定义 Hooks（主题、适老模式）
│   ├── state/            # 状态管理（Reducer 模式）
│   └── lib/              # 工具函数
├── server/               # 后端服务
│   └── src/              # Express 服务源码
├── e2e/                  # 端到端测试
├── public/               # 静态资源
├── index.html            # 应用入口
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # Tailwind CSS 配置
└── package.json          # 项目依赖与脚本
```

## 在 DeliveryAI 平台中使用

1. 在 DeliveryAI 平台创建项目时，选择关联本仓库。
2. 平台将自动创建 Demo 空间并初始化研发协作流程。
3. 用户可基于此示例代码进行需求开发，体验从需求到上线的完整流程。

## License

MIT
