"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import type { Log, LogType, PaintItem, User } from "@/types/database";

/** Joined type for log queries that include paint item and user data. */
type LogWithPaintAndUser = Log & { paint_items: PaintItem; users: User };

/** Joined type for log queries that include only user data. */
type LogWithUser = Log & { users: User };

/**
 * Role-based access control for transaction types.
 * PAINT_CONSUMED and SIDEROOM_RECEIVE are system-generated — no user role can trigger them.
 */
const ALLOWED_ROLES: Record<string, string[]> = {
  STOCK_IN: ["admin", "warehouse"],
  STOCK_OUT: ["admin", "sideroom"],
  RESIDUAL_RETURN: ["admin", "sideroom"],
  DISPOSE: ["admin", "sideroom"],
  PAINT_CONSUMED: [],    // system-generated only
  SIDEROOM_RECEIVE: [],  // system-generated only
};

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Computes the pending residual (kg) for a paint item — the amount that left
 * the warehouse via STOCK_OUT but hasn't been accounted for yet.
 *
 * Formula: total_stock_out - total_residual_return - total_paint_consumed
 */
async function computePendingResidual(
  supabase: ReturnType<typeof createAdminClient>,
  paintItemId: string,
): Promise<number> {
  const { data: logs, error } = await supabase
    .from("log")
    .select("type, qty")
    .eq("paint_item_id", paintItemId)
    .in("type", ["STOCK_OUT", "RESIDUAL_RETURN", "PAINT_CONSUMED"]);

  if (error || !logs) {
    console.error("Error fetching logs for pending residual:", error);
    return 0;
  }

  let totalOut = 0;
  let totalAccounted = 0;

  for (const log of logs) {
    const q = Number(log.qty) || 0;
    switch (log.type) {
      case "STOCK_OUT":
        totalOut += q;
        break;
      case "RESIDUAL_RETURN":
      case "PAINT_CONSUMED":
        totalAccounted += q;
        break;
    }
  }

  return Math.max(0, totalOut - totalAccounted);
}

/**
 * Computes the stock delta for a given transaction type.
 * Returns an object with the warehouse/sideroom fields to update.
 */
function computeStockUpdate(
  type: LogType,
  storedQty: number,
  consumedQty: number,
  stock: { stock_warehouse: number; stock_sideroom: number },
): { stock_warehouse?: number; stock_sideroom?: number } {
  switch (type) {
    case "STOCK_IN":
      return { stock_warehouse: stock.stock_warehouse + storedQty };
    case "STOCK_OUT":
      // Paint leaving the warehouse moves straight into the sideroom balance.
      return {
        stock_warehouse: stock.stock_warehouse - storedQty,
        stock_sideroom: stock.stock_sideroom + storedQty,
      };
    case "RESIDUAL_RETURN":
      // Receiving the residual only confirms how much came back; the rest was
      // consumed during painting, so we DECREASE sideroom by the consumed kg.
      return { stock_sideroom: stock.stock_sideroom - consumedQty };
    case "DISPOSE":
      return { stock_sideroom: stock.stock_sideroom - storedQty };
    default:
      return {};
  }
}

/**
 * Auto-logs a SIDEROOM_RECEIVE entry after a successful STOCK_OUT.
 * Non-fatal — logs error but does not propagate failure.
 */
async function autoLogSideroomReceive(
  supabase: ReturnType<typeof createAdminClient>,
  paintItemId: string,
  userId: string,
  storedQty: number,
): Promise<void> {
  const { error } = await supabase.from("log").insert({
    paint_item_id: paintItemId,
    user_id: userId,
    type: "SIDEROOM_RECEIVE",
    qty: storedQty,
    notes: `Auto-logged: ${storedQty.toFixed(2)} kg received in sideroom from Stock Out`,
    condition: null,
  });

  if (error) {
    console.error("Error creating SIDEROOM_RECEIVE log (non-fatal):", error);
  }
}

/**
 * Auto-logs a PAINT_CONSUMED entry after a successful RESIDUAL_RETURN.
 * Records the paint consumed (used up) during the painting process.
 * Non-fatal — logs error but does not propagate failure.
 */
async function autoLogPaintConsumed(
  supabase: ReturnType<typeof createAdminClient>,
  paintItemId: string,
  userId: string,
  consumedQty: number,
  storedQty: number,
): Promise<void> {
  const { error } = await supabase.from("log").insert({
    paint_item_id: paintItemId,
    user_id: userId,
    type: "PAINT_CONSUMED",
    qty: consumedQty,
    notes: `Auto-logged: ${consumedQty.toFixed(2)} kg consumed during painting (${storedQty.toFixed(2)} kg residual returned)`,
    condition: null,
  });

  if (error) {
    console.error("Error creating PAINT_CONSUMED log (non-fatal):", error);
  }
}

// ─── Core Transaction ────────────────────────────────────────────────────────

