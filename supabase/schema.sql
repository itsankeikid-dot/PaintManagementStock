-- ============================================================
-- Paint Warehouse Stock Management System - Database Schema
-- NO Supabase Auth dependency. Simple users table with PIN.
-- Run this SQL in Supabase SQL Editor to set up all tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE log_type AS ENUM ('STOCK_IN', 'STOCK_OUT', 'SIDEROOM_IN', 'DISPOSE', 'SIDEROOM_USE', 'PAINT_CONSUMED');
CREATE TYPE user_role AS ENUM ('warehouse', 'sideroom', 'admin', 'office');

-- ============================================================
-- TABLES
-- ============================================================

-- Users table - standalone, no Supabase Auth dependency
-- Each user has a name, PIN (4-6 digits), and a role
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'warehouse',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Paint items master data
-- Contains all types of paint available in the warehouse
CREATE TABLE paint_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color_code TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#808080',
  can_size TEXT NOT NULL,
  weight_per_can NUMERIC(10,2) NOT NULL DEFAULT 0,  -- kg per can; used to convert warehouse cans -> kg
  category TEXT NOT NULL DEFAULT 'Standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock table - tracks current stock levels per paint item (all in kg)
-- stock_warehouse = paint weight in the warehouse (kg)
-- stock_sideroom  = leftover paint weight in the sideroom (kg)
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paint_item_id UUID NOT NULL REFERENCES paint_items(id) ON DELETE CASCADE,
  stock_warehouse NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_sideroom NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(paint_item_id)
);

-- Log table - records every stock movement
-- Types: STOCK_IN (new arrival), STOCK_OUT (sent to painting),
--        SIDEROOM_IN (leftover from painting), DISPOSE (thrown away),
--        SIDEROOM_USE (used/consumed from sideroom stock),
--        PAINT_CONSUMED (auto-logged: paint consumed during painting = STOCK_OUT − SIDEROOM_IN)
CREATE TABLE log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paint_item_id UUID NOT NULL REFERENCES paint_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type log_type NOT NULL,
  qty NUMERIC(10,2) NOT NULL CHECK (qty > 0),
  notes TEXT,
  condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_log_paint_item ON log(paint_item_id);
CREATE INDEX idx_log_type ON log(type);
CREATE INDEX idx_log_created_at ON log(created_at);
CREATE INDEX idx_log_user ON log(user_id);
CREATE INDEX idx_stock_paint_item ON stock(paint_item_id);
CREATE INDEX idx_paint_items_active ON paint_items(is_active);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update `updated_at` on paint_items
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER paint_items_updated_at
  BEFORE UPDATE ON paint_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update `updated_at` on stock
CREATE TRIGGER stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create stock row when new paint_item is inserted
CREATE OR REPLACE FUNCTION create_stock_for_paint_item()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock (paint_item_id, stock_warehouse, stock_sideroom)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_stock
  AFTER INSERT ON paint_items
  FOR EACH ROW EXECUTE FUNCTION create_stock_for_paint_item();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- RLS is ENABLED on all tables. Access control is enforced via:
--   - service_role: full access (used by server actions via admin client)
--   - anon: read-only on paint_items and stock only (browser client)
--
-- Users table is fully protected — PINs are never exposed to the browser.
-- Log table is protected — transaction history requires server-side access.
--
-- See migration 004_enable_rls.sql for the full policy definitions.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE paint_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE log ENABLE ROW LEVEL SECURITY;

-- Service role policies (bypass RLS, used by server actions)
CREATE POLICY "service_role_full_access_users"
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_paint_items"
  ON paint_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_stock"
  ON stock FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_log"
  ON log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon policies (read-only, limited tables for browser client)
CREATE POLICY "anon_select_paint_items"
  ON paint_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_stock"
  ON stock FOR SELECT TO anon USING (true);

-- Grants
GRANT ALL ON users TO service_role;
GRANT ALL ON paint_items TO service_role;
GRANT ALL ON stock TO service_role;
GRANT ALL ON log TO service_role;
GRANT SELECT ON paint_items TO anon;
GRANT SELECT ON stock TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Sample paint items (weight_per_can in kg)
INSERT INTO paint_items (name, color_code, color_hex, can_size, weight_per_can, category) VALUES
  ('White Base', 'W-001', '#FFFFFF', '1 Galon', 18, 'Base'),
  ('Red Oxide', 'R-001', '#CC0000', '1 Galon', 18, 'Standard'),
  ('Sky Blue', 'B-001', '#87CEEB', '1 Galon', 18, 'Standard'),
  ('Black', 'BK-001', '#000000', '1 Galon', 18, 'Standard'),
  ('Yellow Chrome', 'Y-001', '#FFD700', '1 Galon', 18, 'Standard'),
  ('Green Ral6005', 'G-001', '#006B3C', '1 Galon', 18, 'Standard'),
  ('Grey Primer', 'GP-001', '#808080', '1 Galon', 18, 'Primer'),
  ('Epoxy Red', 'ER-001', '#B22222', '5 Liter', 25, 'Epoxy'),
  ('Thinner A', 'TH-A01', '#F5F5DC', '5 Liter', 20, 'Thinner'),
  ('Clear Coat', 'CC-001', '#FAFAFA', '1 Galon', 18, 'Coating');

-- Sample users (PIN is stored as plain text for simplicity)
INSERT INTO users (name, pin, role) VALUES
  ('Admin', '1234', 'admin'),
  ('Warehouse Operator 1', '1111', 'warehouse'),
  ('Sideroom Operator 1', '2222', 'sideroom');
