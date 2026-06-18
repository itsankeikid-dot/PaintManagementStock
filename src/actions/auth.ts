"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, destroySession, getSession } from "@/lib/session";
import type { UserRole } from "@/types/database";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/constants";
import bcrypt from "bcryptjs";

/* ── Rate limiter ── */
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; firstAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) {
    attempts.set(key, { count: 1, firstAt: now });
    return true;
  }
  if (now - entry.firstAt > LOGIN_WINDOW_MS) {
    // Window expired, reset
    attempts.set(key, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }
  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now - entry.firstAt > LOGIN_WINDOW_MS) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Authenticates a user by PIN.
 * Supports both hashed (bcrypt) and legacy plaintext PINs.
 * Legacy PINs are automatically hashed on successful login.
 *
 * @param pin - 4-digit PIN entered by the user
 * @returns Object with success status, role, and redirect URL or error message
 */
export async function loginWithPin(pin: string): Promise<{
  success: boolean;
  role?: UserRole;
  redirectTo?: string;
  error?: string;
}> {
  try {
    // Rate limit by IP-like key (we use pin as key since no IP in server actions)
    const rateLimitKey = pin.slice(0, 2); // partial key to avoid storing actual PIN
    if (!checkRateLimit(rateLimitKey)) {
      return {
        success: false,
        error: "Terlalu banyak percobaan. Tunggu 15 menit dan coba lagi.",
      };
    }

    const supabase = createAdminClient();

    // Fetch ALL users and compare PINs in-memory (prevents timing attacks)
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, pin, role");

    if (error) {
      console.error("PIN lookup error:", error);
      return { success: false, error: "Terjadi kesalahan, coba lagi" };
    }

    // Compare PIN against each user (supports both hashed and plaintext)
    let matchedUser: (typeof users)[number] | null = null;
    let needsHashUpdate = false;

    for (const user of users || []) {
      const storedPin = user.pin;
      let isMatch = false;

      if (storedPin.startsWith("$2a$") || storedPin.startsWith("$2b$")) {
        // Already hashed with bcrypt
        isMatch = await bcrypt.compare(pin, storedPin);
      } else {
        // Legacy plaintext PIN
        isMatch = storedPin === pin;
        if (isMatch) needsHashUpdate = true;
      }

      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return { success: false, error: "PIN salah, coba lagi" };
    }

    // Auto-hash legacy plaintext PIN
    if (needsHashUpdate) {
      const hashed = await bcrypt.hash(pin, 10);
      await supabase
        .from("users")
        .update({ pin: hashed })
        .eq("id", matchedUser.id);
    }

    // Create JWT session cookie
    await createSession({
      userId: matchedUser.id,
      name: matchedUser.name,
      role: matchedUser.role,
    });

    const redirectTo = ROLE_DASHBOARD_ROUTES[matchedUser.role] || "/dashboard";
    return { success: true, role: matchedUser.role as UserRole, redirectTo };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Signs out the current user by removing the session cookie.
 * Navigation to /login is handled by the caller.
 */
export async function logout(): Promise<{ success: boolean }> {
  await destroySession();
  return { success: true };
}

/**
 * Gets the current user profile from the session cookie.
 * Also fetches fresh data from DB to ensure it's up to date.
 * PIN is excluded from the response for security.
 *
 * @returns User profile object (without PIN) or null if not logged in
 */
export async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();

  // Never return the PIN to the client
  const { data: user } = await supabase
    .from("users")
    .select("id, name, role, created_at")
    .eq("id", session.userId)
    .single();

  return user || null;
}
