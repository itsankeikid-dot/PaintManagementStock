# API Documentation

## Overview

The application uses **Next.js Server Actions** for all backend operations. Server actions call Supabase client methods directly from the server, providing type-safe database operations without separate API routes.

All server actions are located in `src/actions/`.

## Authentication Actions

### `loginWithPin(pin: string)`

Authenticates a user via simple PIN lookup from the `users` table.
No Supabase Auth involved - creates a JWT session cookie directly.

**Location**: `src/actions/auth.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `pin` | `string` | 4-6 digit PIN entered by user |

**Returns**: `{ success: boolean, role?: UserRole, error?: string }`

**Flow**:
1. Look up user matching the PIN in `users` table
2. If found, sign a JWT and set it as an httpOnly cookie
3. Return user role for redirect

---

### `logout()`

Removes the session cookie and redirects to login page.

**Location**: `src/actions/auth.ts`

**Returns**: `{ success: boolean }`

---

### `getUserProfile()`

Gets the current user from the JWT session cookie.
Also fetches fresh data from the `users` table.

**Location**: `src/actions/auth.ts`

**Returns**: `Profile | null`

---

## Paint Items Actions

### `getPaintItems(activeOnly?: boolean)`

Fetches paint items from master data.

**Location**: `src/actions/paint-items.ts`

**Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `activeOnly` | `boolean` | `true` | Only return active items |

**Returns**: `PaintItem[]`

---

### `createPaintItem(data: CreatePaintItemInput)`

Creates a new paint item (Admin only).

**Location**: `src/actions/paint-items.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | Paint name |
| `color_code` | `string` | Internal color code |
| `color_hex` | `string` | Hex color for UI |
| `can_size` | `string` | Can size |
| `category` | `string` | Category |

**Returns**: `{ success: boolean, error?: string }`

---

### `updatePaintItem(id: string, data: UpdatePaintItemInput)`

Updates an existing paint item (Admin only).

**Location**: `src/actions/paint-items.ts`

---

### `togglePaintItemActive(id: string)`

Toggles a paint item's `is_active` status (Admin only).

**Location**: `src/actions/paint-items.ts`

---

## Stock Actions

### `getStockLevels()`

Fetches all stock levels with joined paint item data.

**Location**: `src/actions/stock.ts`

**Returns**: `(Stock & { paint_items: PaintItem })[]`

---

### `getStockByPaintItem(paintItemId: string)`

Fetches stock level for a specific paint item.

**Location**: `src/actions/stock.ts`

---

## Log/Transaction Actions

### `createStockIn(data: StockInInput)`

Records new paint arriving at warehouse.

**Location**: `src/actions/transactions.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Quantity |
| `notes` | `string?` | Optional supplier/reference |

**Effect**: Inserts `STOCK_IN` log + increases `stock_warehouse`

---

### `createStockOut(data: StockOutInput)`

Records paint being taken from warehouse to painting section.

**Location**: `src/actions/transactions.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Quantity |
| `notes` | `string?` | Optional destination/job reference |

**Effect**: Inserts `STOCK_OUT` log + decreases `stock_warehouse`

---

### `createSideroomIn(data: SideroomInInput)`

Records leftover paint received in sideroom from painting.

**Location**: `src/actions/transactions.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Remaining quantity |
| `notes` | `string?` | Optional notes |

**Effect**: Inserts `SIDEROOM_IN` log + increases `stock_sideroom`

---

### `createDispose(data: DisposeInput)`

Records paint being disposed (expired/mixed with thinner).

**Location**: `src/actions/transactions.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string` | UUID of paint item |
| `qty` | `number` | Quantity to dispose |
| `notes` | `string?` | Reason (expired, mixed with thinner) |

**Effect**: Inserts `DISPOSE` log + decreases `stock_sideroom`

---

### `getLogEntries(filters?: LogFilters)`

Fetches log entries with optional filters.

**Location**: `src/actions/transactions.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `paint_item_id` | `string?` | Filter by paint item |
| `type` | `LogType?` | Filter by log type |
| `date_from` | `string?` | Start date filter |
| `date_to` | `string?` | End date filter |
| `limit` | `number?` | Max entries (default 50) |

**Returns**: `(Log & { paint_items: PaintItem, profiles: Profile })[]`

---

## Dashboard Actions

### `getDailyUsage(dateFrom: string, dateTo: string, paintItemId?: string)`

Fetches daily usage metrics for the bar chart.

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
  date: string;     // YYYY-MM-DD
  issued: number;   // SUM of STOCK_OUT
  consumed: number; // STOCK_OUT - SIDEROOM_IN
  wasted: number;   // SUM of DISPOSE
}
```

---

### `getLowStockItems(threshold?: number)`

Fetches paint items below the low stock threshold.

**Location**: `src/actions/dashboard.ts`

**Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `threshold` | `number` | `5` | Minimum stock level |

**Returns**: `(Stock & { paint_items: PaintItem })[]`

---

## User Management Actions (Admin)

### `getProfiles()`

Fetches all user profiles (Admin only).

**Location**: `src/actions/users.ts`

---

### `createProfile(data: CreateProfileInput)`

Creates a new user with PIN (Admin only).

**Location**: `src/actions/users.ts`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `email` | `string` | User email (used for Supabase auth) |
| `name` | `string` | Display name |
| `pin` | `string` | 4-6 digit PIN |
| `role` | `UserRole` | warehouse / sideroom / admin |

---

### `updateProfile(id: string, data: UpdateProfileInput)`

Updates a user profile (Admin only).

**Location**: `src/actions/users.ts`

---

## Error Handling

All server actions return a consistent shape:

```typescript
// Success
{ success: true, data: ... }

// Error
{ success: false, error: "Error message" }
```

Errors are caught and returned rather than thrown, allowing the UI to display them gracefully via toast notifications.
