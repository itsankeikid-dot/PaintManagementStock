# API Documentation

## Overview

The application uses **Next.js Server Actions** for all backend operations. Server actions use a Supabase admin client (service role key) that bypasses RLS, providing type-safe database operations without separate API routes.

All server actions are located in `src/actions/`.

---

## Architecture Overview

### Why Are There No REST API Endpoints?

This project does **not** use traditional REST API routes (no `GET /api/items`, `POST /api/stock`, etc.). Instead, it leverages **Next.js Server Actions**, which are server-side functions that can be called directly from client-side code.

For backend developers coming from Express, Django, or similar frameworks: think of each exported server action function as an "endpoint" — it has its own input contract, authorization checks, and return type, but it's invoked via an RPC-style call rather than an HTTP request to a URL.

### Communication Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser (Client Component)                                          │
│                                                                      │
│   usePaintItems()  ──import──►  getPaintItems()                      │
│   useDashboardData() ──import──►  getDashboardStats()                │
│   useTransactionForm() ──import──►  createStockIn()                  │
│                                        │                             │
└────────────────────────────────────────┼─────────────────────────────┘
                                         │  Next.js serializes the call
                                         │  as a POST to /_next/server-actions/...
                                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Server (Node.js / Edge Runtime)                                     │
│                                                                      │
│   src/actions/*.ts  ("use server" directive)                         │
│        │                                                             │
│        ├── requireRole() → JWT session verification                  │
│        └── createAdminClient() → Supabase service-role client        │
│                                        │                             │
└────────────────────────────────────────┼─────────────────────────────┘
                                         │  Standard Supabase SDK calls
                                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + Realtime + Auth)                             │
│                                                                      │
│   Tables: paint_items, stock, logs, users                            │
│   Triggers: auto-create stock row on new paint item                  │
│   Realtime: broadcasts changes to subscribed clients                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

#### 1. Server Actions = Your "Endpoints"

Every function marked with `"use server"` at the top of its file is a server action. Next.js automatically generates an internal HTTP POST endpoint for it and wires up the client-side import to call that endpoint.

```typescript
// src/actions/paint-items.ts
"use server";

export async function getPaintItems(activeOnly = true): Promise<PaintItem[]> {
  // This runs ONLY on the server.
  // The browser never sees this code.
  const supabase = createAdminClient();
  const { data } = await supabase.from("paint_items").select("*");
  return data || [];
}
```

From the client side, you simply import and call it:

```typescript
// src/hooks/use-paint-items.ts
"use client";

import { getPaintItems } from "@/actions/paint-items";

// Inside a hook or component:
const items = await getPaintItems(true);
```

Next.js handles the serialization, network request, and deserialization automatically.

#### 2. Two Supabase Clients

| Client | File | Key Used | Purpose |
|--------|------|----------|----------|
| **Admin (server)** | `src/lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Used inside server actions. Bypasses RLS. Full database access. |
| **Browser (client)** | `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used only for **Realtime subscriptions** in the browser. Subject to RLS. |

> ⚠️ The service role key is **never** exposed to the browser. It only exists in server-side environment variables.

#### 3. Authentication Model

Authentication is **custom PIN-based**, not Supabase Auth:

- User enters a 4-digit PIN on the login page
- `loginWithPin()` looks up the `users` table, verifies the PIN (bcrypt)
- On success, a **JWT** is signed and stored as an `httpOnly` cookie (`paint_stock_session`)
- Subsequent server actions call `getSession()` or `requireRole()` to verify the cookie
- Supabase Auth is not used for user sessions — the `anon` key is only used for Realtime

```
Login Flow:
  Browser → loginWithPin(pin) → [server: verify PIN] → set JWT cookie → redirect

Subsequent Requests:
  Browser → any server action → [server: read JWT from cookie] → execute query
```

#### 4. Realtime Subscriptions (The Exception)

The **only** place the browser talks directly to Supabase is for **Realtime**:

```typescript
// src/hooks/use-realtime-subscription.ts
const supabase = createClient(); // browser client with anon key
supabase
  .channel("dashboard")
  .on("postgres_changes", { event: "*", schema: "public", table: "stock" }, refetch)
  .subscribe();
```

When any server action modifies data (e.g., `createStockIn`), PostgreSQL triggers fire, Supabase Realtime broadcasts the change, and the browser subscription triggers a refetch of the affected data via server actions.

This is the only "push" mechanism — all reads and writes still go through server actions.

#### 5. Authorization in Server Actions

Each mutating server action calls `requireRole()` at the top to enforce role-based access:

```typescript
export async function createStockIn(data: StockInInput) {
  const session = await requireRole("admin", "warehouse"); // throws if unauthorized
  // ... proceed with the operation
}
```

Server Components (page files) use a separate `requireRole()` from `src/lib/auth-guard.ts` that redirects to `/login` instead of throwing.

### Mapping to Traditional REST Concepts

| Traditional REST | This Project |
|-----------------|---------------|
| `GET /api/paint-items` | `getPaintItems()` in `src/actions/paint-items.ts` |
| `POST /api/paint-items` | `createPaintItem(data)` in `src/actions/paint-items.ts` |
| `PATCH /api/paint-items/:id` | `updatePaintItem(id, data)` in `src/actions/paint-items.ts` |
| `DELETE /api/paint-items/:id` | `deletePaintItem(id)` in `src/actions/paint-items.ts` |
| `GET /api/stock` | `getStockLevels()` in `src/actions/stock.ts` |
| `POST /api/transactions/stock-in` | `createStockIn(data)` in `src/actions/transactions.ts` |
| `GET /api/dashboard/stats` | `getDashboardStats()` in `src/actions/dashboard.ts` |
| JWT middleware / auth guard | `requireRole()` in `src/lib/session.ts` |
| WebSocket subscriptions | `useRealtimeSubscription()` hook via Supabase Realtime |

### File Structure Reference

```
src/
├── actions/              ← "Backend" — all server actions live here
│   ├── auth.ts           ← Login, logout, session management
│   ├── paint-items.ts    ← CRUD for paint master data
│   ├── stock.ts          ← Stock level queries
│   ├── transactions.ts   ← Stock-in, stock-out, residual, dispose
│   ├── dashboard.ts      ← Aggregated dashboard stats & charts
│   └── users.ts          ← User CRUD (admin only)
│
├── hooks/                ← Client-side hooks that call server actions
│   ├── use-paint-items.ts
│   ├── use-dashboard-data.ts
│   ├── use-transaction-form.ts
│   └── use-realtime-subscription.ts
│
├── lib/
│   ├── supabase/
│   │   ├── admin.ts      ← Service-role client (server only)
│   │   └── client.ts     ← Browser client (Realtime only)
│   ├── session.ts        ← JWT cookie helpers + requireRole
│   └── auth-guard.ts     ← Server Component auth guard (redirect)
│
└── app/
    └── <route>/
        ├── page.tsx          ← Server Component (auth guard, layout)
        └── page-client.tsx   ← Client Component (hooks, UI, action calls)
```

---

## Authentication Actions

### `loginWithPin(pin: string)`

Authenticates a user via PIN lookup from the `users` table.
No Supabase Auth involved — creates a JWT session cookie directly.
Supports both hashed (bcrypt) and legacy plaintext PINs; legacy PINs are auto-hashed on successful login.
Includes rate limiting (10 attempts per 15-minute window).

**Location**: `src/actions/auth.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `pin` | `string` | 4-digit PIN entered by user |

**Returns**: `{ success: boolean, role?: UserRole, redirectTo?: string, error?: string }`

**Flow**:
1. Rate-limit check
2. Fetch all users and compare PINs in-memory (prevents timing attacks)
3. Support bcrypt-hashed and legacy plaintext PINs
4. If matched, auto-hash legacy PIN if needed
5. Sign a JWT and set it as an httpOnly cookie
6. Return user role and redirect URL based on role

---

### `logout()`

Removes the session cookie. Navigation to `/login` is handled by the caller.

**Location**: `src/actions/auth.ts`

**Returns**: `{ success: boolean }`

---

### `getUserProfile()`

Gets the current user from the JWT session cookie.
Also fetches fresh data from the `users` table. PIN is excluded from the response.

**Location**: `src/actions/auth.ts`

**Returns**: `{ id, name, role, created_at } | null`

---

## Paint Items Actions

### `getPaintItems(activeOnly?: boolean)`

Fetches paint items from master data, ordered by name.

**Location**: `src/actions/paint-items.ts`

**Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `activeOnly` | `boolean` | `true` | Only return active items |

**Returns**: `PaintItem[]`

---

### `createPaintItem(data: CreatePaintItemInput)`

Creates a new paint item (Admin only).
The stock row is auto-created by a database trigger.

**Location**: `src/actions/paint-items.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Paint name |
| `color_code` | `string` | Internal color code |
| `color_hex` | `string` | Hex color for UI |
| `can_size` | `string` | Can size |
| `weight_per_can` | `number` | Weight per can in kg |
| `category` | `string` | Category |

**Returns**: `{ success: boolean, error?: string }`

---

### `updatePaintItem(id: string, data: Partial<PaintItem>)`

Updates an existing paint item (Admin only).

**Location**: `src/actions/paint-items.ts`

**Updatable fields**: `name`, `color_code`, `color_hex`, `can_size`, `weight_per_can`, `category`, `is_active`

---

### `togglePaintItemActive(id: string, isActive: boolean)`

Sets a paint item's `is_active` status (Admin only).

**Location**: `src/actions/paint-items.ts`

---

### `deletePaintItem(id: string)`

Deletes a paint item (Admin only). Will fail if the item has existing stock or log entries (FK constraint).

**Location**: `src/actions/paint-items.ts`

**Returns**: `{ success: boolean, error?: string }`

---

## Stock Actions

### `getStockLevels()`

Fetches all stock levels with joined paint item data, ordered by paint name.

**Location**: `src/actions/stock.ts`

**Returns**: `(Stock & { paint_items: PaintItem })[]`

---

### `getStockByPaintItem(paintItemId: string)`

Fetches stock level for a specific paint item.

**Location**: `src/actions/stock.ts`

**Returns**: `Stock | null`

---

## Transaction Actions

### `createStockIn(data: StockInInput)`

Records new paint arriving at warehouse. `qty` is the number of **cans**; the server converts to kg via `weight_per_can`.

**Triggered by**: Warehouse operator (`/warehouse` page)

**Location**: `src/actions/transactions.ts`

**Allowed roles**: `admin`, `warehouse`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Number of cans |
| `notes` | `string?` | Optional supplier/reference |

**Effect**: Inserts `STOCK_IN` log + increases `stock_warehouse` (kg)

---

### `createStockOut(data: StockOutInput)`

Records paint being taken from warehouse to the painting section. `qty` is the number of **cans**; the server converts to kg via `weight_per_can`. This operation is performed by the sideroom operator because they both take paint out and later reconcile the residual.

**Triggered by**: Sideroom operator (`/sideroom` page)

**Location**: `src/actions/transactions.ts`

**Allowed roles**: `admin`, `sideroom`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Number of cans |
| `notes` | `string?` | Optional destination/job reference |

**Effect**: Inserts `STOCK_OUT` log + decreases `stock_warehouse` + increases `stock_sideroom` + auto-logs `SIDEROOM_RECEIVE`

---

### `createResidualReturn(data: ResidualReturnInput)`

Records leftover paint received in sideroom after painting. The consumed portion (paint used up during painting) is auto-calculated and logged as `PAINT_CONSUMED`.

**Triggered by**: Sideroom operator (`/sideroom` page)

**Location**: `src/actions/transactions.ts`

**Allowed roles**: `admin`, `sideroom`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Remaining quantity in kg (0 = all consumed) |
| `notes` | `string?` | Optional notes |

**Effect**: Inserts `RESIDUAL_RETURN` log + decreases `stock_sideroom` by consumed portion + auto-logs `PAINT_CONSUMED`

---

### `createDispose(data: DisposeInput)`

Records paint being disposed (expired/mixed with thinner).

**Triggered by**: Sideroom operator (`/sideroom` page)

**Location**: `src/actions/transactions.ts`

**Allowed roles**: `admin`, `sideroom`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Quantity to dispose (kg) |
| `notes` | `string?` | Reason (expired, mixed with thinner) |
| `condition` | `string?` | Paint condition |

**Effect**: Inserts `DISPOSE` log + decreases `stock_sideroom`

---

### `getPendingResidualKg(paintItemId: string)`

Computes the pending residual (kg) for a paint item — the amount that left the warehouse via `STOCK_OUT` but hasn't been accounted for yet.

**Formula**: `total_stock_out - total_residual_return - total_paint_consumed`

**Location**: `src/actions/transactions.ts`

**Returns**: `number` (kg, 0 if none)

---

### `getLogEntries(filters?: LogFilters)`

Fetches log entries with optional filters, ordered by `created_at` descending.

**Location**: `src/actions/transactions.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string?` | Filter by paint item |
| `type` | `LogType?` | Filter by log type |
| `date_from` | `string?` | Start date filter |
| `date_to` | `string?` | End date filter |
| `limit` | `number?` | Max entries (default 50) |

**Returns**: `(Log & { paint_items: PaintItem, users: User })[]`

---

### `getLogsForExport(dateFrom: string, dateTo: string)`

Fetches all log entries within a date range for CSV export (WIB timezone). No limit.

**Location**: `src/actions/transactions.ts`

**Returns**: `(Log & { paint_items: PaintItem, users: User })[]`

---

### `getLogByPaintItem(paintItemId: string)`

Fetches log entries for a specific paint item (digital stock card). Limited to 100 entries.

**Location**: `src/actions/transactions.ts`

**Returns**: `(Log & { users: User })[]`

---

## Dashboard Actions

### `getDailyUsage(dateFrom: string, dateTo: string, paintItemId?: string)`

Fetches daily usage metrics for the bar chart. Groups by WIB date.

**Location**: `src/actions/dashboard.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | `string` | Start date (YYYY-MM-DD) |
| `dateTo` | `string` | End date (YYYY-MM-DD) |
| `paintItemId` | `string?` | Optional paint filter |

**Returns**: `DailyUsage[]`

Each entry contains:
```typescript
{
  date: string;     // YYYY-MM-DD (WIB)
  issued: number;   // SUM of STOCK_OUT qty
  consumed: number; // SUM of PAINT_CONSUMED qty
  wasted: number;   // SUM of DISPOSE qty
}
```

---

### `getLowStockItems(threshold?: number)`

Fetches paint items where total stock (warehouse + sideroom) is below the threshold. Sorted by total stock ascending.

**Location**: `src/actions/dashboard.ts`

**Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `threshold` | `number` | `100` | Minimum total stock level (kg) |

**Returns**: `(Stock & { paint_items: PaintItem })[]`

---

### `getDashboardStats()`

Fetches summary statistics for the dashboard.

**Location**: `src/actions/dashboard.ts`

**Returns**:
```typescript
{
  totalItems: number;          // Active paint items count
  totalWarehouseStock: number; // Sum of all stock_warehouse (kg)
  totalSideroomStock: number;  // Sum of all stock_sideroom (kg)
  todayTransactions: number;   // Today's log entries count (WIB)
}
```

---

## User Management Actions (Admin)

### `getUsers()`

Fetches all users ordered by name (Admin only). PIN is excluded from the response.

**Location**: `src/actions/users.ts`

**Returns**: `UserProfile[]` (`{ id, name, role, created_at }`)

---

### `createUser(data: CreateUserInput)`

Creates a new user with bcrypt-hashed PIN (Admin only).

**Location**: `src/actions/users.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name |
| `pin` | `string` | 4-6 digit PIN (hashed before storage) |
| `role` | `UserRole` | `warehouse` / `sideroom` / `admin` / `office` |

**Returns**: `{ success: boolean, error?: string }`

---

### `updateUser(id: string, data: Partial<UpdateUserInput>)`

Updates a user (Admin only). If PIN is provided, it will be hashed before storing.

**Location**: `src/actions/users.ts`

**Updatable fields**: `name`, `pin`, `role`

---

### `deleteUser(id: string)`

Deletes a user (Admin only).

**Location**: `src/actions/users.ts`

**Returns**: `{ success: boolean, error?: string }`

---

## Error Handling

Most server actions return a consistent shape:

```typescript
// Success
{ success: true }

// Error
{ success: false, error: "Error message" }
```

Errors are caught and returned rather than thrown, allowing the UI to display them gracefully via toast notifications.

