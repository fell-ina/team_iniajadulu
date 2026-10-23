import { redirect } from "next/navigation";
import KelolaPengguna from "@/components/dashboard/KelolaPengguna";
import { ambilProfilDashboard } from "@/lib/dashboard";

/**
 * /dashboard/pengguna — daftar & edit data pengguna (khusus admin).
 * Password tidak bisa diubah dari sini.
 */
export const dynamic = "force-dynamic";

export default async function HalamanPengguna() {
  const profil = await ambilProfilDashboard();

  if (profil?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
            Manajemen pengguna
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#021024] sm:text-4xl">
            Data Pengguna
          </h1>
        </div>
      </div>

      <div className="mt-8">
        <KelolaPengguna />
      </div>
    </div>
  );
}
