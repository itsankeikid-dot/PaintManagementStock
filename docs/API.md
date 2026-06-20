# API Documentation

## Overview

The application uses **Next.js Server Actions** for all backend operations. Server actions use a Supabase admin client (service role key) that bypasses RLS, providing type-safe database operations without separate API routes.

All server actions are located in `src/actions/`.

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

