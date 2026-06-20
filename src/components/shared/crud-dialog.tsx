import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/spinner";

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Icon element rendered in the title badge. */
  icon: React.ReactNode;
  /** Dialog title text. */
  title: string;
  /** Form submit handler. */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether the form is currently submitting. */
  isSubmitting: boolean;
  /** Label for the submit button. */
  submitLabel: string;
  /** Label for the cancel button. Default "Batal". */
  cancelLabel?: string;
  /** Whether to show the cancel button. Default true for edit dialogs. */
  showCancel?: boolean;
  /** Cancel handler for the cancel button. */
  onCancel?: () => void;
  children: React.ReactNode;
}

/** Common Tailwind classes for dialog action buttons */
const BTN_PRIMARY =
  "flex-1 h-11 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

const BTN_CANCEL =
  "flex-1 h-11 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]";

const BTN_SUBMIT_FULL =
  "w-full h-11 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

/**
 * Reusable CRUD dialog: wraps Dialog with a title badge, form, and
 * submit/cancel buttons with loading state. Used for add/edit forms
 * in admin pages.
 */
export function CrudDialog({
  open,
  onOpenChange,
  icon,
  title,
  onSubmit,
  isSubmitting,
  submitLabel,
  cancelLabel = "Batal",
  showCancel = false,
  onCancel,
  children,
}: CrudDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1e344a] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              {icon}
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-1">
          {children}
          {showCancel ? (
            <div className="flex gap-3">
              <button type="button" onClick={onCancel} className={BTN_CANCEL}>
                {cancelLabel}
              </button>
              <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
                {isSubmitting ? <><Spinner /> Menyimpan...</> : submitLabel}
              </button>
            </div>
          ) : (
            <button type="submit" disabled={isSubmitting} className={BTN_SUBMIT_FULL}>
              {isSubmitting ? <><Spinner /> Menyimpan...</> : submitLabel}
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
