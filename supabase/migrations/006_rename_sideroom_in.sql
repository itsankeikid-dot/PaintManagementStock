-- Migration: Rename SIDEROOM_IN to RESIDUAL_RETURN, add SIDEROOM_RECEIVE,
--              and allow qty = 0 for RESIDUAL_RETURN (all paint consumed).
--
-- 1. RESIDUAL_RETURN  — leftover/residual paint returned after a painting job.
--    qty = 0 means no residual came back (100% consumed during painting).
-- 2. SIDEROOM_RECEIVE — auto-logged when STOCK_OUT transfers paint from
--                       warehouse into the sideroom balance.

ALTER TYPE log_type RENAME VALUE 'SIDEROOM_IN' TO 'RESIDUAL_RETURN';
ALTER TYPE log_type ADD VALUE 'SIDEROOM_RECEIVE';

-- Relax qty constraint so RESIDUAL_RETURN can record 0 kg returned
ALTER TABLE log DROP CONSTRAINT IF EXISTS log_qty_check;
ALTER TABLE log ADD CONSTRAINT log_qty_check CHECK (qty >= 0);
