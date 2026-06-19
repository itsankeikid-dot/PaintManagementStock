import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/spinner";
import { ArrowUp, AlertTriangle } from "lucide-react";
import type { PaintItem, Stock } from "@/types/database";

interface StockOutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paintItem?: PaintItem;
  currentStock?: Stock & { paint_items: PaintItem };
  /** Quantity in cans (as entered). */
  qty: number;
  /** Quantity converted to kg (cans × weight_per_can). */
  qtyKg: number;
  notes: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export function StockOutConfirmDialog({
  open,
  onOpenChange,
  paintItem,
  currentStock,
  qty,
  qtyKg,
  notes,
  isLoading,
  onConfirm,
}: StockOutConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3 text-[#1e344a]">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-amber-500" aria-hidden="true" />
            </div>
            Konfirmasi Stock Out
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-[#64748B]">
            Pastikan data berikut sudah benar sebelum melanjutkan:
          </p>

          <div className="rounded-xl border-2 border-[#0e7ad5]/20 bg-blue-50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {paintItem && (
                <div
                  className="w-12 h-12 rounded-xl border-2 border-white shadow-sm shrink-0"
                  style={{ backgroundColor: paintItem.color_hex }}
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="font-bold text-[#1e344a] text-base">{paintItem?.name}</p>
                <p className="text-sm text-[#64748B]">
                  {paintItem?.color_code} · {paintItem?.can_size}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#0e7ad5]/15">
              <span className="text-sm font-medium text-[#475569]">Jumlah keluar:</span>
              <span className="text-3xl font-bold text-[#0e7ad5] tabular-nums">
                {qty} <span className="text-base font-semibold">kaleng</span>
                <span className="block text-sm font-semibold text-[#64748B]">{qtyKg.toFixed(2)} kg</span>
              </span>
            </div>

            {currentStock && (
              <p className="text-xs text-[#64748B] bg-white/70 rounded-lg px-3 py-2">
                Gudang setelah keluar:{" "}
                <strong className="text-[#1e344a]">
                  {(currentStock.stock_warehouse - qtyKg).toFixed(2)} kg
                </strong>
                {" · "}Sideroom jadi:{" "}
                <strong className="text-[#1e344a]">
                  {(currentStock.stock_sideroom + qtyKg).toFixed(2)} kg
                </strong>
              </p>
            )}
          </div>

          {notes && (
            <p className="text-sm text-[#64748B] px-1">
              <span className="font-medium text-[#475569]">Catatan:</span> {notes}
            </p>
          )}
        </div>

        <DialogFooter className="flex-row gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {isLoading ? (
              <><Spinner /> Memproses...</>
            ) : (
              <><ArrowUp className="size-4" aria-hidden="true" /> Ya, Catat Stock Out</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
