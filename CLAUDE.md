# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

**gateway-edit** is a Next.js-based Bible translation editing and harmonization platform. It allows teams to edit, align, and harmonize Scripture and translation helps using a Gitea-backed collaboration system.

## Commands

```bash
# Development
yarn dev            # Start Next.js dev server (sources env via scripts/set-env.sh)
yarn dev:vite       # Alternative Vite-based dev server

# Build
yarn build          # Production Next.js build (static export to out/)
yarn build:vite     # Vite build

# Testing
yarn test:unit          # Jest unit tests with coverage (outputs to jest-coverage/)
yarn test:unit-nocov    # Jest without coverage
yarn test:headless      # Cypress headless E2E tests
yarn cypress            # Cypress interactive UI

# Run a single Jest test file
npx jest path/to/test.file.js

# Combined coverage report (merges Jest + Cypress)
yarn report:combined
```

Cypress tests require a `cypress.env.json` file with `TEST_USERNAME` and `TEST_PASSWORD`.

## Architecture

### Application Tree

```
_app.jsx (ThemeProvider → SnackbarProvider → AuthContextProvider → StoreContextProvider)
└── Layout (Header + Drawer + Footer)
    ├── WorkspaceContainer  (main page: pages/index.js)
    └── AccountSettings     (settings page: pages/settings.jsx)
```

### State Management: Two-Context Pattern

- **AuthContext** (`src/context/AuthContext.jsx`) — authentication via Gitea API, token persisted in IndexedDB via `localforage`. Wraps `gitea-react-toolkit`'s `AuthenticationContextProvider`.
- **StoreContext** (`src/context/StoreContext.jsx`) — app-wide state (card data, merge status, user preferences), synced to localStorage via `useLocalStorage` / `useUserLocalStorage` hooks.

### Key Subsystems

| Subsystem | Location | Notes |
|-----------|----------|-------|
| Authentication | `src/context/AuthContext.jsx` | Gitea API, server selection (prod vs QA) |
| Workspace / Cards | `src/components/WorkspaceContainer*` | Resource and Scripture editing cards |
| Scripture display | via `single-scripture-rcl` | Bible reference navigation |
| Translation helps | via `translation-helps-rcl` | TN, TW, TA resource cards |
| Word alignment | via `word-aligner-rcl`, `enhanced-word-aligner-rcl` | Alignment editing UI |
| Lexicon lookup | `src/hooks/useLexicon.js` | Word/phrase definitions |
| Network/API | `src/utils/network.js` | Authenticated fetch, server health, error detection |
| Feedback | `pages/api/feedback.js` + `src/common/sendFeedback.js` | SendGrid-backed feedback submission |

### Path Aliases

Both Next.js (`jsconfig.json`) and Vite (`vite.config.js`) resolve these aliases:

| Alias | Path |
|-------|------|
| `@components` | `src/components` |
| `@context` | `src/context` |
| `@hooks` | `src/hooks` |
| `@utils` | `src/utils` |
| `@common` | `src/common` |
| `@styles` | `src/styles` |

### Backend Communication

All API calls go through `doFetch` (from `gitea-react-toolkit`) targeting a Gitea-compatible REST API (`{server}/api/v1/...`). The active server URL is configurable via URL query params or localStorage (`SERVER_KEY`). Network error handling (disconnection, auth expiry, server unreachable) is centralized in `src/utils/network.js`.

### RCL Libraries (Reusable Component Libraries)

This app is a consumer of several `*-rcl` packages. For local development of those packages, `vite.config.js` supports path overrides so you can point imports at local checkouts instead of `node_modules`.

### Next.js Specifics

- `next.config.js` uses `worker-loader` for `.worker.js` files and ignores `canvas`.
- `yarn build` exports a static site to `out/` (trailing slashes enabled).
- Web Workers live in `src/workers/`.
