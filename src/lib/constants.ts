/**
 * Application-wide constants and configuration.
 */

/** Labels for log types displayed in the UI */
export const LOG_TYPE_LABELS: Record<string, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  SIDEROOM_RECEIVE: "Sideroom In",
  RESIDUAL_RETURN: "Residual Return",
  DISPOSE: "Dispose",
  SIDEROOM_USE: "Sideroom Use",
  PAINT_CONSUMED: "Consumed",
};

/** Colors for log type badges */
export const LOG_TYPE_COLORS: Record<string, string> = {
  STOCK_IN: "bg-green-100 text-green-800",
  STOCK_OUT: "bg-blue-100 text-blue-800",
  SIDEROOM_RECEIVE: "bg-teal-100 text-teal-800",
  RESIDUAL_RETURN: "bg-yellow-100 text-yellow-800",
  DISPOSE: "bg-red-100 text-red-800",
  SIDEROOM_USE: "bg-purple-100 text-purple-800",
  PAINT_CONSUMED: "bg-orange-100 text-orange-800",
};

/** Role labels for display */
export const ROLE_LABELS: Record<string, string> = {
  warehouse: "Warehouse Operator",
  sideroom: "Sideroom Operator",
  admin: "Admin",
  office: "Office",
};

/** Default low stock threshold — total stock (warehouse + sideroom) in kg. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 100;

/** Dashboard routes per role */
export const ROLE_DASHBOARD_ROUTES: Record<string, string> = {
  warehouse: "/warehouse",
  sideroom: "/sideroom",
  admin: "/dashboard",
  office: "/dashboard",
};
