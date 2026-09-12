# AGENTS.md

Guidelines for AI coding agents working in the **DeliveryAI-Demo** repository.

---

## Project Overview

DeliveryAI-Demo (沸点 · 火锅点单概念演示) is a concept demo for a hotpot ordering and store-fulfillment application. It serves as a sample repository for the [DeliveryAI](https://console.volcengine.com/agentkit) platform (Volcano Engine Ark · AgentKit), allowing users to quickly spin up a demo workspace and experience an end-to-end development workflow.

The project uses a **frontend-backend separation** architecture:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Radix UI + i18next + Lucide icons
- **Backend**: Express + TypeScript (minimal, runs via `tsx`)
- **E2E tests**: Playwright

---

## Build Commands

### Frontend (repository root)

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Start dev server | `pnpm dev` (runs `vite --host 0.0.0.0`, serves at `http://localhost:5173`) |
| Production build | `pnpm build` (runs `tsc -b && vite build`) |
| Lint | `pnpm lint` (runs `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`) |

> `npm` can be substituted for `pnpm` (a `package-lock.json` is also present), but `pnpm` is recommended (a `pnpm-lock.yaml` and `pnpm-workspace.yaml` exist).

### Backend (`server/`)

| Task | Command |
|------|---------|
| Install dependencies | `cd server && pnpm install` |
| Start dev server | `cd server && pnpm dev` (runs `tsx watch src/index.ts`, listens on port **3001**) |
| Build | `cd server && pnpm build` (runs `tsc`, outputs to `server/dist/`) |
| Start production server | `cd server && pnpm start` (runs `node dist/index.js`) |
| Type-check only | `cd server && pnpm typecheck` (runs `tsc --noEmit`) |

### E2E Tests (repository root)

| Task | Command |
|------|---------|
| Run Playwright tests | `npx playwright test` |
| View HTML report | Open `e2e-report/html/index.html` after a run |

Playwright is configured in `playwright.config.ts`:
- Test directory: `./e2e`
- Base URL: `http://localhost:5173`
- Runs against Chromium (system path `/usr/bin/chromium-browser` in CI)
- Single worker, no parallelism, 60 s timeout per test
- Automatically starts the dev server via `npm run dev` if not already running

---

## Lint & Type-Check Commands

| Scope | Command |
|-------|---------|
| Frontend lint | `pnpm lint` |
| Frontend type-check | `npx tsc -b --noEmit` (or `npx tsc --noEmit` against `tsconfig.app.json`) |
| Backend type-check | `cd server && pnpm typecheck` |

The ESLint config (`eslint.config.js`) uses `typescript-eslint` with recommended rules plus `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. Lint runs with **zero warnings allowed** (`--max-warnings 0`).

---

## Code Style Conventions

- **Language**: TypeScript throughout (frontend and backend). `allowJs: false` on the frontend.
- **Strictness**: `strict: true` in all `tsconfig` files. Write fully typed code.
- **Module system**: ESM (`"type": "module"` in both `package.json` files).
- **Imports**: Use the `@/` path alias for frontend source files (configured in both `tsconfig.app.json` and `vite.config.ts`). Example: `import { App } from '@/App'`.
- **Component exports**: React components use named exports (e.g., `export function MenuView()`), not default exports, except for `App` which uses `export default`.
- **State management**: Use a single `useReducer` with a typed `orderReducer` (`src/state/orderReducer.ts`) and a discriminated-union `AppAction` type. No external state library.
- **Styling**: Tailwind CSS utility classes. Use the `cn()` utility from `src/lib/utils.ts` for conditional class merging (`clsx` + `tailwind-merge`).
- **Custom Tailwind theme**: Domain-specific color tokens (`rice`, `chili`, `amber`, `charcoal`), custom shadows (`card`, `float`), and a `rise` animation are defined in `tailwind.config.js`. Dark mode uses `class` strategy (`darkMode: 'class'`).
- **Internationalization**: All user-facing strings go through `i18next` (`t()` function). Translations are initialized in `src/i18n.ts`. Do not hardcode user-facing text.
- **Currency formatting**: Use the `money()` utility from `src/lib/utils.ts` for all price displays. Supports CNY (¥) and USD ($) with a fixed 7:1 conversion rate.
- **Error handling in hooks**: `localStorage` access is wrapped in try/catch and silently degrades to in-memory state (see `useTheme`, `useElderlyMode`, `useCurrency`). Follow this pattern for any new browser-API-dependent hooks.
- **Comments**: JSDoc comments (in Chinese) are used for function documentation. Match the existing style.
- **Naming**: `camelCase` for variables/functions, `PascalCase` for components and types/interfaces, `kebab-case` not used.

---

## Project Structure

```
.
├── src/                       # Frontend source (React + TypeScript)
│   ├── components/            # Feature components (MenuView, CartPanel, OrderView, etc.)
│   │   └── ui/                # Reusable UI primitives (button, dialog — Radix-based)
│   ├── data/                  # Static demo data (menu.ts)
│   ├── hooks/                 # Custom hooks (useTheme, useElderlyMode, useCurrency)
│   ├── state/                 # Reducer-based state management (orderReducer.ts)
│   ├── lib/                   # Utilities (cn, money formatting)
│   ├── assets/                # Static images (hotpot, broth, beef, vegetables)
│   ├── App.tsx                # Root component, wires up reducer + views
│   ├── main.tsx               # Entry point, renders <App/> into #root
│   ├── i18n.ts                # i18next initialization
│   ├── types.ts               # Shared TypeScript types (AppState, AppAction, Product, etc.)
│   ├── index.css             # Global styles + Tailwind directives
│   └── vite-env.d.ts          # Vite type declarations
├── server/                    # Backend (Express + TypeScript)
│   ├── src/
│   │   └── index.ts           # Express server entry (port 3001, /ping endpoint)
│   ├── tsconfig.json          # Backend TS config (NodeNext, ES2022, strict)
│   └── package.json
├── e2e/                       # Playwright E2E tests
│   ├── dual-currency.spec.ts
│   ├── dark-mode.spec.ts
│   └── super-spicy.spec.ts
├── public/                    # Static assets served by Vite
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite config (React plugin, @ alias, base: './')
├── tailwind.config.js          # Tailwind config (custom theme, darkMode: 'class')
├── postcss.config.js           # PostCSS (Tailwind + Autoprefixer)
├── eslint.config.js            # ESLint flat config (TS + React Hooks + React Refresh)
├── tsconfig.json              # Root TS config (references app + node configs)
├── tsconfig.app.json           # Frontend TS config (ES2020, strict, @/* path alias)
├── tsconfig.node.json          # Vite config TS config
├── playwright.config.ts       # Playwright config
├── site.meta                  # DeliveryAI platform metadata
├── .vefaasignore               # veFaaS packaging ignore patterns
├── pnpm-workspace.yaml        # pnpm workspace config
└── package.json               # Frontend dependencies and scripts
```

### Key Files to Understand

- **`src/types.ts`** — Central type definitions (`AppState`, `AppAction`, `Product`, `CartItem`, `OrderStage`, `ViewName`, `Currency`). All state shapes and actions are defined here.
- **`src/state/orderReducer.ts`** — The application's core state machine. Handles table binding, cart operations, order submission, stage transitions, service calls, and payment.
- **`src/App.tsx`** — Root component that wires together all views, the reducer, and custom hooks. Contains view routing logic based on `state.view`.
- **`src/data/menu.ts`** — Demo product data (hotpot dishes, broths, ingredients).
- **`src/i18n.ts`** — i18next setup with Chinese/English translations.

### Application Flow

1. **Bind table** (`BindTable`) → 2. **Welcome** (`WelcomeView`) → 3. **Menu** (`MenuView` + `CartPanel`) → 4. **Order tracking** (`OrderView`) → 5. **Checkout** (`CheckoutView`) → **Reset** returns to step 1.

Additional panels: `TopBar` (theme/currency/elderly toggles), `ServiceSheet` (call service), `DemoConsole` (admin controls for stage/sold-out simulation).

---

## Important Notes

- **Dual package managers**: Both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm) exist. Use `pnpm` as the primary package manager to match the workspace config.
- **Backend is optional**: The Express server is minimal (a single `/ping` endpoint) and is not connected to the frontend. The frontend runs entirely on client-side state with static demo data.
- **Build base path**: `vite.config.ts` sets `base: './'` (relative paths), meaning the build output can be served from any subdirectory. Keep this in mind when modifying routing or asset loading.
- **Preview mode**: The app supports a `?preview=menu` query param that pre-fills a cart and navigates directly to the menu view (see `createPreviewState()` in `App.tsx`).
- **Dark mode & elderly mode**: Both are toggled by adding/removing classes on `document.documentElement` (`dark` and `elderly`). Theme preference persists in `localStorage` under keys `theme`, `elderly-mode`, and `currency`.
- **No test runner for unit tests**: Only Playwright E2E tests exist (`e2e/`). There is no Jest/Vitest configuration. If adding unit tests, introduce a runner and add the corresponding script to `package.json`.
- **DeliveryAI platform integration**: This repo is designed to be linked to the DeliveryAI platform. The `site.meta` file contains platform metadata. Do not remove or modify `site.meta` or `.vefaasignore` unless intentionally changing platform integration.
- **i18next is used at module scope**: `src/state/orderReducer.ts` imports `i18next` directly (not via React hooks) to translate messages outside of components. Be aware that translations are resolved at dispatch time, not render time.
- **Composite TypeScript project**: The root `tsconfig.json` uses project references (`tsconfig.app.json` + `tsconfig.node.json`). Run `tsc -b` (build mode) rather than plain `tsc` for the frontend.
