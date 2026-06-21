/**
 * Application-wide constants and configuration.
 * Role-related config lives in `@/lib/role-config`.
 */

/** Labels for log types displayed in the UI */
export const LOG_TYPE_LABELS: Record<string, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  SIDEROOM_RECEIVE: "Sideroom In",
  RESIDUAL_RETURN: "Sisa",
  DISPOSE: "Dispose",
  PAINT_CONSUMED: "Terpakai",
};

/** Colors for log type badges */
export const LOG_TYPE_COLORS: Record<string, string> = {
  STOCK_IN: "bg-green-100 text-green-800",
  STOCK_OUT: "bg-blue-100 text-blue-800",
  SIDEROOM_RECEIVE: "bg-teal-100 text-teal-800",
  RESIDUAL_RETURN: "bg-yellow-100 text-yellow-800",
  DISPOSE: "bg-red-100 text-red-800",
  PAINT_CONSUMED: "bg-orange-100 text-orange-800",
};

/**
 * Low-stock threshold configuration.
 * Each paint item's threshold = avg daily consumption × multiplier.
 * Only warehouse stock is compared against this threshold; sideroom
 * stock is shown for reference but does not affect the determination.
 */

/** Multiplier applied to average daily consumption to derive the safety-stock threshold. */
export const LOW_STOCK_CONSUMPTION_MULTIPLIER = 2.5;

/** Number of days of historical log data used to compute average daily consumption. */
export const LOW_STOCK_LOOKBACK_DAYS = 30;

/**
 * Minimum threshold floor (kg). Items with zero or very low historical
 * consumption still get flagged when stock drops below this value so they
 * never silently run out.
 */
export const LOW_STOCK_MIN_FLOOR_KG = 5;

