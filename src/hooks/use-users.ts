"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createUser, updateUser, deleteUser } from "@/actions/users";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { downloadCSV } from "@/lib/csv-utils";
import { formatDateReadableWIB } from "@/lib/date-utils";
import { ROLE_LABELS } from "@/lib/role-config";
import type { UserRole } from "@/types/database";

export type Profile = {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type UserForm = { name: string; pin: string; role: UserRole };

export const EMPTY_USER: UserForm = { name: "", pin: "", role: "warehouse" };

/**
 * Owns user master data: CRUD handlers (add/edit/delete), search filtering
 * (via usePaginatedSearch), role counts, and CSV export. The page stays
 * presentational.
 */
export function useUsers(initialProfiles: Profile[]) {
  const [profiles, setProfiles] = useState(initialProfiles);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [isAdding, setIsAdding] = useState(false);

  // Edit dialog
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_USER);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete dialog
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const roleCounts = useMemo(
    () =>
      profiles.reduce(
        (acc, p) => ({ ...acc, [p.role]: (acc[p.role] ?? 0) + 1 }),
        {} as Record<string, number>
      ),
    [profiles]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.pin.length !== 4) {
      toast.error("PIN harus tepat 4 digit");
      return;
    }
    setIsAdding(true);
    try {
      const result = await createUser(newUser);
      if (result.success) {
        toast.success("User berhasil ditambahkan");
        setShowAddDialog(false);
        setNewUser(EMPTY_USER);
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal membuat user");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsAdding(false);
    }
  };

  const openEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setEditForm({ name: profile.name, pin: "", role: profile.role });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    if (editForm.pin && editForm.pin.length !== 4) {
      toast.error("PIN harus tepat 4 digit");
      return;
    }
    setIsSavingEdit(true);
    try {
      const updateData: Partial<UserForm> = {
        name: editForm.name,
        role: editForm.role,
      };
      // Only update PIN if user typed a new one
      if (editForm.pin) updateData.pin = editForm.pin;

      const result = await updateUser(editingProfile.id, updateData);
      if (result.success) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === editingProfile.id
              ? { ...p, name: editForm.name, role: editForm.role }
              : p
          )
        );
        toast.success("User berhasil diperbarui");
        setEditingProfile(null);
      } else {
        toast.error(result.error || "Gagal memperbarui user");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProfile) return;
    setIsDeleting(true);
    try {
      const result = await deleteUser(deletingProfile.id);
      if (result.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== deletingProfile.id));
        toast.success("User berhasil dihapus");
        setDeletingProfile(null);
      } else {
        toast.error(result.error || "Gagal menghapus user");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(false);
    }
  };

  const { filtered, paginated, page, totalPages, setPage, rangeLabel } =
    usePaginatedSearch({
      items: profiles,
      filterFn: (p) => {
        const term = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.role.toLowerCase().includes(term) ||
          ROLE_LABELS[p.role].toLowerCase().includes(term)
        );
      },
    });

  const handleExportCSV = () => {
    const roleBreakdown = (["admin", "warehouse", "sideroom"] as UserRole[])
      .map((r) => `${ROLE_LABELS[r]}: ${roleCounts[r] ?? 0}`)
      .join(", ");
    downloadCSV(
      `users-${new Date().toISOString().split("T")[0]}.csv`,
      ["Nama", "Role", "Dibuat"],
      filtered.map((p) => [p.name, ROLE_LABELS[p.role], formatDateReadableWIB(p.created_at)]),
      {
        title: "Laporan Data User",
        info: [
          `Total: ${filtered.length} user`,
          roleBreakdown,
          ...(searchTerm ? [`Filter pencarian: "${searchTerm}"`] : []),
        ],
        summary: [
          [`Total: ${filtered.length} user`, "", ""],
        ],
      }
    );
  };

  return {
    profiles,
    roleCounts,
    // add
    showAddDialog,
    setShowAddDialog,
    newUser,
    setNewUser,
    isAdding,
    handleAdd,
    // edit
    editingProfile,
    setEditingProfile,
    editForm,
    setEditForm,
    isSavingEdit,
    openEdit,
    handleEdit,
    // delete
    deletingProfile,
    setDeletingProfile,
    isDeleting,
    handleDelete,
    // search
    searchTerm,
    setSearchTerm,
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
