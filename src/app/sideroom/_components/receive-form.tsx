"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaintSelect } from "@/components/shared/paint-select";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { Spinner } from "@/components/shared/spinner";
import { formatQty } from "@/lib/format-utils";
import { ArrowDown, FlaskConical, AlertCircle } from "lucide-react";
import type { SideroomTabFormProps } from "./types";

const QUICK_RECEIVE = [0, 0.5, 1, 2, 5]; // includes 0 for "all consumed"

export function ReceiveForm({
  paintItems,
  selectedPaint,
  setSelectedPaint,
  qty,
  setQty,
  notes,
  setNotes,
  isLoading,
  stockLevels,
  selectedPaintItem,
  currentStock,
  onSubmit,
}: SideroomTabFormProps) {
  const handleQtyChange = (value: number) => {
    if (value >= 0) setQty(Math.round(value * 100) / 100);
  };

  return (
    <>
      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />
      <div className="p-5">
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-100">
            <FlaskConical className="size-5 text-amber-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1e344a]">Catat Sisa Cat</h2>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
          <PaintSelect paintItems={paintItems} value={selectedPaint} onChange={setSelectedPaint} stockLevels={stockLevels} disabled={isLoading}>
            {selectedPaintItem && currentStock && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                  Stok di Sideroom: {formatQty(currentStock.stock_sideroom)}
                </span>
              </div>
            )}
          </PaintSelect>

          <div className="space-y-1.5">
            <QtyStepper
              label="Berat Sisa (kg)"
              value={qty}
              onChange={handleQtyChange}
              onQuickSelect={setQty}
              step={0.5}
              min={0}
              decimals={2}
              disabled={isLoading}
              quickValues={QUICK_RECEIVE}
              quickSuffix=" kg"
              quickLabels={{ 0: "0 (habis)" }}
              inlineUnit="kg"
              unitLabel="kg"
              activeChipClass="bg-amber-500 hover:bg-amber-600"
            />
            {qty === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium mt-1">
                <AlertCircle className="size-4 flex-shrink-0" aria-hidden="true" />
                <span>Semua cat habis terpakai — tidak ada sisa yang dikembalikan</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-[#334155]">
              Catatan <span className="font-normal text-[#94A3B8]">(opsional)</span>
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kondisi cat, persentase sisa..."
              className="h-14 text-base rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md bg-amber-500 hover:bg-amber-600 shadow-amber-200 focus-visible:ring-amber-400"
          >
            {isLoading
              ? <><Spinner className="size-5" /> Memproses...</>
              : <><ArrowDown className="size-5" /> {qty === 0 ? "Catat: Semua Habis" : "Catat Sisa Cat"}</>
            }
          </button>
        </form>
      </div>
    </>
  );
}
