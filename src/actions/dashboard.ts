"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { todayWIB, toWIB } from "@/lib/date-utils";
import type { DailyUsage, Stock, PaintItem } from "@/types/database";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";

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
 * Fetches paint items with stock below the threshold.
 *
 * @param threshold - Minimum stock level (default: 5)
 * @returns Array of low stock items with their stock data
 */
export async function getLowStockItems(
  threshold = DEFAULT_LOW_STOCK_THRESHOLD
): Promise<(Stock & { paint_items: PaintItem })[]> {
  const supabase = createAdminClient();

  // Threshold is on TOTAL stock (warehouse + sideroom), both in kg. Postgrest
  // can't filter on a sum of two columns, so filter + sort here.
  const { data, error } = await supabase
    .from("stock")
    .select("*, paint_items(*)");

  if (error) {
    console.error("Error fetching low stock items:", error);
    return [];
  }

  const rows = (data || []) as unknown as (Stock & { paint_items: PaintItem })[];
  return rows
    .filter((s) => s.stock_warehouse + s.stock_sideroom < threshold)
    .sort(
      (a, b) =>
        a.stock_warehouse + a.stock_sideroom - (b.stock_warehouse + b.stock_sideroom)
    );
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
