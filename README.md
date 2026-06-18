# Paint Warehouse Stock Management System

Web-based application to digitize paint stock tracking in a factory warehouse. Replaces manual stock cards with real-time digital tracking across warehouse, sideroom, and office monitoring.

## Features

- **PIN-based login** for all users (warehouse, sideroom, admin)
- **JWT session cookies** (no Supabase Auth dependency)
- **Warehouse module**: Stock-in/out with digital stock cards
- **Sideroom module**: Track leftover paint and disposal
- **Admin dashboard**: Real-time stock overview, usage charts (bar chart), low stock alerts
- **Real-time updates**: Live data via Supabase WebSocket
- **Mobile-friendly**: Touch-optimized UI for operators on tablets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) |
| Deployment | Vercel (frontend), Supabase (backend) |

## Prerequisites

- Node.js 18+
- npm
- Supabase account (free tier works)

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd "Project Stok Cat"
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Create an admin user (see [Deployment Guide](docs/DEPLOYMENT.md))
4. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment

Create/update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-custom-secret-key  # optional, has a default
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

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/              # PIN login page
│   ├── warehouse/          # Warehouse operator UI
│   ├── sideroom/           # Sideroom operator UI
│   ├── dashboard/          # Admin dashboard
│   │   └── _components/    # Dashboard-only presentational components
│   ├── admin/              # Admin management pages
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page (redirects to login)
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   └── shared/             # Shared custom components
├── hooks/                  # Reusable client hooks (data, forms, pagination)
├── lib/
│   ├── supabase/           # Supabase client helpers
│   │   ├── client.ts       # Browser client (Client Components)
│   │   ├── server.ts       # Server client (Server Components/Actions)
│   │   └── middleware.ts   # Session refresh middleware
│   ├── constants.ts        # App-wide constants and labels
│   └── utils.ts            # Utility functions
├── actions/                # Next.js Server Actions
│   ├── auth.ts             # Login/logout/profile actions
│   ├── paint-items.ts      # Paint CRUD actions
│   ├── stock.ts            # Stock query actions
│   ├── transactions.ts     # Stock-in/out/sideroom/dispose actions
│   ├── dashboard.ts        # Dashboard data + usage metrics
│   └── users.ts            # User management actions (admin)
├── types/
│   └── database.ts         # TypeScript types for DB schema
└── middleware.ts           # Next.js middleware (route protection)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flows, auth flow, folder structure |
| [Database](docs/DATABASE.md) | Schema, ERD, tables, RLS policies, triggers |
| [API](docs/API.md) | Server actions reference with parameters and returns |
| [Deployment](docs/DEPLOYMENT.md) | Step-by-step Supabase + Vercel deployment guide |

## Database Setup

Run the SQL in `supabase/schema.sql` via Supabase SQL Editor. This creates:

- **4 tables**: `profiles`, `paint_items`, `stock`, `log`
- **2 enums**: `log_type`, `user_role`
- **4 triggers**: auto-updated timestamps, auto-stock creation, auto-profile creation
- **RLS policies**: role-based access control
- **10 sample paint items** as seed data

## User Roles

| Role | PIN Login | Access |
|------|-----------|--------|
| Warehouse Operator | Yes | Stock-in, Stock-out, view own history |
| Sideroom Operator | Yes | Receive leftover paint, Dispose paint |
| Admin / Office | Yes | Dashboard, charts, reports, manage data & users |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key |
| `JWT_SECRET` | No | Custom secret for JWT session signing |
