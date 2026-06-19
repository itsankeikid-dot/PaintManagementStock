"use client";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Palette, CircleCheck, CircleX, Pencil, Search, Download } from "lucide-react";
import { Spinner } from "@/components/shared/spinner";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { usePaintItems } from "@/hooks/use-paint-items";
import type { PaintItem } from "@/types/database";
import { PaintItemFormFields } from "./_components/paint-item-form-fields";
import { PaintItemsTable } from "./_components/paint-items-table";

interface PaintItemsPageClientProps {
  initialItems: PaintItem[];
}

/**
 * Admin page for managing paint items (master data).
 * Supports full CRUD: create, edit, toggle active/inactive, delete.
 */
export default function PaintItemsPageClient({ initialItems }: PaintItemsPageClientProps) {
  const pi = usePaintItems(initialItems);

  return (
    <div className="space-y-6">
      {/* ── Top bar: search + filter + add ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
            <Input
              placeholder="Cari nama, kode warna, kategori..."
              value={pi.searchTerm}
              onChange={(e) => { pi.setSearchTerm(e.target.value); pi.setPage(1); }}
              className="h-10 pl-9 rounded-xl border-[#CBD5E1]"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white p-1">
            {(["all", "active", "inactive"] as const).map((val) => (
              <button
                key={val}
                onClick={() => { pi.setStatusFilter(val); pi.setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  pi.statusFilter === val
                    ? "bg-[#0e7ad5] text-white shadow-sm"
                    : "text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                {val === "all" ? "Semua" : val === "active" ? "Aktif" : "Nonaktif"}
              </button>
            ))}
          </div>
        </div>

        {/* Right: export + add button */}
        <div className="flex items-center gap-2">
          <button
            onClick={pi.handleExportCSV}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] shadow-sm transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </button>

          <Dialog open={pi.showAddDialog} onOpenChange={pi.setShowAddDialog}>
            <DialogTrigger
              render={
                <button className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-white text-sm font-semibold shadow-sm shadow-blue-200 transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah Item Cat
                </button>
              }
            />
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#1e344a] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Palette className="size-4 text-[#0e7ad5]" aria-hidden="true" />
                  </div>
                  Tambah Item Cat
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={pi.handleAdd} className="space-y-4 pt-1">
                <PaintItemFormFields form={pi.newItem} setForm={pi.setNewItem} />
                <button
                  type="submit"
                  disabled={pi.isAdding}
                  className="w-full h-11 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {pi.isAdding ? <><Spinner /> Menyimpan...</> : <><Plus className="size-4" />Tambah Item Cat</>}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total items card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Palette className="size-5 text-slate-500" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-[#1e344a] tabular-nums">{pi.items.length}</p>
            <p className="text-xs font-medium text-[#64748B]">Total Item</p>
          </div>
        </div>
        {/* Active card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
            <CircleCheck className="size-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">{pi.activeCount}</p>
            <p className="text-xs font-medium text-emerald-700 opacity-75">Aktif</p>
          </div>
        </div>
        {/* Inactive card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
            <CircleX className="size-5 text-slate-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-600 tabular-nums">{pi.inactiveCount}</p>
            <p className="text-xs font-medium text-slate-600 opacity-75">Nonaktif</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <PaintItemsTable
        allItemsCount={pi.items.length}
        filteredCount={pi.filtered.length}
        paginated={pi.paginated}
        searchTerm={pi.searchTerm}
        statusFilter={pi.statusFilter}
        togglingId={pi.togglingId}
        onAddClick={() => pi.setShowAddDialog(true)}
        onToggle={pi.handleToggle}
        onEdit={pi.openEdit}
        onDelete={pi.setDeletingItem}
        page={pi.page}
        totalPages={pi.totalPages}
        setPage={pi.setPage}
        rangeLabel={pi.rangeLabel}
      />

      {/* ── Edit Dialog ── */}
      <Dialog open={!!pi.editingItem} onOpenChange={(open) => !open && pi.setEditingItem(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1e344a] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Pencil className="size-4 text-[#0e7ad5]" aria-hidden="true" />
              </div>
              Edit Item Cat
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={pi.handleEdit} className="space-y-4 pt-1">
            <PaintItemFormFields form={pi.editForm} setForm={pi.setEditForm} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => pi.setEditingItem(null)}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pi.isSavingEdit}
                className="flex-1 h-11 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {pi.isSavingEdit ? <><Spinner /> Menyimpan...</> : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDeleteDialog
        open={!!pi.deletingItem}
        onOpenChange={(open) => !open && pi.setDeletingItem(null)}
        title="Hapus Item Cat"
        description="Apakah kamu yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan."
        isDeleting={pi.isDeleting}
        onConfirm={pi.handleDelete}
        preview={
          pi.deletingItem && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div
                className="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0"
                style={{ backgroundColor: pi.deletingItem.color_hex }}
                aria-hidden="true"
              />
              <div>
                <p className="font-bold text-[#1e344a] text-sm">{pi.deletingItem.name}</p>
                <p className="text-xs text-[#64748B]">
                  {pi.deletingItem.color_code} · {pi.deletingItem.can_size}
                </p>
              </div>
            </div>
          )
        }
        note={
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Jika item memiliki data stok atau riwayat transaksi, gunakan <strong>Nonaktifkan</strong> saja.
          </p>
        }
      />
    </div>
  );
}
