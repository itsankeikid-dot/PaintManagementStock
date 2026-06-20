"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import type { Log, LogType, PaintItem, User } from "@/types/database";

/** Role-based access control for transaction types (roles are lowercase from DB)
 *  PAINT_CONSUMED and SIDEROOM_RECEIVE are system-generated — no user role can trigger them manually. */
const ALLOWED_ROLES: Record<LogType, string[]> = {
  STOCK_IN: ["admin", "warehouse"],
  STOCK_OUT: ["admin", "sideroom"],
  RESIDUAL_RETURN: ["admin", "sideroom"],
  SIDEROOM_USE: ["admin", "sideroom"],
  DISPOSE: ["admin", "sideroom"],
  PAINT_CONSUMED: [],    // system-generated only
  SIDEROOM_RECEIVE: [],  // system-generated only
};

/**
 * Creates a log entry and updates stock in a single operation.
 * This is the core transaction function used by all stock movements.
 *
 * @param paintItemId - UUID of the paint item
 * @param type - Log type (STOCK_IN, STOCK_OUT, RESIDUAL_RETURN, DISPOSE)
 * @param qty - Quantity (must be > 0)
 * @param notes - Optional notes
 * @returns Success status with optional error
 */
async function createTransaction(
  paintItemId: string,
  type: LogType,
  qty: number,
  notes?: string,
  condition?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get current user from JWT session
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authorized" };
  }

  // Check role access (case-insensitive to handle DB lowercase enums)
  const userRole = session.role.toLowerCase();
  if (!ALLOWED_ROLES[type].includes(userRole)) {
    return { success: false, error: `Not authorized for this action` };
  }

  // Validate inputs — RESIDUAL_RETURN allows qty = 0 (all paint consumed, nothing returned)
  if (!paintItemId || qty < 0 || (qty === 0 && type !== "RESIDUAL_RETURN")) {
    return { success: false, error: "Invalid quantity or paint item" };
  }

  // Verify paint item exists and is active
  const { data: paintItem } = await supabase
    .from("paint_items")
    .select("id, is_active, weight_per_can")
    .eq("id", paintItemId)
    .single();

  if (!paintItem || !paintItem.is_active) {
    return { success: false, error: "Paint item not found or inactive" };
  }

  // Warehouse moves are entered in cans; convert to kg before storing.
  // Sideroom moves are already in kg.
  const isWarehouse = type === "STOCK_IN" || type === "STOCK_OUT";
  if (isWarehouse && (!paintItem.weight_per_can || paintItem.weight_per_can <= 0)) {
    return { success: false, error: "Berat per kaleng belum diatur untuk item ini" };
  }
  const storedQty = isWarehouse ? qty * paintItem.weight_per_can : qty;

  // Get current stock
  const { data: stock } = await supabase
    .from("stock")
    .select("*")
    .eq("paint_item_id", paintItemId)
    .single();

  if (!stock) {
    return { success: false, error: "Paint item stock not found" };
  }

  // Validate stock won't go negative (all stored values are kg)
  if (type === "STOCK_OUT" && stock.stock_warehouse < storedQty) {
    return { success: false, error: `Insufficient warehouse stock (available: ${stock.stock_warehouse} kg)` };
  }
  if ((type === "DISPOSE" || type === "SIDEROOM_USE") && stock.stock_sideroom < storedQty) {
    return { success: false, error: `Insufficient sideroom stock (available: ${stock.stock_sideroom} kg)` };
  }

  // RESIDUAL_RETURN: records how much residual paint came back after painting.
  // consumedQty = total_out - total_accounted - storedQty (the portion used up).
  // Capped at 0 so stock_sideroom never increases from this operation.
  let consumedQty = 0; // set when type === RESIDUAL_RETURN
  if (type === "RESIDUAL_RETURN") {
    const { data: logs } = await supabase
      .from("log")
      .select("type, qty")
      .eq("paint_item_id", paintItemId)
      .in("type", ["STOCK_OUT", "RESIDUAL_RETURN", "PAINT_CONSUMED"]);

    let totalOut = 0;
    let totalAccounted = 0; // residual_return + paint_consumed

    for (const log of logs || []) {
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

    const pendingResidual = totalOut - totalAccounted;

    if (storedQty > pendingResidual) {
      return {
        success: false,
        error: `Berat sisa melebihi cat yang keluar dari gudang. Maksimal: ${pendingResidual.toFixed(2)} kg`,
      };
    }

    // The portion not returned as residual is consumed during painting
    consumedQty = Math.max(0, pendingResidual - storedQty);

    // Guard: receiving the residual subtracts consumedQty from the sideroom
    // balance. If paint was already used/disposed from the sideroom before the
    // residual was recorded, that subtraction could push the balance negative.
    // Block it so stock_sideroom can never go below zero.
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
    return { success: false, error: logError.message };
  }

  // Update stock based on transaction type
  let stockUpdate: { stock_warehouse?: number; stock_sideroom?: number } = {};

  switch (type) {
    case "STOCK_IN":
      stockUpdate = { stock_warehouse: stock.stock_warehouse + storedQty };
      break;
    case "STOCK_OUT":
      // Paint leaving the warehouse moves straight into the sideroom balance:
      // warehouse decreases and sideroom increases by the same kg.
      stockUpdate = {
        stock_warehouse: stock.stock_warehouse - storedQty,
        stock_sideroom: stock.stock_sideroom + storedQty,
      };
      break;
    case "RESIDUAL_RETURN":
      // The full STOCK_OUT qty already entered the sideroom balance.
      // Receiving the residual only confirms how much came back; the rest was
      // consumed during painting, so we DECREASE sideroom by the consumed kg.
      // (consumedQty = pendingResidual - storedQty, computed above.)
      stockUpdate = { stock_sideroom: stock.stock_sideroom - consumedQty };
      break;
    case "DISPOSE":
      stockUpdate = { stock_sideroom: stock.stock_sideroom - storedQty };
      break;
    case "SIDEROOM_USE":
      stockUpdate = { stock_sideroom: stock.stock_sideroom - storedQty };
      break;
  }

  const { error: stockError } = await supabase
    .from("stock")
    .update(stockUpdate)
    .eq("paint_item_id", paintItemId);

  if (stockError) {
    console.error("Error updating stock:", stockError);
    return { success: false, error: stockError.message };
  }

  // Auto-log SIDEROOM_RECEIVE after a successful STOCK_OUT.
  // STOCK_OUT moves paint from warehouse → sideroom. The stock update is
  // already done above; this extra log records the sideroom arrival so the
  // activity feed shows both sides of the transfer.
  if (type === "STOCK_OUT") {
    const { error: sideInError } = await supabase.from("log").insert({
      paint_item_id: paintItemId,
      user_id: session.userId,
      type: "SIDEROOM_RECEIVE",
      qty: storedQty,
      notes: `Auto-logged: ${storedQty.toFixed(2)} kg diterima di sideroom dari Stock Out`,
      condition: null,
    });

    if (sideInError) {
      console.error("Error creating SIDEROOM_RECEIVE log (non-fatal):", sideInError);
    }
  }

  // Auto-log PAINT_CONSUMED after a successful RESIDUAL_RETURN.
  // consumedQty = pending_residual - received_qty (set above during validation).
  // This records the paint that was consumed (used up) during the painting
  // process and will not return to the sideroom as residual.
  if (type === "RESIDUAL_RETURN" && consumedQty > 0) {
    const { error: consumedError } = await supabase.from("log").insert({
      paint_item_id: paintItemId,
      user_id: session.userId,
      type: "PAINT_CONSUMED",
      qty: consumedQty,
      notes: `Auto-logged: ${consumedQty.toFixed(2)} kg consumed during painting (${storedQty.toFixed(2)} kg residual returned)`,
      condition: null,
    });

    if (consumedError) {
      // Log but don't fail the main transaction — stock was already updated
      console.error("Error creating PAINT_CONSUMED log (non-fatal):", consumedError);
    }
  }

  return { success: true };
}

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
 * Effect: STOCK_OUT log + stock_warehouse decreases (kg).
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

