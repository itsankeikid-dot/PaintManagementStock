// All quantities (warehouse + sideroom) are tracked in kg.
export function formatQty(qty: number): string {
  return `${Number(qty).toFixed(2)} kg`;
}
