/**
 * Date utility functions for WIB (Waktu Indonesia Barat / UTC+7).
 * All timestamps in the database are stored as UTC (TIMESTAMPTZ).
 * These helpers convert and format them for display/query in WIB.
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

/**
 * Returns the current date/time in WIB as a Date object.
 */
export function nowWIB(): Date {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

/**
 * Converts a UTC date string (from DB) to WIB Date object.
 */
export function toWIB(utcDateString: string): Date {
  return new Date(new Date(utcDateString).getTime() + WIB_OFFSET_MS);
}

/**
 * Returns today's date in WIB formatted as YYYY-MM-DD.
 * Useful for server-side queries filtering by "today" in WIB.
 */
export function todayWIB(): string {
  return nowWIB().toISOString().split("T")[0];
}

/**
 * Returns a date range (from, to) in WIB as YYYY-MM-DD strings.
 * Useful for querying a week range in WIB.
 */
export function dateRangeWIB(daysBack: number): { from: string; to: string } {
  const today = nowWIB();
  const from = new Date(today);
  from.setDate(today.getDate() - daysBack);
  return {
    from: from.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

/**
 * Formats a UTC timestamp to WIB date string (YYYY-MM-DD).
 * For display in tables/lists.
 */
export function formatDateWIB(utcDateString: string): string {
  if (!utcDateString) return "-";
  const d = toWIB(utcDateString);
  return d.toISOString().split("T")[0];
}

/**
 * Formats a UTC timestamp to readable WIB date string (DD/MM/YYYY).
 * For CSV exports and human-readable display.
 */
export function formatDateReadableWIB(utcDateString: string): string {
  if (!utcDateString) return "-";
  const d = toWIB(utcDateString);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a UTC timestamp to readable WIB datetime string (DD/MM/YYYY HH:mm).
 * For CSV exports and human-readable display.
 */
export function formatDateTimeReadableWIB(utcDateString: string): string {
  if (!utcDateString) return "-";
  const d = toWIB(utcDateString);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
export function formatDateTimeWIB(utcDateString: string): string {
  if (!utcDateString) return "-";
  const d = toWIB(utcDateString);
  return d.toISOString().replace("T", " ").substring(0, 16);
}
