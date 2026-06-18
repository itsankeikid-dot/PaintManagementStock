"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Stock, PaintItem } from "@/types/database";

/**
 * Fetches all stock levels with joined paint item data.
 *
 * @returns Array of stock entries with paint item details
 */
export async function getStockLevels(): Promise<
  (Stock & { paint_items: PaintItem })[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stock")
    .select("*, paint_items(*)")
    .order("paint_items(name)", { ascending: true });

  if (error) {
    console.error("Error fetching stock levels:", error);
    return [];
  }

  return (data || []) as unknown as (Stock & { paint_items: PaintItem })[];
}

/**
 * Fetches stock level for a specific paint item.
 *
 * @param paintItemId - UUID of the paint item
 * @returns Stock entry or null
 */
export async function getStockByPaintItem(
  paintItemId: string
): Promise<Stock | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stock")
    .select("*")
    .eq("paint_item_id", paintItemId)
    .single();

  if (error) {
    console.error("Error fetching stock:", error);
    return null;
  }

  return data as unknown as Stock;
}
