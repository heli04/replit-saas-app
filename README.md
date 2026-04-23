# Pulse — SaaS Subscription Analytics Dashboard

A modern, dark-mode-first analytics dashboard for B2B SaaS founders to track MRR, active users, churn, and revenue trends.

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — dev server and bundler
- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — Radix-based accessible component primitives
- **Recharts** — interactive line/area charts
- **TanStack Query (React Query)** — server-state caching and fetching
- **Wouter** — lightweight client-side router
- **Lucide React** — icon set
- **date-fns** — date formatting

### Backend
- **Node.js 24** + **TypeScript**
- **Express 5** — HTTP framework
- **Drizzle ORM** + **PostgreSQL** — database access
- **Zod** — runtime validation for requests/responses
- **Pino** + **pino-http** — structured logging
- **esbuild** — server bundler

### Shared / Tooling
- **pnpm workspaces** — monorepo package management
- **OpenAPI 3.1** — single source of truth for API contracts
- **Orval** — generates typed React Query hooks and Zod schemas from the OpenAPI spec

---

## Repository Structure

```
.
├── artifacts/
│   ├── api-server/           # Express API (TypeScript)
│   │   └── src/
│   │       ├── app.ts            # Express app: middleware + router mount
│   │       ├── index.ts          # Server entry point (reads PORT)
│   │       ├── seed.ts           # Sample data seeder
│   │       ├── lib/logger.ts     # Pino logger singleton
│   │       └── routes/
│   │           ├── index.ts      # Combines all routers under /api
│   │           ├── health.ts     # GET /api/healthz
│   │           ├── customers.ts  # CRUD for customers
│   │           ├── metrics.ts    # KPI cards, revenue series, plan breakdown, activity
│   │           └── revenue.ts    # Revenue log listing
│   │
│   └── dashboard/            # React + Vite frontend
│       └── src/
│           ├── App.tsx                         # Router + QueryClient providers
│           ├── main.tsx                        # React root
│           ├── index.css                       # Tailwind + dark theme tokens
│           ├── components/
│           │   ├── layout/shell.tsx            # Sidebar + page shell
│           │   ├── theme-provider.tsx          # Dark/light mode
│           │   └── ui/*                        # shadcn/ui primitives
│           ├── hooks/                          # Reusable React hooks
│           ├── lib/utils.ts                    # `cn()` Tailwind class merger
│           └── pages/
│               ├── overview.tsx                # 4 stat cards + revenue chart + activity
│               ├── customers.tsx               # Searchable customer table
│               ├── customer-detail.tsx         # Per-customer view + LTV
│               ├── revenue.tsx                 # Revenue chart + log entries
│               ├── settings.tsx                # Profile/workspace/preferences
│               └── not-found.tsx
│
├── lib/
│   ├── api-spec/             # OpenAPI source of truth
│   │   ├── openapi.yaml          # All endpoints + schemas defined here
│   │   └── orval.config.ts       # Codegen config
│   │
│   ├── api-client-react/     # Generated React Query hooks (DO NOT edit by hand)
│   │   └── src/generated/
│   │       ├── api.ts            # useGetOverviewMetrics, useListCustomers, etc.
│   │       └── api.schemas.ts    # Generated TS types
│   │
│   ├── api-zod/              # Generated Zod schemas (DO NOT edit by hand)
│   │   └── src/generated/api.ts
│   │
│   └── db/                   # Drizzle ORM + schema
│       ├── drizzle.config.ts
│       └── src/
│           ├── index.ts          # `db` and `pool` exports
│           └── schema/
│               ├── customers.ts      # customers table
│               └── revenueLogs.ts    # revenue_logs table
│
├── scripts/                 # Repo utility scripts
├── package.json             # Root scripts
├── pnpm-workspace.yaml      # Workspace + dependency catalog
└── tsconfig.base.json       # Shared TS config
```

---

## Database Schema

### `customers`
| Column      | Type                       | Notes                              |
|-------------|----------------------------|------------------------------------|
| id          | serial PK                  |                                    |
| name        | text                       | NOT NULL                           |
| email       | text                       | NOT NULL, UNIQUE                   |
| status      | text                       | `active` \| `inactive`             |
| plan        | text                       | e.g. Starter, Growth, Pro, Enterprise |
| mrr_cents   | integer                    | MRR stored in cents                |
| created_at  | timestamptz                | defaults to NOW()                  |

