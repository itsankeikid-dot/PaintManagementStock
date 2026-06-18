import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Spinner } from "@/components/shared/spinner";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog title, e.g. "Hapus Item Cat". */
  title: string;
  /** Confirmation question. Defaults to the standard irreversible-delete copy. */
  description?: React.ReactNode;
  /** Optional preview card of the entity being deleted (swatch, avatar, etc.). */
  preview?: React.ReactNode;
  /** Optional extra note (e.g. amber warning) shown below the preview. */
  note?: React.ReactNode;
  isDeleting: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
}

const DEFAULT_DESCRIPTION =
  "Apakah kamu yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.";

/**
 * Shared destructive-confirmation dialog used by admin CRUD pages.
 * Caller owns the open/loading state and the actual delete action.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description = DEFAULT_DESCRIPTION,
  preview,
  note,
  isDeleting,
  onConfirm,
  confirmLabel = "Ya, Hapus",
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1e344a] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-red-500" aria-hidden="true" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <p className="text-sm text-[#64748B]">{description}</p>
          {preview}
          {note}
        </div>
        <DialogFooter className="flex-row gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {isDeleting ? (
              <>
                <Spinner /> Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
