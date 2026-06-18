import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/spinner";
import { AlertTriangle, PaintBucket, Trash2 } from "lucide-react";
import type { PaintItem, Stock } from "@/types/database";

interface SideroomConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDispose: boolean;
  paintItem?: PaintItem;
  currentStock?: Stock & { paint_items: PaintItem };
  qty: number;
  notes: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export function SideroomConfirmDialog({
  open,
  onOpenChange,
  isDispose,
  paintItem,
  currentStock,
  qty,
  notes,
  isLoading,
  onConfirm,
}: SideroomConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3 text-[#1e344a]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDispose ? "bg-red-100" : "bg-purple-100"}`}>
              {isDispose
                ? <AlertTriangle className="size-5 text-red-500" aria-hidden="true" />
                : <PaintBucket className="size-5 text-purple-500" aria-hidden="true" />
              }
            </div>
            {isDispose ? "Konfirmasi Dispose" : "Konfirmasi Pemakaian"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isDispose && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-red-800">Tindakan ini tidak dapat dibatalkan!</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Cat kadaluarsa ±8 jam setelah dicampur thinner dan tidak dapat digunakan kembali.
                </p>
              </div>
            </div>
          )}

          <div className={`rounded-xl border-2 p-4 space-y-3 ${isDispose ? "border-red-200 bg-red-50/50" : "border-purple-200 bg-purple-50/50"}`}>
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

            <div className={`flex items-center justify-between pt-2 border-t ${isDispose ? "border-red-200" : "border-purple-200"}`}>
              <span className="text-sm font-medium text-[#475569]">
                {isDispose ? "Jumlah dispose:" : "Jumlah dipakai:"}
              </span>
              <span className={`text-3xl font-bold tabular-nums ${isDispose ? "text-red-600" : "text-purple-600"}`}>
                {qty.toFixed(2)} <span className="text-base font-semibold">kg</span>
              </span>
            </div>

            {currentStock && (
              <p className="text-xs text-[#64748B] bg-white/70 rounded-lg px-3 py-2">
                Sisa sideroom setelah ini:{" "}
                <strong className="text-[#1e344a]">{(currentStock.stock_sideroom - qty).toFixed(2)} kg</strong>
              </p>
            )}
          </div>

          {notes && (
            <p className="text-sm text-[#64748B] px-1">
              <span className="font-medium text-[#475569]">
                {isDispose ? "Alasan:" : "Catatan:"}
              </span>{" "}
              {notes}
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
            className={`flex-1 h-12 rounded-xl text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDispose
                ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                : "bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-500"
            }`}
          >
            {isLoading ? (
              <><Spinner /> Memproses...</>
            ) : isDispose ? (
              <><Trash2 className="size-4" aria-hidden="true" /> Ya, Dispose</>
            ) : (
              <><PaintBucket className="size-4" aria-hidden="true" /> Ya, Catat Pemakaian</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
