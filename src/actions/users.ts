"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/session";
import type { UserRole } from "@/types/database";
import bcrypt from "bcryptjs";

/** User profile shape returned to client (PIN excluded) */
export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

/**
 * Fetches all users (Admin only).
 * PIN is excluded from the response.
 *
 * @returns Array of users without PIN
 */
export async function getUsers(): Promise<UserProfile[]> {
  await requireRole("admin");

  const supabase = createAdminClient();

  // Never return PIN to the client
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return (data || []) as UserProfile[];
}

/**
 * Creates a new user with hashed PIN (Admin only).
 *
 * @param data - User data: name, PIN, role
 * @returns Success status with optional error
 */
export async function createUser(data: {
  name: string;
  pin: string;
  role: UserRole;
}): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin");

  const supabase = createAdminClient();

  // Hash the PIN before storing
  const hashedPin = await bcrypt.hash(data.pin, 10);

  const { error } = await supabase.from("users").insert({
    name: data.name,
    pin: hashedPin,
    role: data.role,
  });

  if (error) {
    console.error("Error creating user:", error);
    if (error.code === "23505") {
      return { success: false, error: "PIN already in use. Choose a different PIN." };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Updates a user (Admin only).
 * If PIN is being updated, it will be hashed before storing.
 *
 * @param id - UUID of the user to update
 * @param data - Partial user data to update
 * @returns Success status with optional error
 */
export async function updateUser(
  id: string,
  data: Partial<{ name: string; pin: string; role: UserRole }>
): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin");

  const supabase = createAdminClient();

  // Hash PIN if provided
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.pin) {
    updatePayload.pin = await bcrypt.hash(data.pin, 10);
  }

  const { error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Deletes a user (Admin only).
 *
 * @param id - UUID of the user to delete
 * @returns Success status with optional error
 */
export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin");

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