/**
 * Records paint being used/consumed from sideroom (applied to a job).
 * Effect: SIDEROOM_USE log + stock_sideroom decreases.
 */
export async function createSideroomUse(data: {
  paint_item_id: string;
  qty: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  return createTransaction(data.paint_item_id, "SIDEROOM_USE", data.qty, data.notes);
}

/**
 * Computes the pending residual (kg) for a paint item — the amount that left
 * the warehouse via STOCK_OUT but hasn't been accounted for yet.
 *
 * Formula: total_stock_out - total_sideroom_in - total_paint_consumed
 *
 * DISPOSE and SIDEROOM_USE reduce sideroom stock (already-received paint),
 * so they are intentionally excluded from this calculation.
 *
 * @param paintItemId - UUID of the paint item
 * @returns Pending residual in kg (0 if none)
 */
export async function getPendingResidualKg(paintItemId: string): Promise<number> {
  const supabase = createAdminClient();

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
}): Promise<(Log & { paint_items: PaintItem; users: User })[]> {
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

  return (data || []) as unknown as (Log & {
    paint_items: PaintItem;
    users: User;
  })[];
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
  dateTo: string
): Promise<(Log & { paint_items: PaintItem; users: User })[]> {
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

  return (data || []) as unknown as (Log & {
    paint_items: PaintItem;
    users: User;
  })[];
}

/**
 * Fetches log entries for a specific paint item (digital stock card).
 *
 * @param paintItemId - UUID of the paint item
 * @returns Array of log entries for that paint item
 */
export async function getLogByPaintItem(
  paintItemId: string
): Promise<(Log & { users: User })[]> {
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

  return (data || []) as unknown as (Log & { users: User })[];
}
