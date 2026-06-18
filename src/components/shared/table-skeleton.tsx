// Deterministic pseudo-random widths to avoid hydration mismatch
const HEADER_WIDTHS = [82, 68, 91, 75, 87, 64, 79, 96];
const CELL_WIDTHS = [
  [78, 65, 92, 71, 84],
  [88, 73, 60, 95, 69],
  [62, 86, 77, 53, 98],
  [94, 58, 82, 67, 75],
  [72, 90, 64, 81, 56],
  [85, 70, 97, 63, 79],
  [66, 83, 74, 91, 68],
  [80, 57, 89, 76, 93],
];
const BAR_HEIGHTS = [140, 200, 120, 180, 160, 220, 150];

/**
 * Reusable skeleton loader for tables.
 * Shows animated placeholder rows while data is loading.
 */
export function TableSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-3 flex gap-6">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-slate-200 animate-pulse"
            style={{ width: `${HEADER_WIDTHS[i % HEADER_WIDTHS.length]}px` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-6 px-5 py-3.5 border-b border-[#F8FAFC] last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="flex items-center gap-2">
              {colIdx === 0 && (
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
              )}
              <div
                className="h-3.5 rounded bg-slate-200 animate-pulse"
                style={{ width: `${CELL_WIDTHS[rowIdx % CELL_WIDTHS.length][colIdx % CELL_WIDTHS[0].length]}px` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard stat cards.
 */
export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-9 w-16 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the daily usage chart area.
 */
export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
      </div>
      <div className="p-6">
        <div className="flex items-end gap-3 h-[320px]">
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t bg-slate-200 animate-pulse"
                style={{ height: `${h}px` }}
              />
              <div className="h-3 w-8 rounded bg-slate-100 animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
