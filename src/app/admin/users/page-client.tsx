"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, UserRound, Pencil, Search, Download } from "lucide-react";
import { ROLE_LABELS } from "@/lib/role-config";
import { Spinner } from "@/components/shared/spinner";
import { PinIndicator } from "@/components/shared/pin-indicator";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useUsers, type Profile } from "@/hooks/use-users";
import type { UserRole } from "@/types/database";
import { ROLE_STYLES, ROLE_ICONS } from "./_components/role-display";
import { UsersTable } from "./_components/users-table";
import { RoleSelect } from "./_components/role-select";

interface UsersPageClientProps {
  initialProfiles: Profile[];
}

/** Common Tailwind class for toolbar outline buttons */
const TOOLBAR_OUTLINE =
  "inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] shadow-sm transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

/** Common Tailwind class for toolbar primary buttons */
const TOOLBAR_PRIMARY =
  "inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-white text-sm font-semibold shadow-sm shadow-blue-200 transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

/**
 * Admin page for managing users.
 * Supports full CRUD: create, edit (name/PIN/role), delete.
 */
export default function UsersPageClient({ initialProfiles }: UsersPageClientProps) {
  const u = useUsers(initialProfiles);

  return (
    <div className="space-y-6">
      {/* ── Top bar: search + add button ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
          <Input
            placeholder="Cari nama atau role..."
            value={u.searchTerm}
            onChange={(e) => { u.setSearchTerm(e.target.value); u.setPage(1); }}
            className="h-10 pl-9 rounded-xl border-[#CBD5E1]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={u.handleExportCSV} className={TOOLBAR_OUTLINE}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </button>

          <Dialog open={u.showAddDialog} onOpenChange={u.setShowAddDialog}>
            <DialogTrigger render={<button className={TOOLBAR_PRIMARY}><Plus className="size-4" aria-hidden="true" />Tambah User</button>} />
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#1e344a] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <UserRound className="size-4 text-[#0e7ad5]" aria-hidden="true" />
                  </div>
                  Tambah User Baru
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={u.handleAdd} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#334155]">Nama</Label>
                  <Input
                    value={u.newUser.name}
                    onChange={(e) => u.setNewUser({ ...u.newUser, name: e.target.value })}
                    placeholder="contoh: Operator Gudang 1"
                    required
                    className="h-11 rounded-xl border-[#CBD5E1]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#334155]">
                    PIN <span className="font-normal text-[#94A3B8]">(4 digit)</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={u.newUser.pin}
                    onChange={(e) => u.setNewUser({ ...u.newUser, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="1234"
                    required
                    className="h-11 rounded-xl border-[#CBD5E1] font-mono tracking-[0.4em] text-lg"
                  />
                  <PinIndicator length={u.newUser.pin.length} />
                </div>
                <div className="space-y-2">
                  <RoleSelect value={u.newUser.role} onChange={(v) => u.setNewUser({ ...u.newUser, role: v })} />
                </div>
                <button
                  type="submit"
                  disabled={u.isAdding}
                  className="w-full h-11 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {u.isAdding ? <><Spinner /> Menyimpan...</> : <><Plus className="size-4" />Buat User</>}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={<UserRound className="size-5 text-slate-500" aria-hidden="true" />}
          label="Total User"
          value={u.profiles.length}
        />
        {(["admin", "warehouse", "sideroom", "office"] as UserRole[]).map((role) => {
          const s = ROLE_STYLES[role];
          return (
            <StatCard
              key={role}
              icon={ROLE_ICONS[role]}
              label={ROLE_LABELS[role]}
              value={u.roleCounts[role] ?? 0}
              containerClass={`${s.bg} ${s.border}`}
              iconBgClass="bg-white/60"
              valueClass={s.text}
              labelClass={`${s.text} opacity-75`}
            />
          );
        })}
      </div>

      {/* ── Table ── */}
      <UsersTable
        allProfilesCount={u.profiles.length}
        filteredCount={u.filtered.length}
        paginated={u.paginated}
        searchTerm={u.searchTerm}
        onAddClick={() => u.setShowAddDialog(true)}
        onEdit={u.openEdit}
        onDelete={u.setDeletingProfile}
        page={u.page}
        totalPages={u.totalPages}
        setPage={u.setPage}
        rangeLabel={u.rangeLabel}
      />

      {/* ── Edit Dialog ── */}
      <Dialog open={!!u.editingProfile} onOpenChange={(open) => !open && u.setEditingProfile(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1e344a] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Pencil className="size-4 text-[#0e7ad5]" aria-hidden="true" />
              </div>
              Edit User
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={u.handleEdit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#334155]">Nama</Label>
              <Input
                value={u.editForm.name}
                onChange={(e) => u.setEditForm({ ...u.editForm, name: e.target.value })}
                required
                className="h-11 rounded-xl border-[#CBD5E1]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#334155]">
                PIN Baru <span className="font-normal text-[#94A3B8]">(kosongkan jika tidak ingin mengubah)</span>
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={u.editForm.pin}
                onChange={(e) => u.setEditForm({ ...u.editForm, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="PIN baru (opsional)"
                className="h-11 rounded-xl border-[#CBD5E1] font-mono tracking-[0.4em] text-lg"
              />
              {u.editForm.pin && <PinIndicator length={u.editForm.pin.length} />}
            </div>
            <div className="space-y-2">
              <RoleSelect value={u.editForm.role} onChange={(v) => u.setEditForm({ ...u.editForm, role: v })} />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => u.setEditingProfile(null)}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={u.isSavingEdit}
                className="flex-1 h-11 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {u.isSavingEdit ? <><Spinner /> Menyimpan...</> : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDeleteDialog
        open={!!u.deletingProfile}
        onOpenChange={(open) => !open && u.setDeletingProfile(null)}
        title="Hapus User"
        description="Apakah kamu yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
        isDeleting={u.isDeleting}
        onConfirm={u.handleDelete}
        preview={
          u.deletingProfile && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-[#64748B]">
                  {u.deletingProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-bold text-[#1e344a] text-sm">{u.deletingProfile.name}</p>
                <p className="text-xs text-[#64748B]">{ROLE_LABELS[u.deletingProfile.role]}</p>
              </div>
            </div>
          )
        }
      />
    </div>
  );
}
