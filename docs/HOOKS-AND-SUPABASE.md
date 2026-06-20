# Hooks & Supabase Connection

This document explains two concepts that are frequently asked about in this project:

1. What **hooks** are (and the custom hooks we use).
2. How the code **connects to Supabase** — it's not just an API key.

All examples are taken from actual code in this project.

---

## 1. What is a Hook?

A **hook** is a special React function whose name starts with `use...`. It manages
**state** (data that can change) and **logic** inside components, and reacts to
changes.

### Built-in React Hooks

| Hook | Purpose |
|------|---------|
| `useState` | Stores a mutable value (e.g., `searchTerm`, `qty`) |
| `useEffect` | Runs side effects when a component mounts or when specific values change (fetch data, subscribe to Realtime) |
| `useCallback` | Stores a stable function reference to avoid re-creation on every render |
| `useRef` | Stores a value that persists across renders without triggering re-renders |

### Custom Hooks

A **custom hook** combines built-in hooks into a single `use...` function so that
logic can be reused across components and pages stay clean.

Example — `src/hooks/use-paint-items.ts`:

```ts
export function usePaintItems(initialItems: PaintItem[]) {
  const [items, setItems] = useState(initialItems);   // state
  const [searchTerm, setSearchTerm] = useState("");    // state
  const handleAdd = async (e) => { /* ... */ };        // logic
  // ...
  return { items, searchTerm, setSearchTerm, handleAdd, /* ... */ };
}
```

In a page component, you just use the result:

```tsx
const pi = usePaintItems(initialItems);
// use pi.items, pi.handleAdd, etc.
```

**Analogy:** a hook is like a "machine" with data and controls. The page just
uses the machine without knowing its internals.

### Important Hook Rules

- Hooks can **only** be called inside React components or other custom hooks.
- **Never** call hooks inside `if` statements, loops, or regular functions — the
  call order must be consistent on every render.

### Custom Hooks in This Project

| Hook | Purpose |
|------|---------|
| `use-realtime-subscription.ts` | Shared Supabase Realtime subscription (channel, debounce, status) |
| `use-dashboard-data.ts` | Dashboard data fetch + Realtime (uses `useRealtimeSubscription`) |
| `use-daily-usage.ts` | Chart date-range state + daily usage fetch |
| `use-dashboard-export.ts` | CSV export from dashboard |
| `use-paint-items.ts` | Paint item CRUD + search + export |
| `use-users.ts` | User CRUD + search + export |
| `use-transaction-form.ts` | Shared transaction form logic + Realtime (uses `useRealtimeSubscription`) |
| `use-paginated-search.ts` | Filter + pagination helper |

---

## 2. How the Code Connects to Supabase

The API key (`ANON_KEY`) is just the "entry ticket". The actual connection works
through several layers.

### a) Client Library Opens the Connection

`@supabase/ssr` wraps the URL + key into a **client object**. The URL points to
the Supabase project (`https://xxx.supabase.co`), which behind the scenes is
**PostgreSQL + REST API (PostgREST) + Realtime server**.

```ts
createBrowserClient(URL, ANON_KEY); // → client object for querying
```

When code writes `supabase.from("stock").select()`, the library converts it into
an HTTP request to the Supabase REST endpoint, which returns data from the
Postgres table. So the connection is a **regular HTTP request** to the Supabase
server, not a direct database connection.

### b) Two Clients — Running in Different Places

This project has two clients, and this is the key distinction:

| | Browser (`client.ts`) | Admin (`admin.ts`) |
|---|---|---|
| Runs in | Client Components (`"use client"`) | Server Actions only |
| Auth via | Anon key | Service role key (bypasses RLS) |
| Examples | Realtime subscriptions, paint dropdowns | `loginWithPin`, `getStockLevels`, all CRUD |

`src/lib/supabase/client.ts`:

```ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`src/lib/supabase/admin.ts` — uses the **service role key** for full access:

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

The admin client is used by all server actions and **must never** be exposed to
the browser — it bypasses RLS entirely.

### c) Realtime — Persistent WebSocket Connection

Besides HTTP (one request–response), the dashboard and operator pages use
**WebSocket** — a persistent connection so database changes are pushed to the
browser instantly.

All Realtime subscriptions go through a **shared hook** — `useRealtimeSubscription` —
which handles channel creation, event listening, debounced refetches, and connection
status tracking. This is used by `use-dashboard-data.ts` and `use-transaction-form.ts`:

```ts
// Inside useDashboardData / useTransactionForm:
useRealtimeSubscription({
  channelName: "dashboard-realtime",
  tables: [
    { event: "*", table: "stock" },      // stock table changed → refetch
    { event: "INSERT", table: "log" },    // new transaction → refetch
  ],
  onChange: fetchData,
  onStatusChange: setRealtimeStatus,     // optional: track connection state
});
```

The shared hook debounces refetches by 300ms to avoid hammering the server when
several DB events arrive at once. It also tracks connection status
(`connecting` / `connected` / `disconnected`) which the dashboard uses for the
live status badge.

### d) Auth in This Project — Not Supabase Auth

This project **does not** use Supabase's built-in auth system. Login is custom
(see `src/actions/auth.ts`):

1. User enters a PIN.
2. Server fetches all users and compares PINs in-memory (supports bcrypt-hashed and legacy plaintext).
3. If matched, a **JWT session cookie** is created (`createSession` in `src/lib/session.ts`).
4. Subsequent requests carry that cookie → session is verified by server actions.
5. Rate limiting: 10 attempts per 15-minute window.

### Connection Flow Diagram

```
Browser / Server code
   │  supabase.from(...).select()
   ▼
@supabase/ssr (browser)  ──HTTP──▶  Supabase REST API ──▶ PostgreSQL
@supabase/supabase-js (admin) ──HTTP──▶  Supabase REST API ──▶ PostgreSQL
   │
   └──WebSocket──▶  Supabase Realtime ──▶ (push table changes)

User identity: JWT cookie (custom, signed with jose)
```

### Summary

- **API key** opens the door to the Supabase project.
- **Browser client** (`client.ts`) uses the anon key for Realtime and read-only queries.
- **Admin client** (`admin.ts`) uses the service role key for all server-side operations (bypasses RLS).
- **Cookies / JWT** determine who the user is.
- **Hooks** are a separate concern — a React pattern for managing data & logic on the frontend.

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, data flow, real-time, folder structure
- [API.md](API.md) — server action reference
- [DATABASE.md](DATABASE.md) — schema, tables, RLS, triggers
