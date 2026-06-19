"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStockIn } from "@/actions/transactions";
import type { PaintItem } from "@/types/database";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Spinner } from "@/components/shared/spinner";
import { PaintSelect } from "@/components/shared/paint-select";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { useTransactionForm } from "@/hooks/use-transaction-form";
import { ArrowDown, PackageCheck, Scale } from "lucide-react";

interface WarehouseFormProps {
  paintItems: PaintItem[];
}

const QUICK_QUANTITIES = [1, 2, 5, 10, 20];

/**
 * Warehouse operator page.
 * Stock-In only: receiving new paint into the warehouse. Stock-Out (paint
 * leaving to the painting area) is now handled on the Sideroom page, since
 * the sideroom operator both takes paint out and reconciles the residual.
 */
export default function WarehousePage({ paintItems }: WarehouseFormProps) {
  const {
    selectedPaint,
    setSelectedPaint,
    qty,
    setQty,
    notes,
    setNotes,
    isLoading,
    stockLevels,
    recentLogs,
    execute,
    validateAndProceed,
  } = useTransactionForm({ initialQty: 1 });

  const selectedPaintItem = paintItems.find((p) => p.id === selectedPaint);
  const currentStock = stockLevels.find((s) => s.paint_item_id === selectedPaint);

  // qty is entered in cans; stock is tracked in kg.
  const weightPerCan = selectedPaintItem?.weight_per_can ?? 0;
  const qtyKg = qty * weightPerCan;

  const handleQtyChange = (value: number) => {
    if (value >= 1) setQty(value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Stock In needs no confirm dialog and no stock ceiling.
    validateAndProceed({ needsConfirm: false, proceed: executeTransaction });
  };

  const executeTransaction = () => {
    execute(
      () => createStockIn({ paint_item_id: selectedPaint, qty, notes: notes || undefined }),
      {
        successMessage: `Stock In: ${qty} kaleng (${qtyKg.toFixed(2)} kg) ${selectedPaintItem?.name} berhasil dicatat`,
      }
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-5 items-start">

      {/* ── Transaction Form ── */}
      <div className="md:col-span-1 bg-white rounded-2xl border-2 border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
        <div className="p-5">
        {/* Form header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E2E8F0]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
            <PackageCheck className="size-5 text-emerald-600" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#1e344a]">
            Terima Cat (Stock In)
          </h2>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5" autoComplete="off">
          <PaintSelect paintItems={paintItems} value={selectedPaint} onChange={setSelectedPaint} stockLevels={stockLevels} disabled={isLoading}>
            {selectedPaintItem && currentStock && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  Stok di Gudang: {currentStock.stock_warehouse.toFixed(2)} kg
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium">
                  <Scale className="size-3.5 text-slate-400" aria-hidden="true" />
                  {weightPerCan} kg / kaleng
                </span>
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
              quickValues={QUICK_QUANTITIES}
              unitLabel="kaleng"
              activeChipClass="bg-emerald-600 focus-visible:ring-emerald-500"
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
              placeholder="Nama supplier, nomor PO..."
              className="h-14 text-base rounded-xl border-[#CBD5E1] focus:ring-2 focus:ring-[#0e7ad5]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 focus-visible:ring-emerald-500"
          >
            {isLoading ? (
              <><Spinner className="size-5" /> Memproses...</>
            ) : (
              <><ArrowDown className="size-5" aria-hidden="true" /> Catat Stock In</>
            )}
          </button>
        </form>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="md:col-span-1">
        <ActivityFeed logs={recentLogs} pageSize={5} filterTypes={["STOCK_IN", "STOCK_OUT"]} />
      </div>
    </div>
  );
}
