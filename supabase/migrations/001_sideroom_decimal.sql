-- Migration: Sideroom decimal weight + condition tracking
-- stock_sideroom: INTEGER → NUMERIC(10,2) for kg-based weight tracking
-- log.qty: INTEGER → NUMERIC(10,2) for decimal quantities
-- log.condition: new column for sideroom entries

-- stock_sideroom to NUMERIC (warehouse stays INTEGER)
ALTER TABLE stock ALTER COLUMN stock_sideroom TYPE NUMERIC(10,2);

-- log.qty to NUMERIC, update CHECK constraint
ALTER TABLE log DROP CONSTRAINT IF EXISTS log_qty_check;
ALTER TABLE log ALTER COLUMN qty TYPE NUMERIC(10,2);
ALTER TABLE log ADD CONSTRAINT log_qty_check CHECK (qty > 0);

-- Condition field for sideroom entries
-- Values: 'murni', 'campur_thinner', 'campuran_warna' (nullable, only used for SIDEROOM_IN)
ALTER TABLE log ADD COLUMN IF NOT EXISTS condition TEXT;