/**
 * Creates a log entry and updates stock in a single operation.
 * This is the core transaction function used by all stock movements.
 *
 * @param paintItemId - UUID of the paint item
 * @param type - Log type (STOCK_IN, STOCK_OUT, RESIDUAL_RETURN, DISPOSE)
 * @param qty - Quantity (must be > 0, except RESIDUAL_RETURN which allows 0)
 * @param notes - Optional notes
 * @param condition - Optional condition (used by DISPOSE)
 * @returns Success status with optional error
 */
async function createTransaction(
  paintItemId: string,
  type: LogType,
  qty: number,
  notes?: string,
  condition?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get current user from JWT session
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Tidak memiliki akses" };
  }

  // Check role access (case-insensitive to handle DB lowercase enums)
  const userRole = session.role.toLowerCase();
  if (!(ALLOWED_ROLES[type] ?? []).includes(userRole)) {
    return { success: false, error: "Tidak memiliki akses untuk aksi ini" };
  }

  // Validate inputs — RESIDUAL_RETURN allows qty = 0 (all paint consumed, nothing returned)
  if (!paintItemId || qty < 0 || (qty === 0 && type !== "RESIDUAL_RETURN")) {
    return { success: false, error: "Jumlah atau item cat tidak valid" };
  }

  // Verify paint item exists and is active
  const { data: paintItem } = await supabase
    .from("paint_items")
    .select("id, is_active, weight_per_can")
    .eq("id", paintItemId)
    .single();

  if (!paintItem || !paintItem.is_active) {
    return { success: false, error: "Item cat tidak ditemukan atau tidak aktif" };
  }

  // Warehouse moves are entered in cans; convert to kg before storing.
  // Sideroom moves are already in kg.
  const isWarehouseType = type === "STOCK_IN" || type === "STOCK_OUT";
  if (isWarehouseType && (!paintItem.weight_per_can || paintItem.weight_per_can <= 0)) {
    return { success: false, error: "Berat per kaleng belum diatur untuk item ini" };
  }
  const storedQty = isWarehouseType ? qty * paintItem.weight_per_can : qty;

  // Get current stock
  const { data: stock } = await supabase
    .from("stock")
    .select("*")
    .eq("paint_item_id", paintItemId)
    .single();

  if (!stock) {
    return { success: false, error: "Stok item cat tidak ditemukan" };
  }

  // Validate stock won't go negative (all stored values are kg)
  if (type === "STOCK_OUT" && stock.stock_warehouse < storedQty) {
    return {
      success: false,
      error: `Stok gudang tidak cukup (tersedia: ${stock.stock_warehouse} kg)`,
    };
  }
  if (type === "DISPOSE" && stock.stock_sideroom < storedQty) {
    return {
      success: false,
      error: `Stok sideroom tidak cukup (tersedia: ${stock.stock_sideroom} kg)`,
    };
  }

  // ── RESIDUAL_RETURN: calculate consumed vs returned portion ──
  let consumedQty = 0;
  if (type === "RESIDUAL_RETURN") {
    const pendingResidual = await computePendingResidual(supabase, paintItemId);

    if (pendingResidual <= 0) {
      // All STOCK_OUT paint has been fully reconciled (returned + consumed).
      // storedQty is the portion returned as residual, the rest was consumed.
      if (storedQty > stock.stock_sideroom) {
        return {
          success: false,
          error: stock.stock_sideroom > 0
            ? `Stok sideroom tidak cukup (tersedia: ${stock.stock_sideroom.toFixed(2)} kg)`
            : "Stok sideroom kosong, tidak ada cat yang bisa dicatat",
        };
      }
      consumedQty = stock.stock_sideroom - storedQty;
    } else if (storedQty > pendingResidual) {
      return {
        success: false,
        error: `Berat sisa melebihi cat yang keluar dari gudang (maksimal: ${pendingResidual.toFixed(2)} kg)`,
      };
    } else {
      consumedQty = Math.max(0, pendingResidual - storedQty);
    }

    // Guard: receiving the residual subtracts consumedQty from the sideroom
    // balance. Block it so stock_sideroom can never go below zero.
    if (stock.stock_sideroom < consumedQty) {
      return {
        success: false,
        error: `Stok sideroom tidak cukup untuk mencatat sisa ini (tersedia: ${stock.stock_sideroom.toFixed(2)} kg, dibutuhkan: ${consumedQty.toFixed(2)} kg). Catat "Terima Sisa" sebelum melakukan Pakai/Dispose.`,
      };
    }
  }

  // Insert log entry (qty stored in kg)
  const { error: logError } = await supabase.from("log").insert({
    paint_item_id: paintItemId,
    user_id: session.userId,
    type,
    qty: storedQty,
    notes: notes || null,
    condition: condition || null,
  });

  if (logError) {
    console.error("Error creating log:", logError);
    return { success: false, error: "Gagal mencatat transaksi" };
  }

  // Update stock based on transaction type
  const stockUpdate = computeStockUpdate(type, storedQty, consumedQty, stock);

  const { error: stockError } = await supabase
    .from("stock")
    .update(stockUpdate)
    .eq("paint_item_id", paintItemId);

  if (stockError) {
    // Compensating rollback: undo the log insert to keep data consistent.
    // NOTE: This is not a true atomic transaction. For production-grade safety,
    // wrap this in a Supabase RPC function with BEGIN...COMMIT.
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

  // Auto-log complementary entries
  if (type === "STOCK_OUT") {
    await autoLogSideroomReceive(supabase, paintItemId, session.userId, storedQty);
  }

  if (type === "RESIDUAL_RETURN" && consumedQty > 0) {
    await autoLogPaintConsumed(
      supabase, paintItemId, session.userId, consumedQty, storedQty,
    );
  }

  return { success: true };
}

