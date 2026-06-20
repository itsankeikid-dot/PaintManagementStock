"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaintSelect } from "@/components/shared/paint-select";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { ConditionSelect } from "@/components/shared/condition-select";
import { Spinner } from "@/components/shared/spinner";
import { formatQty } from "@/lib/format-utils";
import { Trash2, FlaskConical } from "lucide-react";
import type { SideroomTabFormProps } from "./types";

const QUICK_KG = [0.5, 1, 2, 5];

interface DisposeFormProps extends SideroomTabFormProps {
  condition: string;
  setCondition: (v: string) => void;
}

export function DisposeForm({
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
  condition,
  setCondition,
}: DisposeFormProps) {
  const handleQtyChange = (value: number) => {
    if (value >= 0.01) setQty(Math.round(value * 100) / 100);
  };

  return (
    <>
      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-500" />
      <div className="p-5">
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-100">
            <FlaskConical className="size-5 text-red-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1e344a]">Buang Cat Kadaluarsa / Tercampur</h2>
            <p className="text-xs text-red-600 font-medium mt-0.5">
              Tindakan ini tidak dapat dibatalkan
            </p>
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
              label="Berat Dibuang (kg)"
              value={qty}
              onChange={handleQtyChange}
              onQuickSelect={setQty}
              step={0.5}
              min={0.01}
              decimals={2}
              disabled={isLoading}
              quickValues={QUICK_KG}
              quickSuffix=" kg"
              inlineUnit="kg"
              unitLabel="kg"
              activeChipClass="bg-red-600 hover:bg-red-700"
            />
          </div>

          {/* Condition Select */}
          <ConditionSelect
            value={condition}
            onChange={setCondition}
            disabled={isLoading}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-[#334155]">
              Catatan <span className="font-normal text-[#94A3B8]">(opsional)</span>
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alasan: kadaluarsa, tercampur thinner..."
              className="h-14 text-base rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md bg-red-600 hover:bg-red-700 shadow-red-200 focus-visible:ring-red-500"
          >
            {isLoading
              ? <><Spinner className="size-5" /> Memproses...</>
              : <><Trash2 className="size-5" /> Buang Cat</>
            }
          </button>
        </form>
      </div>
    </>
  );
}
