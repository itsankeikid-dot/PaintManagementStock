# Hooks & Koneksi Supabase

Dokumen ini menjelaskan dua konsep yang sering ditanyakan di proyek ini:

1. Apa itu **hook** (dan custom hook yang kita pakai).
2. Bagaimana kode **terhubung ke Supabase** — bukan sekadar API key.

Semua contoh diambil dari kode yang benar-benar ada di proyek ini.

---

## 1. Apa itu Hook?

**Hook** adalah fungsi khusus React yang namanya diawali `use...`. Tugasnya
menyimpan **state** (data yang bisa berubah) dan **logika** di dalam komponen,
serta bereaksi terhadap perubahan.

### Hook bawaan React

| Hook | Fungsi |
|------|--------|
| `useState` | Menyimpan nilai yang bisa berubah (mis. `searchTerm`, `qty`) |
| `useEffect` | Menjalankan sesuatu saat komponen muncul atau saat nilai tertentu berubah (fetch data, subscribe realtime) |
| `useCallback` | Menyimpan referensi fungsi agar tidak dibuat ulang setiap render |
| `useRef` | Menyimpan nilai yang bertahan antar-render tanpa memicu render ulang |

### Custom hook

**Custom hook** adalah gabungan hook-hook bawaan menjadi satu fungsi `use...`
buatan sendiri, supaya logika bisa dipakai ulang dan halaman menjadi bersih.
Inilah yang dibuat saat refactor.

Contoh — `src/hooks/use-paint-items.ts`:

```ts
export function usePaintItems(initialItems: PaintItem[]) {
  const [items, setItems] = useState(initialItems);   // state
  const [searchTerm, setSearchTerm] = useState("");    // state
  const handleAdd = async (e) => { /* ... */ };        // logika
  // ...
  return { items, searchTerm, setSearchTerm, handleAdd, /* ... */ };
}
```

Di halaman cukup memakai hasilnya:

```tsx
const pi = usePaintItems(initialItems);
// pakai pi.items, pi.handleAdd, dst.
```

**Analogi:** hook seperti "mesin" berisi data + tombol-tombolnya. Halaman cukup
memakai mesinnya, tanpa tahu isi dalamnya.

### Aturan penting hook

- Hook **hanya** boleh dipanggil di dalam komponen React atau di dalam custom
  hook lain.
- **Jangan** memanggil hook di dalam `if`, loop, atau fungsi biasa — urutan
  pemanggilan hook harus konsisten di setiap render.

### Custom hook di proyek ini

| Hook | Tugas |
|------|-------|
| `use-dashboard-data.ts` | Fetch data dashboard + subscription Supabase Realtime |
| `use-daily-usage.ts` | State rentang tanggal chart + fetch data penggunaan |
| `use-dashboard-export.ts` | Export CSV dari dashboard |
| `use-paint-items.ts` | CRUD item cat + search + export |
| `use-users.ts` | CRUD user + search + export |
| `use-transaction-form.ts` | Logika form stock-in/out yang dipakai bersama |
| `use-paginated-search.ts` | Helper filter + paginasi |

---

## 2. Bagaimana Kode Terhubung ke Supabase

API key (`ANON_KEY`) hanya "tiket masuk". Hubungan sebenarnya terjadi lewat
beberapa lapisan.

### a) Client library membuka koneksi

`@supabase/ssr` membungkus URL + key menjadi sebuah **client object**. URL
menunjuk ke proyek Supabase (`https://xxx.supabase.co`), yang di belakangnya
adalah **PostgreSQL + REST API (PostgREST) + Realtime server**.

```ts
createBrowserClient(URL, ANON_KEY); // → objek untuk query
```

Saat kode menulis `supabase.from("stock").select()`, library mengubahnya menjadi
HTTP request ke endpoint REST Supabase, lalu dijawab dengan data dari tabel
Postgres. Jadi koneksinya adalah **HTTP request biasa** ke server Supabase, bukan
koneksi database langsung.

### b) Dua jenis client — beda tempat jalan

Proyek ini punya dua client, dan ini intinya:

| | Browser (`client.ts`) | Server (`server.ts`) |
|---|---|---|
| Jalan di | Komponen client (`"use client"`) | Server Actions, Server Components |
| Auth via | otomatis | **cookies** (`cookies()` dari Next.js) |
| Contoh | realtime dashboard | `loginWithPin`, `getStockLevels` |

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

`src/lib/supabase/server.ts` (disingkat) — membaca **cookie** dari request:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) { /* set cookie ke response */ },
    },
  });
}
```

Cookie inilah yang membawa identitas/sesi user — server tahu "siapa yang sedang
request" tanpa mengirim password lagi.

### c) Realtime — koneksi yang tetap nyambung (WebSocket)

Selain HTTP (sekali tanya–jawab), dashboard memakai **WebSocket** — koneksi yang
terus terbuka, supaya perubahan database langsung di-push ke browser. Ada di
`src/hooks/use-dashboard-data.ts`:

```ts
const supabase = createClient();
const channel = supabase
  .channel("dashboard-realtime")
  .on("postgres_changes",
      { event: "*", schema: "public", table: "stock" },
      () => debouncedFetch())   // ada perubahan di tabel stock → refetch
  )
  .subscribe();
```

Alur: Postgres berubah → Supabase Realtime server kirim notifikasi lewat
WebSocket → callback jalan → data dashboard diperbarui otomatis. Inilah yang
membuat badge **"Live"** muncul.

### d) Auth di proyek ini — bukan Supabase Auth standar

Proyek ini **tidak** memakai sistem login bawaan Supabase. Login-nya custom
(lihat `src/actions/auth.ts`):

1. User memasukkan PIN.
2. Server query tabel `users` mencari PIN yang cocok.
3. Jika cocok, dibuat **JWT session cookie** sendiri (`createSession`).
4. Request berikutnya membawa cookie itu → middleware memverifikasi.

### Diagram alur koneksi

```
Browser/Server code
   │  supabase.from(...).select()
   ▼
@supabase/ssr  ──HTTP──▶  Supabase REST API ──▶ PostgreSQL
   │
   └──WebSocket──▶  Supabase Realtime ──▶ (push perubahan tabel)

Identitas user: JWT cookie buatan sendiri (bukan ANON_KEY)
```

### Ringkasan

- **API key** membuka pintu ke proyek Supabase.
- **Client library** (`@supabase/ssr`) menerjemahkan kode menjadi HTTP / WebSocket request.
- **Cookies / JWT** yang menentukan siapa user-nya.
- **Hook** adalah hal terpisah — pola React untuk mengelola data & logika di sisi frontend.

---

## Lihat juga

- [ARCHITECTURE.md](ARCHITECTURE.md) — desain sistem, alur data, real-time, struktur folder
- [API.md](API.md) — referensi server action
- [DATABASE.md](DATABASE.md) — skema, tabel, RLS, trigger