// ─── Public Wrappers (exported server actions) ──────────────────────────────

/**
 * Records new paint arriving at the warehouse.
 * `qty` is the number of CANS; the server converts to kg via weight_per_can.
 * Effect: STOCK_IN log + stock_warehouse increases (kg).
 */
export async function createStockIn(data: {
  paint_item_id: string;
  qty: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  return createTransaction(data.paint_item_id, "STOCK_IN", data.qty, data.notes);
}

/**
 * Records paint taken from warehouse to painting section.
 * `qty` is the number of CANS; the server converts to kg via weight_per_can.
 * Effect: STOCK_OUT log + stock_warehouse decreases, stock_sideroom increases (kg).
 */
export async function createStockOut(data: {
  paint_item_id: string;
  qty: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  return createTransaction(data.paint_item_id, "STOCK_OUT", data.qty, data.notes);
}

/**
 * Records leftover paint received in sideroom from painting.
 * Effect: RESIDUAL_RETURN log + stock_sideroom adjusted.
 */
export async function createResidualReturn(data: {
  paint_item_id: string;
  qty: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  return createTransaction(data.paint_item_id, "RESIDUAL_RETURN", data.qty, data.notes);
}

/**
 * Records paint being disposed (expired/mixed with thinner).
 * Effect: DISPOSE log + stock_sideroom decreases.
 */
export async function createDispose(data: {
  paint_item_id: string;
  qty: number;
  notes?: string;
  condition?: string;
}): Promise<{ success: boolean; error?: string }> {
  return createTransaction(data.paint_item_id, "DISPOSE", data.qty, data.notes, data.condition);
}

// ─── Read Queries ────────────────────────────────────────────────────────────

/**
 * Computes the pending residual (kg) for a paint item — the amount that left
 * the warehouse via STOCK_OUT but hasn't been accounted for yet.
 *
 * @param paintItemId - UUID of the paint item
 * @returns Pending residual in kg (0 if none)
 */
export async function getPendingResidualKg(paintItemId: string): Promise<number> {
  const supabase = createAdminClient();
  return computePendingResidual(supabase, paintItemId);
}

/**
 * Fetches log entries with optional filters.
 *
 * @param filters - Optional filters for paint item, type, date range, and limit
 * @returns Array of log entries with joined paint item and profile data
 */
export async function getLogEntries(filters?: {
  paint_item_id?: string;
  type?: LogType;
  date_from?: string;
  date_to?: string;
  limit?: number;
}): Promise<LogWithPaintAndUser[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("log")
    .select("*, paint_items(*), users(*)")
    .order("created_at", { ascending: false })
    .limit(filters?.limit || 50);

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

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }

  return (data ?? []) as LogWithPaintAndUser[];
}

/**
 * Fetches all log entries within a date range for CSV export.
 * No limit — returns full dataset with paint item and user joins.
 *
 * @param dateFrom - Start date (YYYY-MM-DD, WIB)
 * @param dateTo - End date (YYYY-MM-DD, WIB)
 * @returns Array of log entries with joined paint item and user data
 */
export async function getLogsForExport(
  dateFrom: string,
  dateTo: string,
): Promise<LogWithPaintAndUser[]> {
  const supabase = createAdminClient();

  const utcFrom = `${dateFrom}T00:00:00+07:00`;
  const utcTo = `${dateTo}T23:59:59+07:00`;

  const { data, error } = await supabase
    .from("log")
    .select("*, paint_items(*), users(*)")
    .gte("created_at", utcFrom)
    .lte("created_at", utcTo)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching logs for export:", error);
    return [];
  }

  return (data ?? []) as LogWithPaintAndUser[];
}

/**
 * Fetches log entries for a specific paint item (digital stock card).
 *
 * @param paintItemId - UUID of the paint item
 * @returns Array of log entries for that paint item
 */
export async function getLogByPaintItem(
  paintItemId: string,
): Promise<LogWithUser[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("log")
    .select("*, users(*)")
    .eq("paint_item_id", paintItemId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching paint item logs:", error);
    return [];
  }

  return (data ?? []) as LogWithUser[];
}
