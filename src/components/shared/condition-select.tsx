"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, Check, Sparkles, Droplets, Palette } from "lucide-react";

interface ConditionOption {
  value: string;
  name: string;
  description: string;
  icon: typeof Sparkles;
  accentBg: string;
  accentText: string;
}

const CONDITIONS: ConditionOption[] = [
  {
    value: "murni",
    name: "Murni",
    description: "Cat sisa asli tanpa campuran apapun",
    icon: Sparkles,
    accentBg: "bg-emerald-100",
    accentText: "text-emerald-700",
  },
  {
    value: "campur_thinner",
    name: "Campur Thinner",
    description: "Cat tercampur thinner saat proses painting",
    icon: Droplets,
    accentBg: "bg-blue-100",
    accentText: "text-blue-700",
  },
  {
    value: "campuran_warna",
    name: "Campuran Warna",
    description: "Cat tercampur warna lain atau hasil mixing",
    icon: Palette,
    accentBg: "bg-violet-100",
    accentText: "text-violet-700",
  },
];

interface ConditionSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Custom paint-condition dropdown with rich option cards,
 * keyboard navigation, and visual consistency with PaintSelect / RoleSelect.
 */
export function ConditionSelect({
  value,
  onChange,
  label = "Kondisi Cat",
  disabled = false,
}: ConditionSelectProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = CONDITIONS.find((c) => c.value === value) || CONDITIONS[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[focusIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusIndex]);

  // Pre-focus selected item when opening
  useEffect(() => {
    if (open) {
      const idx = CONDITIONS.findIndex((c) => c.value === value);
      setFocusIndex(idx >= 0 ? idx : 0);
    }
  }, [open, value]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
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
        } else {
          setFocusIndex((i) => Math.min(i + 1, CONDITIONS.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && focusIndex >= 0) {
          handleSelect(CONDITIONS[focusIndex].value);
        } else if (!open) {
          setOpen(true);
        }
        break;
      case "Escape":
      case "Tab":
        setOpen(false);
        setFocusIndex(-1);
        break;
    }
  };

  const SelectedIcon = selected.icon;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[#334155]">{label}</Label>

      <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
        {/* ── Trigger Button ── */}
        <button
          type="button"
          onClick={() => {
            if (!disabled) setOpen((o) => !o);
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
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected.accentBg} ${selected.accentText}`}
            aria-hidden="true"
          >
            <SelectedIcon className="size-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-[#1e344a] truncate">
              {selected.name}
            </span>
          </span>
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
            aria-label="Pilih kondisi cat"
          >
            <div ref={listRef} className="py-1.5">
              {CONDITIONS.map((cond, idx) => {
                const isSelected = cond.value === value;
                const isFocused = idx === focusIndex;
                const CondIcon = cond.icon;

                return (
                  <button
                    key={cond.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(cond.value)}
                    onMouseEnter={() => setFocusIndex(idx)}
                    className={`
                      flex items-center gap-3 w-full px-4 py-3 text-left transition-colors duration-75 cursor-pointer
                      ${isFocused ? "bg-[#F1F5F9]" : ""}
                      ${isSelected && !isFocused ? "bg-blue-50/50" : ""}
                    `}
                  >
                    {/* Condition icon badge */}
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cond.accentBg} ${cond.accentText}`}
                      aria-hidden="true"
                    >
                      <CondIcon className="size-4.5" />
                    </span>

                    {/* Name + description */}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#1e344a]">
                        {cond.name}
                      </span>
                      <span className="block text-xs text-[#64748B] mt-0.5 leading-snug">
                        {cond.description}
                      </span>
                    </span>

                    {/* Selected check */}
                    {isSelected && (
                      <Check className="size-4 text-[#0e7ad5] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