### `revenue_logs`
| Column        | Type        | Notes                                       |
|---------------|-------------|---------------------------------------------|
| id            | serial PK   |                                             |
| customer_id   | integer FK  | references `customers.id`, ON DELETE CASCADE |
| amount_cents  | integer     | positive (charge) or negative (refund)      |
| type          | text        | `subscription` \| `one_time` \| `refund`    |
| occurred_at   | timestamptz | defaults to NOW()                           |

---

## API Endpoints

All endpoints are mounted under `/api`.

| Method | Path                           | Purpose                                                  |
|--------|--------------------------------|----------------------------------------------------------|
| GET    | `/healthz`                     | Health probe                                             |
| GET    | `/metrics/overview`            | Returns 4 stat cards: MRR, Active Users, Churn, Avg Revenue (with month-over-month delta + trend) |
| GET    | `/metrics/revenue-series`      | Last 12 months of revenue (one entry per month)          |
| GET    | `/metrics/plan-breakdown`      | Active customer count + revenue grouped by plan          |
| GET    | `/metrics/recent-activity`     | Recent payments, signups, churn events (merged feed)     |
| GET    | `/customers?search=&status=`   | List customers, optionally filtered                      |
| POST   | `/customers`                   | Create a customer                                        |
| GET    | `/customers/:id`               | Customer detail + lifetime value + recent revenue        |
| GET    | `/revenue?limit=`              | Recent revenue log entries with customer name            |

The OpenAPI spec at `lib/api-spec/openapi.yaml` is the single source of truth — when it changes, regenerate the typed client and Zod schemas.

---

## Frontend Pages

| Route             | File                          | Purpose                                                  |
|-------------------|-------------------------------|----------------------------------------------------------|
| `/`               | `pages/overview.tsx`          | 4 KPI cards (green/red trends), 12-month revenue chart, plan breakdown, activity feed |
| `/customers`      | `pages/customers.tsx`         | Searchable + status-filterable table, "View Details" action, create-customer dialog |
| `/customers/:id`  | `pages/customer-detail.tsx`   | Customer profile, lifetime value, recent revenue logs    |
| `/revenue`        | `pages/revenue.tsx`           | Revenue chart + paginated log entries                    |
| `/settings`       | `pages/settings.tsx`          | Profile, workspace, preferences (visual only)            |

---

## Key Files Explained

- **`artifacts/api-server/src/app.ts`** — Configures Express with CORS, JSON body parsing, structured request logging, and mounts the router under `/api`.
- **`artifacts/api-server/src/routes/metrics.ts`** — Computes KPI cards by aggregating `revenue_logs` and `customers`, comparing this month vs last month for delta percentages.
- **`artifacts/api-server/src/routes/customers.ts`** — Search uses `ILIKE` on `name` and `email`; status filter uses an exact match.
- **`artifacts/api-server/src/seed.ts`** — Generates ~48 customers and ~400 revenue logs spanning the last 12 months so the dashboard isn't empty on first run.
- **`artifacts/dashboard/src/App.tsx`** — Sets up the React Query client, wraps routes in providers, and configures Wouter with the proper base path.
- **`artifacts/dashboard/src/components/layout/shell.tsx`** — Persistent left sidebar (Overview, Customers, Revenue, Settings) and main content area.
- **`artifacts/dashboard/src/index.css`** — All theme tokens (HSL color variables) for both light and dark modes; dark-first.
- **`lib/db/src/index.ts`** — Exports a single `db` Drizzle client and connection `pool` reading from `DATABASE_URL`.

---

## Local Development

Install dependencies (root):
```bash
pnpm install
```

Run individual services (handled by Replit workflows in this environment):
```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/dashboard run dev
```

Push DB schema changes (development only):
```bash
pnpm --filter @workspace/db run push
```

Regenerate API client + Zod after editing `openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```

Type-check the whole repo:
```bash
pnpm run typecheck
```

---

## Environment Variables

| Variable        | Used by         | Notes                                |
|-----------------|-----------------|--------------------------------------|
| `DATABASE_URL`  | api-server, db  | Postgres connection string (auto-provisioned in Replit) |
| `PORT`          | api-server, web | Service port (set by the workflow)   |
| `BASE_PATH`     | dashboard       | URL prefix for the frontend          |
| `SESSION_SECRET`| reserved        | For future auth work                 |

---

## Conventions

- **Money** is stored in cents in the DB and converted to dollars at the API boundary.
- **Trends**: `positiveIsGood: false` on the Churn card means a *down* trend renders green; everything else uses the standard up=green / down=red rule.
- **No console.log in server code** — use `req.log` in route handlers and the singleton `logger` elsewhere.
- **Generated files** (under `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`) are not edited by hand; change `openapi.yaml` and re-run codegen.
