# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase project (free tier works)
- A Vercel account (free tier works)
- Git repository pushed to GitHub/GitLab

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once ready, go to **SQL Editor**
3. Run the contents of `supabase/schema.sql` to create all tables, triggers, and seed data
4. Go to **Settings > API** and copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key**

No Supabase Auth configuration needed - authentication is handled via PIN lookup and JWT cookies.

## Step 2: Verify Users

The schema includes 3 seed users:
- Admin: PIN `1234`
- Warehouse Operator 1: PIN `1111`
- Sideroom Operator 1: PIN `2222`

You can add more users via the SQL Editor or from the Admin dashboard after login.

## Step 3: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and click **New Project**
3. Import your GitHub repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**

### Option B: Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

When prompted, add the environment variables above.

## Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-app.vercel.app`)
2. You should see the login page
3. Enter the admin PIN you created
4. You should be redirected to the admin dashboard

## Step 5: Create Additional Users

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

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key |
| `JWT_SECRET` | No | Custom secret for JWT signing (default: built-in key) |

## Custom Domain (Optional)

1. In Vercel, go to **Settings > Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions
4. SSL certificate is automatically provisioned

## Supabase Production Checklist

- [ ] Verify all tables created successfully via SQL Editor
- [ ] Set up database backups (automatic on Pro plan)
- [ ] Consider enabling RLS if additional security is needed
- [ ] Set a strong custom `JWT_SECRET` in environment variables

## Troubleshooting

### Login not working
- Check that users exist in the `users` table (select * from users)
- Verify the PIN matches what you're entering
- Check that the JWT_SECRET env var is consistent between deployments

### Data not showing
- Verify environment variables are set correctly in Vercel
- Check browser console for Supabase connection errors
- Ensure the database tables were created successfully

### Realtime not updating
- Go to Supabase Dashboard > Database > Replication
- Enable replication for the `log` and `stock` tables
