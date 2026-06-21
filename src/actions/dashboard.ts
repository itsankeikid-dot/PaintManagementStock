"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { todayWIB, toWIB } from "@/lib/date-utils";
import type { DailyUsage, Stock, PaintItem, PaintItemUsageSummary } from "@/types/database";
import {
  LOW_STOCK_CONSUMPTION_MULTIPLIER,
  LOW_STOCK_LOOKBACK_DAYS,
  LOW_STOCK_MIN_FLOOR_KG,
} from "@/lib/constants";

/**
 * Fetches daily usage metrics for the bar chart.
 * Calculates issued, consumed, and wasted paint per day.
 *
 * @param dateFrom - Start date (YYYY-MM-DD)
 * @param dateTo - End date (YYYY-MM-DD)
 * @param paintItemId - Optional filter by paint item
 * @returns Array of daily usage metrics
 */
export async function getDailyUsage(
  dateFrom: string,
  dateTo: string,
  paintItemId?: string
): Promise<DailyUsage[]> {
  const supabase = createAdminClient();

  // Convert WIB date boundaries to UTC for querying (WIB = UTC+7)
  const utcFrom = `${dateFrom}T00:00:00+07:00`;
  const utcTo = `${dateTo}T23:59:59+07:00`;

  let query = supabase
    .from("log")
    .select("type, qty, created_at")
    .gte("created_at", utcFrom)
    .lte("created_at", utcTo)
    .in("type", ["STOCK_OUT", "DISPOSE", "PAINT_CONSUMED"]);

  if (paintItemId) {
    query = query.eq("paint_item_id", paintItemId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching daily usage:", error);
    return [];
  }

  // Group by date and calculate metrics
  const dailyMap = new Map<
    string,
    { issued: number; consumed: number; wasted: number }
  >();

  (data || []).forEach((entry) => {
    // Convert UTC timestamp to WIB date for grouping
    const date = toWIB(entry.created_at).toISOString().split("T")[0];
    const current = dailyMap.get(date) || {
      issued: 0,
      consumed: 0,
      wasted: 0,
    };

    switch (entry.type) {
      case "STOCK_OUT":
        current.issued += entry.qty;
        break;
      case "PAINT_CONSUMED":
        current.consumed += entry.qty;
        break;
      case "DISPOSE":
        current.wasted += entry.qty;
        break;
    }

    dailyMap.set(date, current);
  });

  // Zero-fill all days in range so chart always shows complete range
  const result: DailyUsage[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    const metrics = dailyMap.get(key) || { issued: 0, consumed: 0, wasted: 0 };
    result.push({
      date: key,
      issued: metrics.issued,
      consumed: metrics.consumed,
      wasted: metrics.wasted,
    });
  }

  return result;
}

/**
 * Fetches aggregated usage metrics per paint item for a given date range.
 * Computes issued, consumed, wasted, transaction count, waste ratio,
 * consumption rate, and last-used date from the log table.
 *
 * @param dateFrom - Start date (YYYY-MM-DD, WIB)
 * @param dateTo   - End date   (YYYY-MM-DD, WIB)
 * @returns Array of per-item usage summaries sorted by total_consumed desc
 */
export async function getPaintItemUsageSummary(
  dateFrom: string,
  dateTo: string,
): Promise<PaintItemUsageSummary[]> {
  const supabase = createAdminClient();

  const utcFrom = `${dateFrom}T00:00:00+07:00`;
  const utcTo = `${dateTo}T23:59:59+07:00`;

  const { data, error } = await supabase
    .from("log")
    .select("paint_item_id, type, qty, created_at, paint_items(name, color_code, color_hex)")
    .gte("created_at", utcFrom)
    .lte("created_at", utcTo)
    .in("type", ["STOCK_OUT", "DISPOSE", "PAINT_CONSUMED"]);

  if (error) {
    console.error("Error fetching paint item usage summary:", error);
    return [];
  }

  // Number of days in range (at least 1 to avoid division by zero)
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const daysInRange = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  // Group by paint_item_id
  const map = new Map<
    string,
    {
      paint_name: string;
      color_code: string;
      color_hex: string;
      issued: number;
      consumed: number;
      wasted: number;
      txCount: number;
      lastUsed: string | null;
    }
  >();

  (data || []).forEach((entry) => {
    const id = entry.paint_item_id;
    const pi = entry.paint_items as unknown as { name: string; color_code: string; color_hex: string } | null;
    const current = map.get(id) || {
      paint_name: pi?.name ?? "",
      color_code: pi?.color_code ?? "",
      color_hex: pi?.color_hex ?? "",
      issued: 0,
      consumed: 0,
      wasted: 0,
      txCount: 0,
      lastUsed: null as string | null,
    };

    current.txCount += 1;
    const qty = entry.qty ?? 0;
    switch (entry.type) {
      case "STOCK_OUT":
        current.issued += qty;
        break;
      case "PAINT_CONSUMED":
        current.consumed += qty;
        break;
      case "DISPOSE":
        current.wasted += qty;
        break;
    }

    // Track last used (WIB date)
    const entryDate = toWIB(entry.created_at).toISOString();
    if (!current.lastUsed || entryDate > current.lastUsed) {
      current.lastUsed = entryDate;
    }

    map.set(id, current);
  });

  const result: PaintItemUsageSummary[] = [];
  for (const [paintItemId, m] of map.entries()) {
    const wasteRatio = m.issued > 0 ? (m.wasted / m.issued) * 100 : 0;
    const consumptionRate = m.consumed / daysInRange;
    result.push({
      paint_item_id: paintItemId,
      paint_name: m.paint_name,
      color_code: m.color_code,
      color_hex: m.color_hex,
      total_issued: m.issued,
      total_consumed: m.consumed,
      total_wasted: m.wasted,
      transaction_count: m.txCount,
      waste_ratio: wasteRatio,
      consumption_rate: consumptionRate,
      last_used: m.lastUsed,
    });
  }

  // Sort by total consumed descending (top consumers first)
  result.sort((a, b) => b.total_consumed - a.total_consumed);
  return result;
}

/** Extended low-stock item that includes the computed dynamic threshold. */
export type LowStockItem = Stock & {
  paint_items: PaintItem;
  /** Per-item threshold: avg daily consumption × multiplier (kg). */
  threshold: number;
  /** Average daily consumption over the lookback period (kg/day). */
  avgDailyConsumption: number;
};

/**
 * Fetches paint items whose current warehouse stock is below their
 * individual dynamic threshold.
 *
 * The threshold for each item is calculated as:
 *   threshold = average_daily_consumption × LOW_STOCK_CONSUMPTION_MULTIPLIER
 *
 * Only warehouse stock is considered for the low-stock check; sideroom
 * stock is shown for reference but does not affect the determination.
 * Items with no consumption history fall back to the minimum floor
 * threshold so they still appear when warehouse stock is critically low.
 *
 * @returns Array of low stock items sorted by warehouse stock ascending
 */
export async function getLowStockItems(): Promise<LowStockItem[]> {
  const supabase = createAdminClient();

  // 1. Fetch all stock levels with paint item data
  const { data: stockData, error: stockError } = await supabase
    .from("stock")
    .select("*, paint_items(*)");

  if (stockError) {
    console.error("Error fetching stock for low-stock check:", stockError);
    return [];
  }

  const rows = (stockData || []) as unknown as (Stock & { paint_items: PaintItem })[];

  // 2. Fetch consumption logs for the lookback window
  const now = new Date();
  const lookbackFrom = new Date(now);
  lookbackFrom.setDate(lookbackFrom.getDate() - LOW_STOCK_LOOKBACK_DAYS);

  const { data: logs, error: logsError } = await supabase
    .from("log")
    .select("paint_item_id, qty")
    .eq("type", "PAINT_CONSUMED")
    .gte("created_at", lookbackFrom.toISOString());

  if (logsError) {
    console.error("Error fetching consumption logs for low-stock check:", logsError);
  }

  // 3. Compute average daily consumption per paint item
  const consumptionMap = new Map<string, number>();
  (logs || []).forEach((entry) => {
    const current = consumptionMap.get(entry.paint_item_id) || 0;
    consumptionMap.set(entry.paint_item_id, current + (entry.qty ?? 0));
  });

  // 4. Build low-stock list with dynamic thresholds
  const result: LowStockItem[] = [];
  for (const s of rows) {
    const totalConsumed = consumptionMap.get(s.paint_item_id) || 0;
    const avgDaily = totalConsumed / LOW_STOCK_LOOKBACK_DAYS;
    const dynamicThreshold = Math.max(
      avgDaily * LOW_STOCK_CONSUMPTION_MULTIPLIER,
      LOW_STOCK_MIN_FLOOR_KG,
    );

    const totalStock = s.stock_warehouse;
    if (totalStock < dynamicThreshold) {
      result.push({
        ...s,
        threshold: dynamicThreshold,
        avgDailyConsumption: avgDaily,
      });
    }
  }

  // Sort by warehouse stock ascending (most critical first)
  result.sort(
    (a, b) => a.stock_warehouse - b.stock_warehouse,
  );

  return result;
}

/**
 * Fetches summary statistics for the dashboard.
 *
 * @returns Object with total items, total stock, today's transactions count
 */
export async function getDashboardStats(): Promise<{
  totalItems: number;
  totalWarehouseStock: number;
  totalSideroomStock: number;
  todayTransactions: number;
}> {
  const supabase = createAdminClient();

  // Get stock summary
  const { data: stockData } = await supabase
    .from("stock")
    .select("stock_warehouse, stock_sideroom");

  // Get total active items
  const { count: totalItems } = await supabase
    .from("paint_items")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Get today's transaction count (using WIB date)
  const today = todayWIB();
  const { count: todayTransactions } = await supabase
    .from("log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${today}T00:00:00+07:00`);

  const totalWarehouse = (stockData || []).reduce(
    (sum, s) => sum + (s.stock_warehouse || 0),
    0
  );
  const totalSideroom = (stockData || []).reduce(
    (sum, s) => sum + (s.stock_sideroom || 0),
    0
  );

  return {
    totalItems: totalItems || 0,
    totalWarehouseStock: totalWarehouse,
    totalSideroomStock: totalSideroom,
    todayTransactions: todayTransactions || 0,
  };
}
