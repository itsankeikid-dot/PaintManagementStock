# Paint Warehouse Stock Management System

Web-based application to digitize paint stock tracking in a factory warehouse. Replaces manual stock cards with real-time digital tracking across warehouse, sideroom, and office monitoring.

## Features

- **PIN-based login** with bcrypt hashing (no Supabase Auth dependency)
- **JWT session cookies** for stateless authentication
- **Warehouse module**: Stock-in with can-to-kg conversion
- **Sideroom module**: Stock-out, residual return reconciliation, and disposal
- **Admin dashboard**: Real-time stock overview, daily usage bar charts, low stock alerts, CSV export
- **Real-time updates**: Live data via Supabase WebSocket (debounced refetch)
- **Role-based access**: Warehouse, Sideroom, Admin, and Office roles with server-side guards
- **Mobile-friendly**: Touch-optimized UI for operators on tablets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| Charts | Recharts |
| Backend/DB | Supabase (PostgreSQL + Realtime) |
| Auth | Custom JWT (jose) + bcrypt PIN hashing |
| Deployment | Cloudflare Workers (via OpenNext.js), Supabase |

## Prerequisites

- Node.js 18.18+
- npm
- Supabase account (free tier works)
- Cloudflare account (free tier works, for deployment)

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd PaintManagementStock
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Run each migration file in `supabase/migrations/` in order (001–006)
4. Copy your project URL, anon key, and service role key from **Settings > API**

### 3. Configure environment

Create/update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-custom-secret-key
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run preview` | Preview locally with Cloudflare Worker |

## Folder Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── login/                  # PIN login page
│   ├── warehouse/              # Warehouse operator UI (Stock In)
│   ├── sideroom/               # Sideroom operator UI (Stock Out, Residual, Dispose)
│   │   └── _components/        # Tab forms + confirmation dialogs
│   ├── dashboard/              # Admin dashboard
│   │   └── _components/        # Dashboard-only presentational components
│   ├── admin/                  # Admin management pages
│   │   ├── users/              # User management (+ _components/)
│   │   └── paint-items/        # Paint master data (+ _components/)
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page (redirects by role)
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── shared/                 # Shared custom components
│       ├── activity-feed.tsx   # Paginated activity log (uses usePaginatedSearch)
│       ├── app-header.tsx      # Top navigation bar
│       ├── crud-dialog.tsx     # Reusable CRUD dialog wrapper
│       ├── page-layout.tsx     # Server component layout (AppHeader + main)
│       ├── pin-indicator.tsx   # PIN strength bar indicator
│       └── stat-card.tsx       # Summary stat card
├── hooks/                      # Reusable client hooks
│   ├── use-realtime-subscription.ts  # Shared Supabase Realtime hook
│   ├── use-dashboard-data.ts         # Dashboard fetch + Realtime
│   ├── use-daily-usage.ts            # Chart date-range + usage fetch
│   ├── use-dashboard-export.ts       # Dashboard CSV export
│   ├── use-paint-items.ts            # Paint item CRUD + search
│   ├── use-users.ts                  # User CRUD + search
│   ├── use-transaction-form.ts       # Transaction form logic + Realtime
│   └── use-paginated-search.ts       # Filter + pagination helper
├── lib/
│   ├── supabase/               # Supabase client helpers
│   │   ├── client.ts           # Browser client (anon key)
│   │   └── admin.ts            # Admin client (service role key, server-only)
│   ├── auth-guard.ts           # Server-side requireRole() auth guard
│   ├── role-config.tsx         # Centralized role metadata (labels, routes, styles, icons)
│   ├── constants.ts            # App-wide constants (log type labels/colors, thresholds)
│   ├── format-utils.ts         # Unified formatQty() for all stock values
│   ├── csv-utils.ts            # CSV export utilities
│   ├── date-utils.ts           # Date/timezone utilities (WIB)
│   ├── session.ts              # JWT session management
│   └── utils.ts                # General utility functions
├── actions/                    # Next.js Server Actions
│   ├── auth.ts                 # PIN login, logout, profile
│   ├── paint-items.ts          # Paint CRUD
│   ├── stock.ts                # Stock queries
│   ├── transactions.ts         # All stock movement transactions
│   ├── dashboard.ts            # Dashboard stats + metrics
│   └── users.ts                # User management
└── types/
    └── database.ts             # TypeScript DB types (+ DashboardStats, RealtimeStatus)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flows, auth, folder structure, Realtime |
| [Database](docs/DATABASE.md) | Schema, ERD, tables, enums, RLS policies, triggers |
| [API](docs/API.md) | Server actions reference with parameters and returns |
| [Hooks & Supabase](docs/HOOKS-AND-SUPABASE.md) | Custom hooks guide and Supabase connection explanation |
| [Deployment](docs/DEPLOYMENT.md) | Step-by-step Supabase + Cloudflare Workers deployment guide |

## Database Setup

Run the SQL in `supabase/schema.sql` via Supabase SQL Editor. This creates:

- **4 tables**: `users`, `paint_items`, `stock`, `log`
- **2 enums**: `log_type`, `user_role`
- **3 triggers**: auto-updated timestamps, auto-stock creation on new paint item
- **RLS policies**: role-based access control (see migration `004_enable_rls.sql`)
- **10 sample paint items** and **3 seed users** as seed data

## User Roles

| Role | Page | Access |
|------|------|--------|
| Warehouse Operator | `/warehouse` | Stock-in only (receiving new paint) |
| Sideroom Operator | `/sideroom` | Stock-out, residual return, dispose |
| Admin | `/dashboard`, `/admin/*` | Full access: dashboard, charts, manage data & users |
| Office | `/dashboard` | Dashboard monitoring and reports (read-only) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only, bypasses RLS) |
| `JWT_SECRET` | Yes | Strong random secret for JWT session signing |
