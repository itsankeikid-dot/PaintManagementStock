"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, Search, Check } from "lucide-react";
import type { PaintItem, Stock } from "@/types/database";

interface PaintSelectProps {
  paintItems: PaintItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Stock levels keyed by paint_item_id — optional, renders stock badges in dropdown */
  stockLevels?: Stock[];
  /** Optional content rendered below the trigger (e.g. selected-item badges). */
  children?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Searchable paint-item dropdown with color swatch, inline stock levels,
 * keyboard navigation, and touch-friendly sizing.
 */
export function PaintSelect({
  paintItems,
  value,
  onChange,
  label = "Item Cat",
  stockLevels,
  children,
  disabled = false,
}: PaintSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusIndex, setFocusIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = paintItems.find((p) => p.id === value);

  // Filtered list
  const filtered = useMemo(() => {
    if (!search.trim()) return paintItems;
    const q = search.toLowerCase();
    return paintItems.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.color_code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [paintItems, search]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setFocusIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Note: the search input is intentionally NOT auto-focused on open.
  // Auto-focusing pops the mobile keyboard before the user wants it; instead
  // the keyboard appears only when the user taps the search field directly.

  // Keep focused item scrolled into view
  useEffect(() => {
    if (focusIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[focusIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusIndex]);

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setOpen(false);
      setSearch("");
      setFocusIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusIndex(0);
        } else {
          setFocusIndex((i) => Math.min(i + 1, filtered.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (open && focusIndex >= 0 && filtered[focusIndex]) {
          handleSelect(filtered[focusIndex].id);
        } else if (!open) {
          setOpen(true);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearch("");
        setFocusIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        setSearch("");
        setFocusIndex(-1);
        break;
    }
  };

  const getStock = (paintItemId: string) =>
    stockLevels?.find((s) => s.paint_item_id === paintItemId);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[#334155]">{label}</Label>

      <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
        {/* ── Trigger Button ── */}
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setOpen((o) => !o);
              if (open) {
                setSearch("");
                setFocusIndex(-1);
              }
            }
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className={`
            flex items-center gap-3 w-full h-14 px-4 rounded-xl border text-base text-left
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]
            cursor-pointer
            disabled:opacity-60 disabled:cursor-not-allowed
            ${open
              ? "border-[#0e7ad5] ring-2 ring-[#0e7ad5]/20 bg-white"
              : "border-[#CBD5E1] bg-white hover:border-[#94A3B8]"
            }
          `}
        >
          {selectedItem ? (
            <>
              <span
                className="w-8 h-8 rounded-lg border-2 border-white shadow-sm shrink-0"
                style={{ backgroundColor: selectedItem.color_hex }}
                aria-hidden="true"
              />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-[#1e344a] truncate">
                  {selectedItem.name}
                </span>
                <span className="block text-xs text-[#64748B]">
                  {selectedItem.color_code} · {selectedItem.can_size}
                </span>
              </span>
            </>
          ) : (
            <span className="flex-1 text-[#94A3B8]">Pilih cat...</span>
          )}
          <ChevronDown
            className={`size-5 text-[#64748B] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {/* ── Dropdown Panel ── */}
        {open && (
          <div
            className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            role="listbox"
            aria-label="Daftar cat"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 h-12 border-b border-[#F1F5F9]">
              <Search className="size-4 text-[#94A3B8] shrink-0" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusIndex(0);
                }}
                placeholder="Cari nama atau kode warna..."
                className="flex-1 text-sm text-[#1e344a] placeholder:text-[#94A3B8] outline-none bg-transparent"
                aria-label="Cari item cat"
              />
            </div>

            {/* Scrollable item list */}
            <div
              ref={listRef}
              className="max-h-64 overflow-y-auto overscroll-contain py-1"
            >
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-[#94A3B8] py-6">
                  Tidak ada item ditemukan
                </p>
              ) : (
                filtered.map((item, idx) => {
                  const stock = getStock(item.id);
                  const isSelected = item.id === value;
                  const isFocused = idx === focusIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(item.id)}
                      onMouseEnter={() => setFocusIndex(idx)}
                      className={`
                        flex items-center gap-3 w-full px-4 py-3 text-left transition-colors duration-75 cursor-pointer
                        ${isFocused ? "bg-[#F1F5F9]" : ""}
                        ${isSelected && !isFocused ? "bg-blue-50/50" : ""}
                      `}
                    >
                      {/* Color swatch */}
                      <span
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-sm shrink-0"
                        style={{ backgroundColor: item.color_hex }}
                        aria-hidden="true"
                      />

                      {/* Name + meta */}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-[#1e344a] truncate">
                          {item.name}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                          <span>{item.color_code}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.can_size}</span>
                          {stock && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700">
                                G: {Number(stock.stock_warehouse).toFixed(1)}
                              </span>
                              <span className="text-amber-700">
                                S: {Number(stock.stock_sideroom).toFixed(1)}
                              </span>
                            </>
                          )}
                        </span>
                      </span>

                      {/* Selected check */}
                      {isSelected && (
                        <Check className="size-4 text-[#0e7ad5] shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer — item count */}
            <div className="px-4 py-2 border-t border-[#F1F5F9] bg-[#FAFBFC]">
              <span className="text-xs text-[#94A3B8]">
                {filtered.length} dari {paintItems.length} item
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Children (stock badges, etc.) */}
      {children}
    </div>
  );
}
