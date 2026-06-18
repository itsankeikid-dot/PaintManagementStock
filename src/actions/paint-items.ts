"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/session";
import type { PaintItem } from "@/types/database";

/**
 * Fetches paint items from master data.
 *
 * @param activeOnly - If true, only returns active items (default: true)
 * @returns Array of PaintItem objects
 */
export async function getPaintItems(activeOnly = true): Promise<PaintItem[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("paint_items")
    .select("*")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching paint items:", error);
    return [];
  }

  return data || [];
}

/**
 * Creates a new paint item (Admin only).
 * The stock row is auto-created by a database trigger.
 *
 * @param data - Paint item data to create
 * @returns Success status with optional error message
 */
export async function createPaintItem(data: {
  name: string;
  color_code: string;
  color_hex: string;
  can_size: string;
  weight_per_can: number;
  category: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin");

  const supabase = createAdminClient();

  const { error } = await supabase.from("paint_items").insert({
    ...data,
    is_active: true,
  });

  if (error) {
    console.error("Error creating paint item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Updates an existing paint item (Admin only).
 *
 * @param id - UUID of the paint item to update
 * @param data - Partial paint item data to update
 * @returns Success status with optional error message
 */
export async function updatePaintItem(
  id: string,
  data: Partial<Pick<PaintItem, "name" | "color_code" | "color_hex" | "can_size" | "weight_per_can" | "category" | "is_active">>
): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin");

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("paint_items")
    .update(data)
    .eq("id", id);

  if (error) {
    console.error("Error updating paint item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Toggles a paint item's active status (Admin only).
 *
 * @param id - UUID of the paint item
 * @param isActive - New active status
 * @returns Success status with optional error message
 */
export async function togglePaintItemActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updatePaintItem(id, { is_active: isActive });
}

/**
 * Deletes a paint item (Admin only).
 * Note: Will fail if the item has existing stock or log entries (FK constraint).
 *
 * @param id - UUID of the paint item to delete
 * @returns Success status with optional error message
 */
export async function deletePaintItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin");

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("paint_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting paint item:", error);
    if (error.code === "23503") {
      return { success: false, error: "Item ini tidak dapat dihapus karena memiliki data stok atau riwayat transaksi. Nonaktifkan saja." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}
