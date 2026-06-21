/**
 * TypeScript types matching the Supabase database schema.
 * These types ensure type safety when querying the database.
 *
 * @see docs/DATABASE.md for full schema documentation
 */

/** Possible log transaction types */
export type LogType = "STOCK_IN" | "STOCK_OUT" | "RESIDUAL_RETURN" | "DISPOSE" | "SIDEROOM_USE" | "PAINT_CONSUMED" | "SIDEROOM_RECEIVE";

/** User roles determining access level */
export type UserRole = "warehouse" | "sideroom" | "admin" | "office";

/** Paint item master data */
export interface PaintItem {
  id: string;
  name: string;
  color_code: string;
  color_hex: string;
  can_size: string;
  /** Weight of one can in kg; used to convert warehouse cans -> kg. */
  weight_per_can: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Stock levels per paint item */
export interface Stock {
  id: string;
  paint_item_id: string;
  stock_warehouse: number;
  stock_sideroom: number;
  updated_at: string;
  /** Joined field - not in DB */
  paint_items?: PaintItem;
}

/** Activity log entry */
export interface Log {
  id: string;
  paint_item_id: string;
  user_id: string;
  type: LogType;
  qty: number;
  notes: string | null;
  condition: string | null;
  created_at: string;
  /** Joined field - not in DB */
  paint_items?: PaintItem;
  /** Joined field - not in DB */
  users?: User;
}

/** User record (standalone, no Supabase Auth) */
export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  created_at: string;
}

/** Daily usage metrics for bar chart */
export interface DailyUsage {
  date: string;
  issued: number;
  consumed: number;
  wasted: number;
}

/** Aggregated usage metrics per paint item for a given date range. */
export interface PaintItemUsageSummary {
  paint_item_id: string;
  paint_name: string;
  color_code: string;
  color_hex: string;
  total_issued: number;
  total_consumed: number;
  total_wasted: number;
  transaction_count: number;
  /** Percentage: wasted / issued * 100 */
  waste_ratio: number;
  /** kg/day: consumed / days in range */
  consumption_rate: number;
  /** ISO date string or null if never used in range */
  last_used: string | null;
}

/** Aggregated dashboard statistics shown in monitoring cards */
export interface DashboardStats {
  totalItems: number;
  totalWarehouseStock: number;
  totalSideroomStock: number;
  todayTransactions: number;
}

/** Supabase Realtime connection status */
export type RealtimeStatus = "connecting" | "connected" | "disconnected";

/**
 * Database type definition for Supabase typed client.
 * Maps table names to their row types.
 */
export interface Database {
  public: {
    Tables: {
      paint_items: {
        Row: PaintItem;
        Insert: Omit<PaintItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PaintItem, "id" | "created_at">>;
      };
      stock: {
        Row: Stock;
        Insert: Omit<Stock, "id" | "updated_at">;
        Update: Partial<Omit<Stock, "id">>;
      };
      log: {
        Row: Log;
        Insert: Omit<Log, "id" | "created_at">;
        Update: Partial<Omit<Log, "id" | "created_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at">;
        Update: Partial<Omit<User, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      log_type: LogType;
      user_role: UserRole;
    };
  };
}
