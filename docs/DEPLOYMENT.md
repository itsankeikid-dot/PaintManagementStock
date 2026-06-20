# Deployment Guide

## Prerequisites

- Node.js 18.18+ installed
- A Supabase project (free tier works)
- A Cloudflare account (free tier works)
- Git repository pushed to GitHub

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once ready, go to **SQL Editor**
3. Run the contents of `supabase/schema.sql` to create all tables, triggers, RLS policies, and seed data
4. Run each migration file in `supabase/migrations/` in order (001 through 006)
5. Go to **Settings > API** and copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key**
   - **service_role key** (secret — never expose to the browser)

No Supabase Auth configuration needed — authentication is handled via PIN lookup and JWT cookies.

## Step 2: Verify Users

The schema includes 3 seed users:
- Admin: PIN `1234` (auto-hashed on first login)
- Warehouse Operator 1: PIN `1111` (auto-hashed on first login)
- Sideroom Operator 1: PIN `2222` (auto-hashed on first login)

You can add more users via the SQL Editor or from the Admin dashboard after login.

## Step 3: Deploy to Cloudflare

The project uses [OpenNext.js](https://opennext.js.org) with `@opennextjs/cloudflare` to run Next.js on Cloudflare Workers.

### Option A: Deploy via CLI (Recommended)

```bash
# Install dependencies
npm install

# Build and deploy
npm run deploy
```

This runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`.

### Option B: Preview Locally

```bash
npm run preview
```

This builds and starts a local Cloudflare Worker preview server.

### Wrangler Configuration

The `wrangler.jsonc` file configures the Cloudflare Worker:
- **Worker name**: `paintmanagementstock`
- **Compatibility flags**: `nodejs_compat`, `global_fetch_strictly_public`
- **Assets**: served from `.open-next/assets`
- **Public vars**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are declared in `wrangler.jsonc` (these are public by design)

## Step 4: Set Environment Variables (Secrets)

Secrets must be set via the **Cloudflare Dashboard** (Settings > Variables) or `wrangler secret put`:

```bash
wrangler secret put JWT_SECRET
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (public, in `wrangler.jsonc`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon key (public, in `wrangler.jsonc`) |
| `JWT_SECRET` | Yes | Strong random secret for JWT session signing |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (secret — server-side only, bypasses RLS) |

## Step 5: Verify Deployment

1. Visit your deployed Cloudflare Workers URL
2. You should see the login page
3. Enter the admin PIN (`1234`)
4. You should be redirected to the admin dashboard

## Step 6: Create Additional Users

1. From the admin dashboard, go to User Management
2. Create warehouse operator:
   - Name: "Warehouse Op 1"
   - PIN: `1111`
   - Role: `warehouse`
3. Create sideroom operator:
   - Name: "Sideroom Op 1"
   - PIN: `2222`
   - Role: `sideroom`

## Environment Variables Reference

| Variable | Scope | Where Set | Description |
|----------|-------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | `wrangler.jsonc` vars | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | `wrangler.jsonc` vars | Supabase anon/public key |
| `JWT_SECRET` | Secret | Cloudflare Dashboard / `wrangler secret put` | JWT signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Cloudflare Dashboard / `wrangler secret put` | Service role key for server actions |

## Supabase Production Checklist

- [ ] Verify all tables created successfully via SQL Editor
- [ ] Run all migration files (001–006) in order
- [ ] Set up database backups (automatic on Pro plan)
- [ ] RLS is enabled on all tables (configured in schema.sql + migration 004)
- [ ] Set a strong `JWT_SECRET`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` as a Cloudflare secret (never in `wrangler.jsonc`)
- [ ] Enable Realtime replication for `log` and `stock` tables (Supabase Dashboard > Database > Replication)

## Troubleshooting

### Login not working
- Check that users exist in the `users` table (`SELECT * FROM users`)
- Verify the PIN matches (seed PINs are auto-hashed on first login)
- Check that `JWT_SECRET` is set consistently across environments
- Check rate limiting (10 attempts per 15-minute window)

### Data not showing
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set as a Cloudflare secret
- Check browser console for Supabase connection errors

### Realtime not updating
- Go to Supabase Dashboard > Database > Replication
- Enable replication for the `log` and `stock` tables
- Verify the Realtime publication includes both tables (migration 004)

### Build/deploy errors
- Ensure `npm install` completes without errors
- Check that `wrangler.jsonc` has valid configuration
- Verify Node.js version is 18.18+
- Check Cloudflare account has Workers enabled
