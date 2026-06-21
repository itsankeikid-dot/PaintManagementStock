# Panduan Supabase untuk Backend Developer

> Dokumentasi ini ditujukan untuk developer yang terbiasa dengan backend konvensional
> (Express, Laravel, Spring Boot, dll) dan baru pertama kali melihat cara Supabase bekerja
> di proyek Next.js ini.

---

## Daftar Isi

1. [Konsep Dasar: Supabase vs Backend Konvensional](#1-konsep-dasar-supabase-vs-backend-konvensional)
2. [Struktur File yang Berhubungan dengan Supabase](#2-struktur-file-yang-berhubungan-dengan-supabase)
3. [Dua Klien Supabase: Browser vs Admin](#3-dua-klien-supabase-browser-vs-admin)
4. [Alur Data dari Frontend ke Database](#4-alur-data-dari-frontend-ke-database)
5. [Autentikasi & Session (Bukan Supabase Auth!)](#5-autentikasi--session-bukan-supabase-auth)
6. [CRUD Operations: Contoh Nyata](#6-crud-operations-contoh-nyata)
7. [Real-time Subscription (WebSocket)](#7-real-time-subscription-websocket)
8. [Row Level Security (RLS)](#8-row-level-security-rls)
9. [Error Handling & Debugging](#9-error-handling--debugging)
10. [Best Practices di Proyek Ini](#10-best-practices-di-proyek-ini)

---

## 1. Konsep Dasar: Supabase vs Backend Konvensional

### Kalau kamu pakai backend konvensional (Express/Laravel/dll):

```
┌──────────────────────────────────────────────────────┐
│  Browser → HTTP Request → Express/Laravel Route       │
│                          → Controller                 │
│                          → Service/Model              │
│                          → Query SQL (pg/mysql)       │
│                          → Response JSON              │
└──────────────────────────────────────────────────────┘
```

Kamu menulis SEMUA sendiri: routing, controller, middleware auth, query SQL, validasi, dll.

### Di proyek ini (Supabase + Next.js):

```
┌──────────────────────────────────────────────────────┐
│  Browser → React Component                            │
│          → Server Action ("use server")               │
│          → Supabase Client (sudah provide API)        │
│          → Supabase Server → PostgreSQL               │
│          → Response → Update UI                       │
└──────────────────────────────────────────────────────┘
```

**Perbedaan utama:**

| Aspek | Backend Konvensional | Supabase di Proyek Ini |
|-------|---------------------|------------------------|
| **API Endpoint** | Kamu buat manual (`app.get('/api/items', ...)`) | Sudah otomatis disediakan Supabase (REST API via PostgREST) |
| **Query SQL** | Kamu tulis raw SQL atau pakai ORM | Pakai builder: `supabase.from('table').select('*')` |
| **Auth** | Kamu bikin middleware JWT sendiri | Bisa pakai Supabase Auth ATAU bikin sendiri (proyek ini bikin sendiri!) |
| **Real-time** | Perlu setup WebSocket server terpisah | Sudah built-in, tinggal subscribe |
| **Row-level security** | Kamu bikin filter di query | Supabase punya RLS policy di level database |
| **Database migration** | Kamu tulis migration manual | Supabase punya migration file (folder `supabase/migrations/`) |

**PENTING:** Supabase pada dasarnya adalah **PostgreSQL + REST API otomatis + Realtime server + Auth + Storage** yang dibungkus jadi satu. Jadi kamu tidak perlu nulis route API lagi — cukup panggil method dari client Supabase.

---

## 2. Struktur File yang Berhubungan dengan Supabase

```
src/
├── lib/supabase/
│   ├── admin.ts       ← Client untuk server-side (bypass RLS, full access)
│   └── client.ts      ← Client untuk browser (Realtime, read-only)
├── lib/session.ts     ← JWT session management (bukan Supabase Auth!)
├── lib/auth-guard.ts  ← Middleware-like guard untuk proteksi halaman
├── actions/           ← "Controllers" di dunia Next.js (Server Actions)
│   ├── auth.ts        ← Login, logout, get user profile
│   ├── paint-items.ts ← CRUD master data cat
│   ├── stock.ts       ← Query stok
│   ├── transactions.ts← Transaksi stok (STOCK_IN, STOCK_OUT, dll)
│   ├── dashboard.ts   ← Statistik dashboard
│   └── users.ts       ← CRUD user
└── hooks/             ← Custom React hooks (state management di frontend)
    ├── use-realtime-subscription.ts  ← WebSocket subscription
    └── use-transaction-form.ts       ← Logic form transaksi

supabase/
├── schema.sql         ← Schema database utama
└── migrations/        ← Migration files (seperti di Laravel/Prisma)
```

---

## 3. Dua Klien Supabase: Browser vs Admin

Ini konsep **paling penting** untuk dipahami. Ada 2 client berbeda:

### a) Admin Client (`src/lib/supabase/admin.ts`) — untuk Server-Side

```ts
// File: src/lib/supabase/admin.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // ← KUNCI RAHASIA!

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

**Analogi di backend konvensional:** Ini seperti kamu punya koneksi database langsung dengan user `root`/`superadmin`. Bisa baca/tulis SEMUA data tanpa batasan.

- Dipakai di **Server Actions** (file di folder `src/actions/`)
- Pakai `SUPABASE_SERVICE_ROLE_KEY` → **bypass RLS** (Row Level Security)
- **TIDAK BOLEH** dipakai di browser/client component
- Mirip seperti `DB::table(...)` di Laravel atau `prisma.table.findMany()` di Prisma

### b) Browser Client (`src/lib/supabase/client.ts`) — untuk Client-Side

```ts
// File: src/lib/supabase/client.ts
"use client"; // ← WAJIB ada di file client component

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,     // ← Bisa dilihat browser
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← Aman, karena dibatasi RLS
  );
}
```

**Analogi di backend konvensional:** Ini seperti API client di frontend yang hanya bisa akses endpoint publik. Dibatasi oleh RLS.

- Dipakai di **Client Components** (React component di browser)
- Pakai `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **dibatasi RLS**
- Utamanya untuk **Realtime subscription** (WebSocket)
- Di proyek ini, browser client HANYA dipakai untuk Realtime, bukan query data

### Kapan pakai yang mana?

```
┌─────────────────────────────────────────────┐
│ Kode kamu ada di mana?                       │
│                                              │
│  Server Action ("use server")                │
│    → createAdminClient()                     │
│                                              │
│  Server Component (page.tsx tanpa "use client")│
│    → createAdminClient()                     │
│                                              │
│  Client Component ("use client")             │
│    → createClient() (hanya untuk Realtime)   │
│                                              │
│  BUTUH QUERY DATA?                           │
│    → Selalu lakukan di Server Action!        │
└─────────────────────────────────────────────┘
```

---

## 4. Alur Data dari Frontend ke Database

### Diagram Alur Lengkap

```
User klik tombol "Terima Cat" di browser
        │
        ▼
┌─ React Component (page-client.tsx) ──────────────────────┐
│  const tf = useTransactionForm({ paintItems });           │
│  tf.execute(() => createStockIn({ ... }), { ... });       │
│                                                           │
│  createStockIn ← ini adalah SERVER ACTION (import dari    │
│                  src/actions/transactions.ts)             │
└───────────────────────────────────────────────────────────┘
        │  (HTTP POST otomatis oleh Next.js)
        ▼
┌─ Server Action (src/actions/transactions.ts) ────────────┐
│  "use server";  ← WAJIB ada di baris pertama             │
│                                                           │
│  export async function createStockIn(data) {              │
│    return createTransaction(data.paint_item_id,           │
│                              "STOCK_IN", ...);            │
│  }                                                        │
│                                                           │
│  Di dalam createTransaction:                              │
│    1. const supabase = createAdminClient()                │
│    2. const session = await getSession()  ← cek JWT      │
│    3. Validasi role, qty, stok                            │
│    4. await supabase.from("log").insert({...})            │
│    5. await supabase.from("stock").update({...})          │
│    6. return { success: true }                            │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
        │  (HTTP request ke Supabase REST API)
        ▼
┌─ Supabase Server ────────────────────────────────────────┐
│  PostgREST → PostgreSQL                                   │
│  - Cek RLS policy (bypassed karena service_role key)     │
│  - Eksekusi INSERT ke tabel log                           │
│  - Eksekusi UPDATE ke tabel stock                         │
│  - Trigger otomatis: create_stock_for_paint_item          │
│  - Realtime broadcast ke subscriber                     │
└───────────────────────────────────────────────────────────┘
        │  (WebSocket push ke browser)
        ▼
┌─ Realtime Subscriber (browser) ──────────────────────────┐
│  useRealtimeSubscription mendeteksi perubahan             │
│  → debounce 300ms                                        │
│  → fetchActivity() dipanggil ulang                       │
│  → UI otomatis terupdate                                 │
└───────────────────────────────────────────────────────────┘
```

### Contoh Konkret: Alur "Terima Cat Baru" (STOCK_IN)

**Langkah 1 — User klik submit di form:**

```tsx
// File: src/app/warehouse/page-client.tsx (simplified)
import { createStockIn } from "@/actions/transactions";

// Di dalam component:
const tf = useTransactionForm({ paintItems });

// Saat submit:
await tf.execute(
  () => createStockIn({
    paint_item_id: tf.selectedPaint,
    qty: tf.qty,          // jumlah kaleng
    notes: tf.notes,
  }),
  { successMessage: "Stok berhasil ditambahkan!" }
);
```

**Langkah 2 — Server Action menerima dan memproses:**

```ts
// File: src/actions/transactions.ts
"use server";

export async function createStockIn(data: {
  paint_item_id: string;
  qty: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  return createTransaction(data.paint_item_id, "STOCK_IN", data.qty, data.notes);
}
```

**Langkah 3 — Fungsi inti transaksi (simplified):**

```ts
async function createTransaction(paintItemId, type, qty, notes) {
  const supabase = createAdminClient();

  // 1. Cek siapa yang login
  const session = await getSession(); // ← baca JWT cookie
  if (!session) return { success: false, error: "Tidak memiliki akses" };

  // 2. Cek role boleh nggak?
  if (!["admin", "warehouse"].includes(session.role)) {
    return { success: false, error: "Tidak memiliki akses" };
  }

  // 3. Ambil data paint item
  const { data: paintItem } = await supabase
    .from("paint_items")
    .select("id, is_active, weight_per_can")
    .eq("id", paintItemId)
    .single();

  // 4. Konversi kaleng → kg
  const storedQty = qty * paintItem.weight_per_can; // 2 kaleng × 18 kg = 36 kg

  // 5. INSERT ke tabel log (catat transaksi)
  const { error: logError } = await supabase.from("log").insert({
    paint_item_id: paintItemId,
    user_id: session.userId,
    type: "STOCK_IN",
    qty: storedQty,       // yang disimpan selalu dalam KG
    notes: notes || null,
  });

  // 6. UPDATE tabel stock (tambah stok gudang)
  const { error: stockError } = await supabase
    .from("stock")
    .update({ stock_warehouse: stock.stock_warehouse + storedQty })
    .eq("paint_item_id", paintItemId);

  return { success: true };
}
```

---

## 5. Autentikasi & Session (Bukan Supabase Auth!)

Proyek ini **TIDAK** menggunakan Supabase Auth. Login dibuat manual dengan PIN + JWT.

### Kenapa tidak pakai Supabase Auth?

Karena login di aplikasi ini pakai **PIN 4 digit** (seperti mesin kasir), bukan email/password. Supabase Auth tidak support login by PIN.

### Alur Login

```
User masukkan PIN "1234"
        │
        ▼
┌─ React Component ────────────────────────────┐
│  const result = await loginWithPin("1234");   │
│  // loginWithPin adalah Server Action         │
└───────────────────────────────────────────────┘
        │
        ▼
┌─ Server Action: loginWithPin ────────────────┐
│  1. Rate limit check (max 10x per 15 menit)  │
│  2. Ambil SEMUA user dari database            │
│  3. Bandingkan PIN satu per satu:             │
│     - Kalau PIN di-DB sudah di-hash (bcrypt): │
│       → bcrypt.compare("1234", hashedPin)     │
│     - Kalau masih plaintext:                  │
│       → "1234" === storedPin                  │
│  4. Kalau cocok:                              │
│     → Auto-hash PIN lama yang masih plaintext │
│     → createSession({ userId, name, role })   │
│     → Return { success: true, redirectTo }    │
└───────────────────────────────────────────────┘
        │
        ▼
┌─ createSession (src/lib/session.ts) ─────────┐
│  1. Buat JWT token pakai library "jose"       │
│  2. Set sebagai HTTP-only cookie              │
│  3. Cookie name: "paint_stock_session"        │
│  4. Expired: 8 jam                            │
└───────────────────────────────────────────────┘
```

### Kode Session Management

```ts
// File: src/lib/session.ts

// ── Buat session (setelah login berhasil) ──
export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);

  cookieStore.set("paint_stock_session", token, {
    httpOnly: true,    // tidak bisa dibaca JavaScript di browser
    secure: true,      // hanya dikirim via HTTPS
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 jam
  });
}

// ── Baca session (di setiap server action) ──
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookieStore.get("paint_stock_session")?.value;
  if (!token) return null;

  const { payload } = await jwtVerify(token, SECRET);
  return payload as SessionPayload; // { userId, name, role }
}

// ── Hapus session (logout) ──
export async function destroySession() {
  cookieStore.delete("paint_stock_session");
}
```

### Auth Guard (Proteksi Halaman)

```ts
// File: src/lib/auth-guard.ts

export async function requireRole(...allowedRoles: UserRole[]) {
  const profile = await getUserProfile();

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect("/login"); // ← otomatis redirect ke login
  }

  return profile;
}
```

Cara pakai di halaman:

```tsx
// File: src/app/admin/paint-items/page.tsx
import { requireRole } from "@/lib/auth-guard";

export default async function AdminPaintItemsPage() {
  const profile = await requireRole("admin"); // ← hanya admin yang bisa akses

  const items = await getPaintItems();

  return <PaintItemsPageClient initialItems={items} />;
}
```

**Analogi di backend konvensional:** Ini seperti middleware `auth` + `role` di Express:

```js
// Express equivalent
app.get('/admin/paint-items',
  authMiddleware,           // ← getSession()
  requireRole('admin'),     // ← cek role
  paintItemsController      // ← getPaintItems()
);
```

---

## 6. CRUD Operations: Contoh Nyata

### CREATE — Tambah Paint Item Baru

```ts
// File: src/actions/paint-items.ts
export async function createPaintItem(data: {
  name: string;
  color_code: string;
  color_hex: string;
  can_size: string;
  weight_per_can: number;
  category: string;
}) {
  await requireRole("admin"); // ← hanya admin

  const supabase = createAdminClient();

  // Analogi SQL:
  // INSERT INTO paint_items (name, color_code, ..., is_active)
  // VALUES ('White Base', 'W-001', ..., true);
  const { error } = await supabase.from("paint_items").insert({
    ...data,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

**Catatan:** Saat row baru masuk ke `paint_items`, trigger database otomatis membuat row di tabel `stock`:

```sql
-- Dari schema.sql
CREATE TRIGGER auto_create_stock
  AFTER INSERT ON paint_items
  FOR EACH ROW EXECUTE FUNCTION create_stock_for_paint_item();
-- Otomatis: INSERT INTO stock (paint_item_id, 0, 0)
```

### READ — Ambil Data Stok

```ts
// File: src/actions/stock.ts
export async function getStockLevels() {
  const supabase = createAdminClient();

  // Analogi SQL:
  // SELECT s.*, p.* FROM stock s
  // JOIN paint_items p ON s.paint_item_id = p.id
  // ORDER BY p.name ASC;
  const { data, error } = await supabase
    .from("stock")
    .select("*, paint_items(*)")    // ← JOIN otomatis!
    .order("paint_items(name)", { ascending: true });

  return data || [];
}
```

**Fitur JOIN Supabase:** Saat kamu tulis `select("*, paint_items(*)")`, Supabase otomatis melakukan JOIN berdasarkan foreign key yang ada di schema. Kamu tidak perlu tulis `JOIN` manual!

### READ — Ambil Log dengan Filter

```ts
// File: src/actions/transactions.ts
export async function getLogEntries(filters?: {
  paint_item_id?: string;
  type?: LogType;
  date_from?: string;
  date_to?: string;
  limit?: number;
}) {
  const supabase = createAdminClient();

  // Analogi SQL:
  // SELECT l.*, p.*, u.* FROM log l
  // JOIN paint_items p ON l.paint_item_id = p.id
  // JOIN users u ON l.user_id = u.id
  // WHERE l.paint_item_id = ? (optional)
  //   AND l.type = ? (optional)
  //   AND l.created_at >= ? (optional)
  //   AND l.created_at <= ? (optional)
  // ORDER BY l.created_at DESC
  // LIMIT 50;
  let query = supabase
    .from("log")
    .select("*, paint_items(*), users(*)")  // ← Double JOIN!
    .order("created_at", { ascending: false })
    .limit(filters?.limit || 50);

  // Tambah filter dinamis (seperti query builder di Laravel)
  if (filters?.paint_item_id) {
    query = query.eq("paint_item_id", filters.paint_item_id);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error } = await query;
  return data ?? [];
}
```

### UPDATE — Edit Paint Item

```ts
// File: src/actions/paint-items.ts
export async function updatePaintItem(id: string, data: Partial<Pick<PaintItem, ...>>) {
  await requireRole("admin");

  const supabase = createAdminClient();

  // Analogi SQL:
  // UPDATE paint_items SET name = ?, color_code = ? WHERE id = ?;
  const { error } = await supabase
    .from("paint_items")
    .update(data)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

### DELETE — Hapus Paint Item

```ts
// File: src/actions/paint-items.ts
export async function deletePaintItem(id: string) {
  await requireRole("admin");

  const supabase = createAdminClient();

  // Analogi SQL:
  // DELETE FROM paint_items WHERE id = ?;
  const { error } = await supabase
    .from("paint_items")
    .delete()
    .eq("id", id);

  // Error code "23503" = foreign key violation
  if (error?.code === "23503") {
    return {
      success: false,
      error: "Item ini tidak dapat dihapus karena memiliki data stok atau riwayat transaksi."
    };
  }

  return { success: true };
}
```

### COUNT — Hitung Jumlah (Tanpa Ambil Data)

```ts
// File: src/actions/dashboard.ts
// Analogi SQL: SELECT COUNT(*) FROM paint_items WHERE is_active = true;
const { count: totalItems } = await supabase
  .from("paint_items")
  .select("*", { count: "exact", head: true })  // ← head: true = tidak ambil data, cuma count
  .eq("is_active", true);
```

---

## 7. Real-time Subscription (WebSocket)

Ini fitur yang bikin Supabase spesial — **data di browser otomatis update** saat ada perubahan di database, tanpa perlu refresh!

### Analogi Sederhana

```
Backend konvensional:
  User A ubah data → User B harus refresh untuk lihat perubahan

Supabase Realtime:
  User A ubah data → Supabase push perubahan ke User B via WebSocket
                     → UI User B otomatis terupdate!
```

### Implementasi di Proyek Ini

**File hook:** `src/hooks/use-realtime-subscription.ts`

```ts
export function useRealtimeSubscription({
  channelName,   // nama channel (harus unik)
  tables,        // tabel mana yang dipantau
  onChange,      // fungsi yang dipanggil saat ada perubahan
  debounceMs = 300,
  onStatusChange,
}) {
  useEffect(() => {
    const supabase = createClient(); // ← browser client (pakai anon key)

    // Buat channel dan subscribe ke tabel-tabel yang diminta
    let channel = supabase.channel(channelName);
    for (const { event, table } of tables) {
      channel = channel.on(
        "postgres_changes",           // ← listen perubahan PostgreSQL
        { event, schema: "public", table },
        debouncedOnChange             // ← panggil onChange (dengan debounce)
      );
    }

    channel.subscribe((status) => {
      // Track status: connecting / connected / disconnected
      onStatusChange?.(status);
    });

    // Cleanup saat component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
```

**Cara pakai di halaman warehouse/sideroom:**

```ts
// File: src/hooks/use-transaction-form.ts
useRealtimeSubscription({
  channelName: "operator-realtime",
  tables: [
    { event: "*", table: "stock" },      // semua perubahan di tabel stock
    { event: "INSERT", table: "log" },   // hanya INSERT di tabel log
  ],
  onChange: fetchActivity,  // ← ambil ulang data log & stock
});
```

**Apa yang terjadi:**

```
1. Component mount → buka WebSocket ke Supabase Realtime server
2. Subscribe ke channel "operator-realtime"
3. Listen: ada perubahan di tabel "stock" ATAU ada INSERT di tabel "log"
4. Saat User lain melakukan STOCK_IN:
   → Server action insert ke log + update stock
   → Supabase broadcast via WebSocket
   → useRealtimeSubscription terima event
   → Tunggu 300ms (debounce, biar nggak spam)
   → fetchActivity() dipanggil → ambil data terbaru dari server
   → State React update → UI otomatis re-render
5. Component unmount → close WebSocket (cleanup)
```

---

## 8. Row Level Security (RLS)

RLS adalah fitur PostgreSQL yang membatasi **row mana yang bisa diakses** oleh user tertentu, langsung di level database.

### Analogi

```
Backend konvensional:
  Kamu tulis WHERE user_id = ? di setiap query
  Kalau lupa → data bocor!

Supabase RLS:
  Database OTOMATIS filter row berdasarkan policy
  Walaupun kamu lupa tulis WHERE, data tetap aman
```

### Konfigurasi RLS di Proyek Ini

```sql
-- File: supabase/schema.sql

-- Aktifkan RLS di semua tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE paint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE log ENABLE ROW LEVEL SECURITY;

-- Policy untuk service_role (dipakai admin client) → AKSES PENUH
CREATE POLICY "service_role_full_access_users"
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_paint_items"
  ON paint_items FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ... dst untuk stock dan log

-- Policy untuk anon (dipakai browser client) → READ-ONLY, terbatas
CREATE POLICY "anon_select_paint_items"
  ON paint_items FOR SELECT TO anon USING (true);  -- hanya bisa SELECT
CREATE POLICY "anon_select_stock"
  ON stock FOR SELECT TO anon USING (true);         -- hanya bisa SELECT

-- TIDAK ada policy anon untuk tabel users dan log!
-- Artinya browser client TIDAK bisa baca data user (PIN aman!)
-- dan TIDAK bisa baca log transaksi (history aman!)
```

### Tabel Akses

| Tabel | service_role (admin client) | anon (browser client) |
|-------|---------------------------|----------------------|
| `users` | Full CRUD | **Tidak ada akses** (PIN aman!) |
| `paint_items` | Full CRUD | SELECT only |
| `stock` | Full CRUD | SELECT only |
| `log` | Full CRUD | **Tidak ada akses** |

**Kenapa aman?** Browser client hanya bisa baca `paint_items` dan `stock` (untuk dropdown dan Realtime). Semua operasi tulis dan akses data sensitif dilakukan lewat Server Action yang pakai admin client.

---

## 9. Error Handling & Debugging

### Pattern Error Handling

Semua server action di proyek ini pakai pattern yang sama:

```ts
export async function someAction() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("some_table")
    .select("*");

  if (error) {
    console.error("Error fetching data:", error);  // ← log ke server console
    return [];  // ← return default value (bukan throw!)
  }

  return data;
}
```

**Kenapa tidak pakai try-catch?** Supabase client **tidak throw exception**. Error dikembalikan via property `error` di result. Ini beda dari ORM konvensional yang biasanya throw.

```ts
// Backend konvensional (Prisma/TypeORM):
try {
  const data = await prisma.users.findMany();
} catch (error) {
  // handle error
}

// Supabase:
const { data, error } = await supabase.from("users").select("*");
if (error) {
  // handle error
}
```

### Compensating Rollback (Manual Transaction)

Karena Supabase client tidak support `BEGIN...COMMIT` langsung dari JavaScript, proyek ini pakai rollback manual:

```ts
// File: src/actions/transactions.ts (simplified)

// Step 1: Insert log
const { error: logError } = await supabase.from("log").insert({...});
if (logError) return { success: false, error: "Gagal mencatat transaksi" };

// Step 2: Update stock
const { error: stockError } = await supabase.from("stock").update({...});

if (stockError) {
  // ROLLBACK: hapus log yang baru saja di-insert!
  console.error("Error updating stock, rolling back log entry:", stockError);
  await supabase
    .from("log")
    .delete()
    .eq("paint_item_id", paintItemId)
    .eq("user_id", session.userId)
    .eq("type", type)
    .eq("qty", storedQty);
  return { success: false, error: "Gagal memperbarui stok" };
}
```

### Error Codes yang Sering Muncul

| Code | Artinya | Contoh |
|------|---------|--------|
| `23503` | Foreign key violation | Hapus paint item yang masih punya stock/log |
| `23505` | Unique constraint violation | Insert PIN yang sudah ada |
| `PGRST116` | Row not found (`.single()`) | Query `.single()` tapi data tidak ada |

### Tips Debugging

1. **Cek console server** — semua error di-log dengan `console.error()`
2. **Cek Supabase Dashboard** → Logs → PostgREST untuk lihat request yang masuk
3. **Cek Network tab** di browser DevTools — server action muncul sebagai POST request
4. **Supabase Table Editor** — lihat data langsung di dashboard Supabase

---

## 10. Best Practices di Proyek Ini

### a) Server Actions sebagai "Controllers"

Semua operasi database dilakukan di Server Actions (folder `src/actions/`), bukan di React component.

```
❌ JANGAN: Query database di component
✅ BENAR: Component → panggil Server Action → Server Action query database
```

### b) Validasi Role di Setiap Server Action

```ts
// Setiap action yang sensitif SELALU cek role:
await requireRole("admin");           // hanya admin
await requireRole("admin", "warehouse"); // admin atau warehouse
```

### c) Semua Data dalam KG

Warehouse input dalam **kaleng**, tapi langsung dikonversi ke **kg** sebelum disimpan:

```ts
const storedQty = qty * paintItem.weight_per_can;
// 2 kaleng × 18 kg/kaleng = 36 kg (yang disimpan di DB)
```

### d) Return Type yang Konsisten

Semua server action yang bisa gagal return:

```ts
Promise<{ success: boolean; error?: string }>
```

Ini memudahkan frontend untuk handle response:

```ts
const result = await createStockIn({...});
if (result.success) {
  toast.success("Berhasil!");
} else {
  toast.error(result.error);
}
```

### e) Non-Fatal Auto-Logs

Beberapa operasi membuat log tambahan secara otomatis. Kalau gagal, error di-log tapi **tidak menggagalkan** operasi utama:

```ts
// Setelah STOCK_OUT berhasil, auto-log SIDEROOM_RECEIVE
if (type === "STOCK_OUT") {
  await autoLogSideroomReceive(supabase, paintItemId, userId, storedQty);
}

// autoLogSideroomReceive:
async function autoLogSideroomReceive(supabase, paintItemId, userId, qty) {
  const { error } = await supabase.from("log").insert({...});
  if (error) {
    console.error("Error creating SIDEROOM_RECEIVE log (non-fatal):", error);
    // ← TIDAK return error! hanya log dan lanjut
  }
}
```

### f) Debounced Realtime

Setiap perubahan database bisa trigger beberapa event sekaligus. Debounce 300ms mencegah spam refetch:

```ts
// Kalau 3 event masuk dalam 100ms, hanya 1 refetch yang dilakukan
const debouncedOnChange = useCallback(() => {
  if (refetchTimer.current) clearTimeout(refetchTimer.current);
  refetchTimer.current = setTimeout(onChange, 300);
}, [onChange]);
```

### g) Database Triggers untuk Otomatisasi

```sql
-- Auto-create stock row saat paint item baru ditambahkan
CREATE TRIGGER auto_create_stock
  AFTER INSERT ON paint_items
  FOR EACH ROW EXECUTE FUNCTION create_stock_for_paint_item();

-- Auto-update updated_at timestamp
CREATE TRIGGER paint_items_updated_at
  BEFORE UPDATE ON paint_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Ringkasan Cepat (TL;DR)

| Kamu biasa pakai... | Di proyek ini pakainya... |
|---------------------|--------------------------|
| `app.get('/api/items')` | `getPaintItems()` di `src/actions/paint-items.ts` |
| `app.post('/api/items')` | `createPaintItem()` di `src/actions/paint-items.ts` |
| `req.user` (dari JWT middleware) | `getSession()` dari `src/lib/session.ts` |
| `authMiddleware` | `requireRole("admin")` di auth-guard atau session |
| `prisma.items.findMany()` | `supabase.from("paint_items").select("*")` |
| `prisma.items.create()` | `supabase.from("paint_items").insert({...})` |
| `prisma.items.update()` | `supabase.from("paint_items").update({...}).eq("id", id)` |
| `prisma.items.delete()` | `supabase.from("paint_items").delete().eq("id", id)` |
| `db.raw('SELECT COUNT(*)')` | `supabase.from("table").select("*", { count: "exact", head: true })` |
| WebSocket server (Socket.io) | `useRealtimeSubscription()` hook |
| Migration (Laravel/Prisma) | File SQL di `supabase/migrations/` |
| `WHERE` manual untuk filter akses | RLS policy di database |

---

> **Intinya:** Supabase menggantikan peran "backend server" yang biasa kamu tulis. Kamu tidak perlu
> bikin route, controller, atau query SQL manual. Cukup panggil method dari Supabase client di dalam
> Server Action, dan Supabase yang urus sisanya (query, auth token, realtime broadcast, dll).
