"use client";

import { useState } from "react";
import { LOG_TYPE_COLORS, LOG_TYPE_LABELS } from "@/lib/constants";
import { formatDateTimeWIB } from "@/lib/date-utils";
import { formatQty } from "@/lib/format-utils";
import type { Log, PaintItem, User } from "@/types/database";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityFeedProps {
  logs: (Log & { paint_items: PaintItem; users: User })[];
  /** How many rows per page. Default 5 for operator pages, 10 for dashboard */
  pageSize?: number;
  title?: string;
  /** Optional action element rendered in the header (e.g. export button) */
  headerAction?: React.ReactNode;
}

/**
 * Reusable paginated activity feed.
 * Used on Warehouse, Sideroom, and Dashboard pages.
 */
export function ActivityFeed({ logs, pageSize = 5, title = "Aktivitas Terbaru", headerAction }: ActivityFeedProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  // Reset to page 1 if logs update and current page is out of range
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visibleLogs = logs.slice(start, start + pageSize);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
            <ClipboardList className="size-4 text-[#64748B]" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#1e344a]">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {headerAction}
          {logs.length > 0 && (
            <span className="text-xs text-[#94A3B8]">
              {start + 1}–{Math.min(start + pageSize, logs.length)} dari {logs.length}
            </span>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#F8FAFC]">
        {logs.length === 0 ? (
          <p className="text-center text-[#94A3B8] py-10 text-sm">Belum ada transaksi</p>
        ) : (
          visibleLogs.map((log) => {
            const isPositive = log.type === "STOCK_IN" || log.type === "SIDEROOM_IN";
            return (
              <div
                key={log.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFBFC] transition-colors duration-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl border-2 border-white shadow-sm shrink-0"
                    style={{ backgroundColor: log.paint_items?.color_hex }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#1e344a] text-sm truncate">
                        {log.paint_items?.name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${LOG_TYPE_COLORS[log.type]}`}>
                        {LOG_TYPE_LABELS[log.type]}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {log.users?.name} · {formatDateTimeWIB(log.created_at)}
                    </p>
                  </div>
                </div>
                <span className={`text-xl font-bold shrink-0 ml-3 tabular-nums ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                  {isPositive ? "+" : "−"}{formatQty(log.qty)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination footer — only show if more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#F1F5F9] bg-[#FAFBFC]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Halaman sebelumnya"
            className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          {/* Page number pills */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isActive = p === safePage;
              // Show: first, last, current, and neighbours of current
              const show = p === 1 || p === totalPages || Math.abs(p - safePage) <= 1;
              // Show ellipsis
              const showEllipsisBefore = p === safePage - 2 && safePage > 3;
              const showEllipsisAfter = p === safePage + 2 && safePage < totalPages - 2;

              if (showEllipsisBefore || showEllipsisAfter) {
                return <span key={p} className="text-[#94A3B8] text-xs px-1">…</span>;
              }
              if (!show) return null;

              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Halaman ${p}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5] ${
                    isActive
                      ? "bg-[#0e7ad5] text-white"
                      : "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Halaman berikutnya"
            className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
