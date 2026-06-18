"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** e.g. "1–10 dari 47" */
  rangeLabel?: string;
}

/**
 * Reusable pagination footer — matches ActivityFeed pill style.
 */
export function Pagination({ currentPage, totalPages, onPageChange, rangeLabel }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#F1F5F9] bg-[#FAFBFC]">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Halaman sebelumnya"
        className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-1">
        {rangeLabel && (
          <span className="text-xs text-[#94A3B8] mr-2">{rangeLabel}</span>
        )}
        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          const isActive = p === currentPage;
          const show = p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
          const showEllipsisBefore = p === currentPage - 2 && currentPage > 3;
          const showEllipsisAfter = p === currentPage + 2 && currentPage < totalPages - 2;

          if (showEllipsisBefore || showEllipsisAfter) {
            return <span key={p} className="text-[#94A3B8] text-xs px-1">&hellip;</span>;
          }
          if (!show) return null;

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
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
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Halaman berikutnya"
        className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
