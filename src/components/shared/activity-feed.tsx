"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { LOG_TYPE_COLORS, LOG_TYPE_LABELS } from "@/lib/constants";
import { formatDateTimeWIB } from "@/lib/date-utils";
import { formatQty } from "@/lib/format-utils";
import type { Log, LogType, PaintItem, User } from "@/types/database";
import { ClipboardList, ChevronLeft, ChevronRight, Search, X, Filter } from "lucide-react";

const ALL_LOG_TYPES = Object.keys(LOG_TYPE_LABELS) as LogType[];

interface ActivityFeedProps {
  logs: (Log & { paint_items: PaintItem; users: User })[];
  /** How many rows per page. Default 5 for operator pages, 10 for dashboard */
  pageSize?: number;
  title?: string;
  /** Optional action element rendered in the header (e.g. export button) */
  headerAction?: React.ReactNode;
  /** Show search input to filter by paint name or color code */
  searchable?: boolean;
  /** Show transaction type filter chips */
  showTypeFilter?: boolean;
  /** Restrict displayed log types (hides non-matching logs entirely) */
  filterTypes?: LogType[];
}

/**
 * Reusable paginated activity feed with optional search and type filtering.
 * Used on Warehouse, Sideroom, and Dashboard pages.
 */
export function ActivityFeed({ logs, pageSize = 5, title = "Aktivitas Terbaru", headerAction, searchable = false, showTypeFilter = false, filterTypes }: ActivityFeedProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<LogType>>(new Set());
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const prevFirstIdRef = useRef<string | null>(null);

  // Detect new logs prepended to the list (realtime update)
  useEffect(() => {
    if (logs.length === 0) return;
    const currentFirstId = logs[0].id;
    if (prevFirstIdRef.current !== null && prevFirstIdRef.current !== currentFirstId) {
      // Find all new log IDs that appeared before the previous first
      const prevFirstIdx = logs.findIndex((l) => l.id === prevFirstIdRef.current);
      if (prevFirstIdx > 0) {
        const ids = new Set(logs.slice(0, prevFirstIdx).map((l) => l.id));
        setNewLogIds(ids);
        const t = setTimeout(() => setNewLogIds(new Set()), 600);
        return () => clearTimeout(t);
      }
    }
    prevFirstIdRef.current = currentFirstId;
  }, [logs]);

  const toggleType = (type: LogType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setPage(1);
  };

  // Filter logs by type restriction, search + type chips
  const filteredLogs = useMemo(() => {
    let result = logs;
    // Apply type restriction first (hard filter)
    if (filterTypes && filterTypes.length > 0) {
      result = result.filter((log) => filterTypes.includes(log.type as LogType));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.paint_items?.name?.toLowerCase().includes(q) ||
          log.paint_items?.color_code?.toLowerCase().includes(q)
      );
    }
    if (activeTypes.size > 0) {
      result = result.filter((log) => activeTypes.has(log.type as LogType));
    }
    return result;
  }, [logs, filterTypes, search, activeTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const visibleLogs = filteredLogs.slice(start, start + pageSize);

  return (
    <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
            <ClipboardList className="size-4 text-[#64748B]" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#1e344a]">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {headerAction}
          {filteredLogs.length > 0 && (
            <span className="text-xs text-[#94A3B8]">
              {start + 1}–{Math.min(start + pageSize, filteredLogs.length)} dari {filteredLogs.length}
              {filteredLogs.length < logs.length && (
                <span className="text-[#64748B]"> (dari {logs.length} total)</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Filter bar: search + type chips */}
      {(searchable || showTypeFilter) && logs.length > 0 && (
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-white space-y-3">
          {searchable && (
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] group-focus-within:text-[#0e7ad5] transition-colors duration-200" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari nama cat atau kode warna..."
                className="w-full h-10 pl-10 pr-10 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1e344a] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0e7ad5]/20 focus:border-[#0e7ad5] shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] active:bg-[#CBD5E1] transition-all duration-150 cursor-pointer group/clear"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-3.5 text-[#64748B] group-hover/clear:text-[#475569]" />
                </button>
              )}
            </div>
          )}
          {showTypeFilter && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-[#94A3B8]" aria-hidden="true" />
                <span className="text-xs font-medium text-[#64748B] uppercase tracking-wide">Filter Tipe</span>
                {activeTypes.size > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0e7ad5]/10 text-[10px] font-bold text-[#0e7ad5]">
                    {activeTypes.size}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_LOG_TYPES.map((type) => {
                  const isActive = activeTypes.has(type);
                  const colorClasses = LOG_TYPE_COLORS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? `${colorClasses} border-current/30 shadow-sm scale-[1.02]`
                          : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#475569]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-current" : "bg-[#CBD5E1]"}`} />
                        {LOG_TYPE_LABELS[type]}
                      </span>
                    </button>
                  );
                })}
                {activeTypes.size > 0 && (
                  <button
                    onClick={() => { setActiveTypes(new Set()); setPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer flex items-center gap-1"
                  >
                    <X className="size-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-[#F8FAFC]">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 px-5">
            {logs.length === 0 ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto">
                  <ClipboardList className="size-6 text-[#CBD5E1]" aria-hidden="true" />
                </div>
                <p className="text-[#94A3B8] text-sm font-medium">Belum ada transaksi</p>
                <p className="text-[#CBD5E1] text-xs">Transaksi akan muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto">
                  <Search className="size-6 text-[#CBD5E1]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[#64748B] text-sm font-medium">Tidak ada transaksi yang cocok</p>
                  <p className="text-[#94A3B8] text-xs mt-1">Coba ubah kata kunci atau filter</p>
                </div>
                <button
                  onClick={() => { setSearch(""); setActiveTypes(new Set()); setPage(1); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e7ad5]/10 text-xs font-semibold text-[#0e7ad5] hover:bg-[#0e7ad5]/20 transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                  Hapus semua filter
                </button>
              </div>
            )}
          </div>
        ) : (
          visibleLogs.map((log) => {
            const isPositive = log.type === "STOCK_IN" || log.type === "SIDEROOM_RECEIVE";
            const isResidual = log.type === "RESIDUAL_RETURN";
            const isNew = newLogIds.has(log.id);
            return (
              <div
                key={log.id}
                className={`flex items-center justify-between px-5 py-4 sm:py-3.5 hover:bg-[#FAFBFC] transition-colors duration-100 ${isNew ? "animate-slide-in" : ""}`}
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
                <span className={`text-xl font-bold shrink-0 ml-3 tabular-nums ${
                  isResidual ? "text-blue-500" : isPositive ? "text-emerald-600" : "text-red-500"
                }`}>
                  {isPositive ? "+" : isResidual ? "" : "−"}{formatQty(log.qty)}
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
