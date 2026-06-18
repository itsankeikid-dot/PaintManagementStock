"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createPaintItem,
  updatePaintItem,
  togglePaintItemActive,
  deletePaintItem,
} from "@/actions/paint-items";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { downloadCSV } from "@/lib/csv-utils";
import { formatDateReadableWIB } from "@/lib/date-utils";
import type { PaintItem } from "@/types/database";

export type PaintItemForm = {
  name: string;
  color_code: string;
  color_hex: string;
  can_size: string;
  weight_per_can: number;
  category: string;
};

export const EMPTY_PAINT_ITEM: PaintItemForm = {
  name: "",
  color_code: "",
  color_hex: "#808080",
  can_size: "1 Galon",
  weight_per_can: 0,
  category: "Standard",
};

type StatusFilter = "all" | "active" | "inactive";

/**
 * Owns paint-item master data: CRUD handlers (add/edit/toggle/delete),
 * search + status filtering (via usePaginatedSearch), and CSV export.
 * The page stays purely presentational.
 */
export function usePaintItems(initialItems: PaintItem[]) {
  const [items, setItems] = useState(initialItems);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_PAINT_ITEM);
  const [isAdding, setIsAdding] = useState(false);

  // Edit dialog
  const [editingItem, setEditingItem] = useState<PaintItem | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_PAINT_ITEM);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete dialog
  const [deletingItem, setDeletingItem] = useState<PaintItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle loading per-row
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeCount = items.filter((i) => i.is_active).length;
  const inactiveCount = items.length - activeCount;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.weight_per_can <= 0) {
      toast.error("Berat per kaleng harus lebih dari 0");
      return;
    }
    setIsAdding(true);
    try {
      const result = await createPaintItem(newItem);
      if (result.success) {
        toast.success("Item cat berhasil ditambahkan");
        setShowAddDialog(false);
        setNewItem(EMPTY_PAINT_ITEM);
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal menambahkan item");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsAdding(false);
    }
  };

  const openEdit = (item: PaintItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      color_code: item.color_code,
      color_hex: item.color_hex,
      can_size: item.can_size,
      weight_per_can: item.weight_per_can,
      category: item.category,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (editForm.weight_per_can <= 0) {
      toast.error("Berat per kaleng harus lebih dari 0");
      return;
    }
    setIsSavingEdit(true);
    try {
      const result = await updatePaintItem(editingItem.id, editForm);
      if (result.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...editForm } : item
          )
        );
        toast.success("Item cat berhasil diperbarui");
        setEditingItem(null);
      } else {
        toast.error(result.error || "Gagal memperbarui item");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    const result = await togglePaintItemActive(id, !currentActive);
    if (result.success) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_active: !currentActive } : item
        )
      );
      toast.success(`Item ${!currentActive ? "diaktifkan" : "dinonaktifkan"}`);
    } else {
      toast.error(result.error || "Gagal mengubah status");
    }
    setTogglingId(null);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const result = await deletePaintItem(deletingItem.id);
      if (result.success) {
        setItems((prev) => prev.filter((item) => item.id !== deletingItem.id));
        toast.success("Item cat berhasil dihapus");
        setDeletingItem(null);
      } else {
        toast.error(result.error || "Gagal menghapus item");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
    }
  };

  const { filtered, paginated, page, totalPages, setPage, rangeLabel } =
    usePaginatedSearch({
      items,
      filterFn: (item) => {
        if (statusFilter === "active" && !item.is_active) return false;
        if (statusFilter === "inactive" && item.is_active) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            item.name.toLowerCase().includes(term) ||
            item.color_code.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
          );
        }
        return true;
      },
    });

  const handleExportCSV = () => {
    const filterLabels: string[] = [];
    if (searchTerm) filterLabels.push(`Pencarian: "${searchTerm}"`);
    if (statusFilter !== "all") filterLabels.push(`Status: ${statusFilter === "active" ? "Aktif" : "Nonaktif"}`);

    downloadCSV(
      `paint-items-${new Date().toISOString().split("T")[0]}.csv`,
      ["Nama", "Kode Warna", "Hex", "Ukuran Kaleng", "Berat/Kaleng (kg)", "Kategori", "Status", "Dibuat"],
      filtered.map((i) => [
        i.name,
        i.color_code,
        i.color_hex,
        i.can_size,
        String(i.weight_per_can),
        i.category,
        i.is_active ? "Aktif" : "Nonaktif",
        formatDateReadableWIB(i.created_at),
      ]),
      {
        title: "Laporan Data Item Cat",
        info: [
          `Total: ${filtered.length} item`,
          `Aktif: ${filtered.filter((i) => i.is_active).length}, Nonaktif: ${filtered.filter((i) => !i.is_active).length}`,
          ...(filterLabels.length ? [`Filter: ${filterLabels.join(", ")}`] : []),
        ],
        summary: [
          [`Total: ${filtered.length} item`, "", "", "", "", "", "", ""],
        ],
      }
    );
  };

  return {
    items,
    activeCount,
    inactiveCount,
    // add
    showAddDialog,
    setShowAddDialog,
    newItem,
    setNewItem,
    isAdding,
    handleAdd,
    // edit
    editingItem,
    setEditingItem,
    editForm,
    setEditForm,
    isSavingEdit,
    openEdit,
    handleEdit,
    // delete
    deletingItem,
    setDeletingItem,
    isDeleting,
    handleDelete,
    // toggle
    togglingId,
    handleToggle,
    // search/filter
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    // table data
    filtered,
    paginated,
    page,
    totalPages,
    setPage,
    rangeLabel,
    // export
    handleExportCSV,
  };
}
