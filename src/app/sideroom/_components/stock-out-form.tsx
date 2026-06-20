"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaintSelect } from "@/components/shared/paint-select";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { Spinner } from "@/components/shared/spinner";
import { formatQty } from "@/lib/format-utils";
import { ArrowUp, FlaskConical, Scale } from "lucide-react";
import type { SideroomTabFormProps } from "./types";

const QUICK_CANS = [1, 2, 5, 10, 20];

export function StockOutForm({
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
  const weightPerCan = selectedPaintItem?.weight_per_can ?? 0;
  const qtyKg = qty * weightPerCan;

  const handleQtyChange = (value: number) => {
    if (value >= 1) setQty(value);
  };

  return (
    <>
      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-500" />
      <div className="p-5">
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
            <FlaskConical className="size-5 text-blue-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1e344a]">Ambil Cat dari Gudang (Stock Out)</h2>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
          <PaintSelect paintItems={paintItems} value={selectedPaint} onChange={setSelectedPaint} stockLevels={stockLevels} disabled={isLoading}>
            {selectedPaintItem && currentStock && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
                  Stok di Gudang: {formatQty(currentStock.stock_warehouse)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                  Stok di Sideroom: {formatQty(currentStock.stock_sideroom)}
                </span>
                {weightPerCan > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium">
                    <Scale className="size-3.5 text-slate-400" aria-hidden="true" />
                    {weightPerCan} kg / kaleng
                  </span>
                )}
              </div>
            )}
          </PaintSelect>

          <div className="space-y-1.5">
            <QtyStepper
              label="Jumlah (kaleng)"
              value={qty}
              onChange={handleQtyChange}
              onQuickSelect={setQty}
              step={1}
              min={1}
              decimals={0}
              disabled={isLoading}
              quickValues={QUICK_CANS}
              quickSuffix=""
              unitLabel="kaleng"
              activeChipClass="bg-[#0e7ad5] hover:bg-[#0065b8]"
            />
            {selectedPaintItem && (
              <p className="text-xs text-[#64748B] pl-1">
                Setara <strong className="text-[#1e344a]">{qtyKg.toFixed(2)} kg</strong> ({qty} kaleng × {weightPerCan} kg)
              </p>
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
              placeholder="Nama pekerjaan, work order..."
              className="h-14 text-base rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md bg-[#0e7ad5] hover:bg-[#0065b8] shadow-blue-200 focus-visible:ring-blue-500"
          >
            {isLoading
              ? <><Spinner className="size-5" /> Memproses...</>
              : <><ArrowUp className="size-5" /> Catat Stock Out</>
            }
          </button>
        </form>
      </div>
    </>
  );
}
