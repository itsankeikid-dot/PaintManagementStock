-- Migration: Warehouse tracked by weight (kg) instead of cans
-- paint_items.weight_per_can: kg per can, used to convert cans -> kg on stock-in/out
-- stock.stock_warehouse: INTEGER (cans) → NUMERIC(10,2) (kg)
-- Operators still enter cans in the UI; the app multiplies by weight_per_can
-- and stores the resulting kg in stock_warehouse and log.qty.

-- Per-can weight (kg). Default 0; admin must set a real value per item.
ALTER TABLE paint_items
  ADD COLUMN IF NOT EXISTS weight_per_can NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Warehouse stock now holds kg (decimal) like sideroom.
ALTER TABLE stock ALTER COLUMN stock_warehouse TYPE NUMERIC(10,2);
ALTER TABLE stock ALTER COLUMN stock_warehouse SET DEFAULT 0;
