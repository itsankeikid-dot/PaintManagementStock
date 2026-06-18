-- Migration 004: Enable Row Level Security
-- ============================================================
-- This migration enables RLS on all tables and creates policies
-- that restrict access based on the Supabase role:
--   - service_role (admin client): full access to all tables
--   - anon (browser client): read-only on paint_items and stock only
--
-- PREREQUISITE: Set SUPABASE_SERVICE_ROLE_KEY in .env.local
--   Get it from: Supabase Dashboard → Settings → API → service_role key

-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE paint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. SERVICE ROLE POLICIES (bypasses all restrictions)
-- ============================================================
CREATE POLICY "service_role_full_access_users"
  ON users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_paint_items"
  ON paint_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_stock"
  ON stock FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_log"
  ON log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 3. ANON POLICIES (browser client - read-only, limited tables)
-- ============================================================
-- Anon can read paint_items (for dropdown lists in warehouse/sideroom)
CREATE POLICY "anon_select_paint_items"
  ON paint_items FOR SELECT TO anon
  USING (true);

-- Anon can read stock (for stock level display)
CREATE POLICY "anon_select_stock"
  ON stock FOR SELECT TO anon
  USING (true);

-- NO anon access to `users` table (PINs are protected)
-- NO anon access to `log` table (transaction history is protected)
-- NO anon INSERT/UPDATE/DELETE on ANY table

-- ============================================================
-- 4. REALTIME PUBLICATION
-- ============================================================
-- Ensure tables are in the realtime publication so browser
-- subscriptions can receive change events.
ALTER PUBLICATION supabase_realtime ADD TABLE stock;
ALTER PUBLICATION supabase_realtime ADD TABLE log;

-- ============================================================
-- 5. REVOKE PREVIOUS ANON GRANTS (cleanup from schema.sql)
-- ============================================================
REVOKE ALL ON users FROM anon;
REVOKE INSERT, UPDATE, DELETE ON paint_items FROM anon;
REVOKE INSERT, UPDATE, DELETE ON stock FROM anon;
REVOKE ALL ON log FROM anon;

-- Grant only SELECT back where needed (already covered by RLS policies above,
-- but explicit GRANT is needed for Postgres to allow the query at all)
GRANT SELECT ON paint_items TO anon;
GRANT SELECT ON stock TO anon;
