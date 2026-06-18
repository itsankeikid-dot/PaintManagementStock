import { Pagination } from "@/components/shared/pagination";
import { UserRound, Search, Pencil, Trash2, Plus } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateWIB } from "@/lib/date-utils";
import { ROLE_STYLES, ROLE_ICONS } from "./role-display";
import type { Profile } from "@/hooks/use-users";

interface UsersTableProps {
  allProfilesCount: number;
  filteredCount: number;
  paginated: Profile[];
  searchTerm: string;
  onAddClick: () => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  // pagination
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  rangeLabel?: string;
}

export function UsersTable({
  allProfilesCount,
  filteredCount,
  paginated,
  searchTerm,
  onAddClick,
  onEdit,
  onDelete,
  page,
  totalPages,
  setPage,
  rangeLabel,
}: UsersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {["Nama", "Role", "PIN", "Dibuat", "Aksi"].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F8FAFC]">
          {allProfilesCount === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <UserRound className="size-7 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1e344a]">Belum ada user</p>
                    <p className="text-sm text-[#94A3B8] mt-1">Tambahkan user pertama untuk memulai</p>
                  </div>
                  <button
                    onClick={onAddClick}
                    className="mt-2 inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#0e7ad5] hover:bg-[#0065b8] text-white text-sm font-semibold shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Tambah User
                  </button>
                </div>
              </td>
            </tr>
          ) : filteredCount === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Search className="size-6 text-[#CBD5E1]" />
                  <p className="text-sm text-[#94A3B8]">Tidak ada user yang cocok dengan &ldquo;{searchTerm}&rdquo;</p>
                </div>
              </td>
            </tr>
          ) : (
            paginated.map((profile) => {
              const s = ROLE_STYLES[profile.role];
              return (
                <tr
                  key={profile.id}
                  className="hover:bg-[#FAFBFC] transition-colors duration-100"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-[#64748B]" aria-hidden="true">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-[#1e344a] text-sm whitespace-nowrap">
                        {profile.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap ${s.bg} ${s.border} ${s.text}`}>
                      {ROLE_ICONS[profile.role]}
                      {ROLE_LABELS[profile.role]}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex gap-1" aria-label="PIN tersembunyi">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#CBD5E1]" aria-hidden="true" />
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="text-sm text-[#94A3B8] whitespace-nowrap">
                      {formatDateWIB(profile.created_at)}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEdit(profile)}
                        aria-label={`Edit ${profile.name}`}
                        className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:border-blue-200 hover:text-[#0e7ad5] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7ad5]"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => onDelete(profile)}
                        aria-label={`Hapus ${profile.name}`}
                        className="w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        rangeLabel={rangeLabel}
      />
    </div>
  );
}
