import Link from "next/link";
import { Palette, Users, ChevronRight } from "lucide-react";

export function AdminQuickAccess() {
  return (
    <section className="space-y-3">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
        Admin
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/paint-items">
          <div className="group flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#0e7ad5]/30 transition-all duration-150 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors duration-150">
              <Palette className="size-6 text-[#0e7ad5]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1e344a] text-base">Manage Paint Items</p>
              <p className="text-sm text-[#64748B] mt-0.5">
                Tambah, aktifkan, atau nonaktifkan item cat
              </p>
            </div>
            <ChevronRight className="size-5 text-[#CBD5E1] group-hover:text-[#0e7ad5] transition-colors duration-150 shrink-0" aria-hidden="true" />
          </div>
        </Link>

        <Link href="/admin/users">
          <div className="group flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#0e7ad5]/30 transition-all duration-150 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors duration-150">
              <Users className="size-6 text-violet-600" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1e344a] text-base">Manage Users</p>
              <p className="text-sm text-[#64748B] mt-0.5">
                Tambah operator dan kelola akses PIN
              </p>
            </div>
            <ChevronRight className="size-5 text-[#CBD5E1] group-hover:text-[#0e7ad5] transition-colors duration-150 shrink-0" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </section>
  );
}
